<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Lab;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class LabController extends Controller
{
    public function index()
    {
        $labs = Lab::withCount('users')->latest()->paginate(10);
        return Inertia::render('SuperAdmin/Labs/Index', [
            'labs' => $labs
        ]);
    }

    public function create()
    {
        return Inertia::render('SuperAdmin/Labs/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            // Lab Validation
            'lab_name' => 'required|string|max:255|unique:labs,name',
            'lab_email' => 'nullable|string|email|max:255',
            'lab_address' => 'nullable|string|max:255',
            'lab_phone' => 'nullable|string|max:255',

            // Admin User Validation
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . \App\Models\User::class,
            'password' => ['required', 'confirmed', \Illuminate\Validation\Rules\Password::defaults()],
        ]);

        $slug = Str::slug($request->lab_name);
        // Ensure slug uniqueness
        $count = 1;
        while (Lab::where('slug', $slug)->exists()) {
            $slug = Str::slug($request->lab_name) . '-' . $count++;
        }

        // Create Lab
        $lab = Lab::create([
            'name' => $request->lab_name,
            'slug' => $slug,
            'email' => $request->lab_email,
            'address' => $request->lab_address,
            'phone' => $request->lab_phone,
            'is_active' => true,
            'subscription_status' => 'active',
            'expires_at' => now()->addDays(30),
        ]);

        // Create User (Admin)
        $user = \App\Models\User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'role' => 'admin',
            'lab_id' => $lab->id,
        ]);

        // Pivot if applicable/redundancy check
        if (method_exists($user, 'labs')) {
            $user->labs()->attach($lab->id, ['is_active' => true]);
        }

        return redirect()->route('super-admin.labs.index')->with('message', 'Laboratory and Admin created successfully.');
    }

    public function update(Request $request, Lab $lab)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:labs,name,' . $lab->id,
            'email' => 'nullable|string|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'is_active' => 'required|boolean',
            'expires_at' => 'nullable|date',
        ]);

        $lab->update($validated);

        return redirect()->back()->with('message', 'Laboratory updated successfully.');
    }
}
