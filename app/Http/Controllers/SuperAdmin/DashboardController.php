<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Lab;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_labs' => Lab::count(),
            'active_labs' => Lab::where('is_active', true)->count(),
            'pending_labs' => Lab::where('subscription_status', 'pending')->count(),
            'total_users' => User::count(),
        ];

        $pendingLabs = Lab::where('subscription_status', 'pending')
            ->latest()
            ->get();

        $recentLabs = Lab::withCount('users')
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => $stats,
            'pendingLabs' => $pendingLabs,
            'recentLabs' => $recentLabs,
        ]);
    }

    public function verifyPayment(Request $request, Lab $lab)
    {
        $request->validate([
            'duration_months' => 'required|integer|min:1',
        ]);

        $lab->update([
            'subscription_status' => 'active',
            'is_active' => true,
            'expires_at' => now()->addMonths($request->duration_months),
        ]);

        return redirect()->back()->with('message', "Laboratory '{$lab->name}' has been activated for {$request->duration_months} months.");
    }
}
