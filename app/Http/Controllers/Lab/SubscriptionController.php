<?php

namespace App\Http\Controllers\Lab;

use App\Http\Controllers\Controller;
use App\Models\AccessKey;
use Illuminate\Http\Request;
use Carbon\Carbon;

use Inertia\Inertia;

class SubscriptionController extends Controller
{
    /**
     * Display the subscription status page.
     */
    public function show()
    {
        return Inertia::render('Lab/Subscription', [
            'lab' => auth()->user()->lab,
        ]);
    }

    /**
     * Activate an access key for the current user's lab.
     */
    public function activate(Request $request)
    {
        $request->validate([
            'access_key' => 'required|string',
        ]);

        $key = AccessKey::where('key', $request->access_key)
            ->where('is_activated', false)
            ->first();

        if (!$key) {
            return redirect()->back()->withErrors(['access_key' => 'Invalid or already activated access key.']);
        }

        $lab = auth()->user()->lab;

        if (!$lab) {
            return redirect()->back()->withErrors(['error' => 'You are not associated with any laboratory.']);
        }

        // Calculate new expiry date
        $currentExpiry = $lab->expires_at && $lab->expires_at->isFuture()
            ? $lab->expires_at
            : now();

        $newExpiry = $currentExpiry->addDays($key->duration_days);

        // Update Lab
        $lab->update([
            'expires_at' => $newExpiry,
            'is_active' => true,
        ]);

        // Mark Key as activated
        $key->update([
            'lab_id' => $lab->id,
            'is_activated' => true,
            'activated_at' => now(),
            'expires_at' => $newExpiry,
        ]);

        return redirect()->back()->with('message', "Subscription extended by {$key->duration_days} days. New expiry: " . $newExpiry->format('Y-m-d'));
    }
}
