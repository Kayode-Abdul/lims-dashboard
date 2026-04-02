<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        // 1. Try Local Authentication
        if (Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            RateLimiter::clear($this->throttleKey());
            return;
        }

        // 2. Cloud Fallback (If local fails, try the live server)
        if ($this->attemptCloudAuthentication()) {
            RateLimiter::clear($this->throttleKey());
            return;
        }

        RateLimiter::hit($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.failed'),
        ]);
    }

    /**
     * Try to authenticate against the live server and provision local data if successful.
     */
    protected function attemptCloudAuthentication(): bool
    {
        // Get the sync URL from .env or db
        $lab = \App\Models\Lab::first();
        $syncUrl = ($lab && $lab->sync_url)
            ? $lab->sync_url
            : env('SYNC_LIVE_SERVER_URL', 'https://YOUR_LIVE_SERVER.com/api/sync');

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(15)->post("{$syncUrl}/login", [
                'email' => $this->email,
                'password' => $this->password,
            ]);

            if ($response->successful() && $response->json('status') === 'success') {
                $userData = $response->json('user');
                $labData = $response->json('lab');

                // Provision Lab record locally
                if ($labData) {
                    $localLab = \App\Models\Lab::updateOrCreate(
                    ['sync_id' => $labData['sync_id']],
                        \Illuminate\Support\Arr::except($labData, ['id', 'is_synced'])
                    );
                    $userData['lab_id'] = $localLab->id;
                }

                // Provision User record locally
                $localUser = \App\Models\User::updateOrCreate(
                ['email' => $userData['email']],
                    \Illuminate\Support\Arr::except($userData, ['id', 'is_synced'])
                );

                // Now log in the local user
                Auth::login($localUser, $this->boolean('remember'));
                return true;
            }
        }
        catch (\Exception $e) {
            // Log error but allow fall-through to standard "failed" message
            \Illuminate\Support\Facades\Log::warning("Cloud Auth Fallback Failed: " . $e->getMessage());
        }

        return false;
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (!RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')) . '|' . $this->ip());
    }
}