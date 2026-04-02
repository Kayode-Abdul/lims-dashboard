<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LabSubscriptionMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && !$user->is_super_admin) {
            $lab = $user->lab;

            if (!$lab || !$lab->is_active) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'message' => 'Laboratory access is disabled.',
                        'code' => 'LAB_DISABLED'
                    ], 403);
                }
                return redirect()->route('subscription.show')->with('error', 'Your laboratory access is disabled. Please check your subscription.');
            }

            if ($lab->isExpired()) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'message' => 'Laboratory subscription has expired.',
                        'code' => 'SUBSCRIPTION_EXPIRED'
                    ], 403);
                }
                return redirect()->route('subscription.show')->with('error', 'Your laboratory subscription has expired. Please renew to continue.');
            }
        }

        return $next($request);
    }
}
