<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'lab_name' => 'required|string|max:255|unique:labs,name',
            'lab_email' => 'nullable|string|email|max:255',
            'lab_address' => 'nullable|string|max:255',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Create Lab
        $lab = \App\Models\Lab::create([
            'name' => $request->lab_name,
            'slug' => \Illuminate\Support\Str::slug($request->lab_name),
            'email' => $request->lab_email,
            'address' => $request->lab_address,
            'is_active' => true,
            'subscription_status' => 'active', // Default to active for trial
            'expires_at' => now()->addDays(30), // 30 Day Trial
        ]);

        // Create User (Admin)
        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'admin',
            'lab_id' => $lab->id,
        ]);

        // Attach User to Lab (Support Many-to-Many if applicable, maintaining consistency)
        if (method_exists($user, 'labs')) {
            $user->labs()->attach($lab->id, ['is_active' => true]);
        }

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
