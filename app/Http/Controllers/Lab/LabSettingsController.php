<?php

namespace App\Http\Controllers\Lab;

use App\Models\Lab;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class LabSettingsController extends Controller
{
    /**
     * Display the lab settings form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $lab = Lab::find($user->lab_id);

        // If no lab is active, try to find the first one they belong to
        if (!$lab && $user->labs()->exists()) {
            $lab = $user->labs()->first();
        }

        return Inertia::render('Lab/Settings', [
            'lab' => $lab,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the lab information.
     */
    public function update(Request $request)
    {
        $lab = $request->user()->lab;

        if (!$lab) {
            return back()->withErrors(['error' => 'No laboratory associated with your account.']);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'sync_url' => 'nullable|url|max:255',
            'header_image' => 'nullable|image|max:2048', // 2MB Max
            'footer_image' => 'nullable|image|max:2048', // 2MB Max
        ]);

        $updateData = collect($validated)->except(['header_image', 'footer_image'])->toArray();

        if ($request->hasFile('header_image')) {
            if ($lab->header_image_path) {
                Storage::disk('public')->delete($lab->header_image_path);
            }
            $path = $request->file('header_image')->store("lab/{$lab->slug}/headers", 'public');
            $updateData['header_image_path'] = $path;
        }

        if ($request->hasFile('footer_image')) {
            if ($lab->footer_image_path) {
                Storage::disk('public')->delete($lab->footer_image_path);
            }
            $path = $request->file('footer_image')->store("lab/{$lab->slug}/footers", 'public');
            $updateData['footer_image_path'] = $path;
        }

        $lab->update($updateData);

        return Redirect::route('lab.settings.edit')->with('status', 'lab-settings-updated');
    }
}