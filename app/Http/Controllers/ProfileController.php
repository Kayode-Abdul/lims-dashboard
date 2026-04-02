<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Update the lab logo.
     */
    public function updateLabLogo(Request $request): RedirectResponse
    {
        $request->validate([
            'logo' => ['required', 'image', 'max:2048'], // 2MB Max
        ]);

        $user = $request->user();
        $lab = $user->lab;

        if (!$lab) {
            return back()->withErrors(['error' => 'No laboratory associated with this user.']);
        }

        // Only allow admins or super admins to update the logo
        if ($user->role !== 'admin' && !$user->is_super_admin) {
            return back()->withErrors(['error' => 'Unauthorized.']);
        }

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($lab->logo_path) {
                Storage::disk('public')->delete($lab->logo_path);
            }

            $path = $request->file('logo')->store("lab/{$lab->slug}/logos", 'public');
            $lab->update(['logo_path' => $path]);
        }

        return Redirect::route('profile.edit')->with('status', 'lab-logo-updated');
    }
}