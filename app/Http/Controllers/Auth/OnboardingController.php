<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Lab;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeLabMail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    /**
     * Display the onboarding registration view.
     */
    public function show(): Response
    {
        return Inertia::render('Auth/Onboarding');
    }

    /**
     * Handle an incoming onboarding request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            // Lab details
            'lab_name' => 'required|string|max:255',
            'lab_email' => 'required|string|email|max:255',
            'lab_phone' => 'nullable|string|max:20',

            // Admin details
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // 1. Create the Lab
        $lab = Lab::create([
            'name' => $request->lab_name,
            'email' => $request->lab_email,
            'phone' => $request->lab_phone,
            'slug' => Str::slug($request->lab_name) . '-' . rand(1000, 9999),
            'subscription_status' => 'pending',
            'is_active' => false,
        ]);

        // 2. Create the Admin User
        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'admin',
            'lab_id' => $lab->id, // Set default lab
        ]);

        // 3. Attach User to Lab (Many-to-Many)
        $user->labs()->attach($lab->id, ['is_active' => true]);

        // 4. Send Welcome Email
        Mail::to($user->email)->send(new WelcomeLabMail($lab->name, $user->first_name, $user->email));

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('subscription.show'));
    }
}
