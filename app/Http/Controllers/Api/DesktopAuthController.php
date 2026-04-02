<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccessKey;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class DesktopAuthController extends Controller
{
    /**
     * Authenticate desktop app with triple-factor: Access Key, Username, Password.
     */
    public function login(Request $request)
    {
        $request->validate([
            'access_key' => 'required|string',
            'username' => 'required|string', // mapping to email or staff_no
            'password' => 'required|string',
        ]);

        // 1. Validate Access Key & Subscription
        $accessKey = AccessKey::where('key', $request->access_key)
            ->where('is_activated', true)
            ->first();

        if (!$accessKey || !$accessKey->lab) {
            throw ValidationException::withMessages([
                'access_key' => ['Invalid or inactive access key.'],
            ]);
        }

        if ($accessKey->lab->isExpired()) {
            return response()->json([
                'message' => 'Laboratory subscription has expired.',
                'code' => 'SUBSCRIPTION_EXPIRED'
            ], 403);
        }

        // 2. Find user within that lab
        // Assuming username can be email or staff_no
        $user = User::where('lab_id', $accessKey->lab_id)
            ->where(function ($query) use ($request) {
                $query->where('email', $request->username)
                    ->orWhere('staff_no', $request->username);
            })
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Invalid credentials for this laboratory.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'User account is inactive.'], 403);
        }

        // 3. Issue Token
        $token = $user->createToken('desktop-app', ['desktop'])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'lab' => [
                    'id' => $accessKey->lab->id,
                    'name' => $accessKey->lab->name,
                    'expires_at' => $accessKey->lab->expires_at,
                ]
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }
}
