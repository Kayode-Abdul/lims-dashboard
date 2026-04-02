<?php

namespace App\Http\Controllers;

use App\Http\Requests\StaffUpdateRequest;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = User::query();
        // Global scope from HasLab trait handles the lab_id filtering

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('staff_no', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('role')) {
            $query->where('role', $request->get('role'));
        }

        $staff = $query->latest()->paginate(10)->withQueryString();

        $departments = Department::where('lab_id', auth()->user()->lab_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Staff/Index', [
            'staff' => $staff,
            'departments' => $departments,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Staff/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if (!auth()->user()->hasPermission('staff.manage')) {
            return back()->with('error', 'You do not have permission to manage staff.');
        }

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users',
            'password' => ['required', 'confirmed', \Illuminate\Validation\Rules\Password::defaults()],
            'role' => 'required|string|in:pathologist,lab_tech,supervisor,admin,receptionist',
            'department' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'position' => 'nullable|string|max:255',
            'employment_type' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'signature' => 'nullable|image|max:2048',
        ]);

        $lab = auth()->user()->lab;
        $signature_path = null;

        if ($request->hasFile('signature')) {
            $signature_path = $request->file('signature')->store("lab/{$lab->slug}/signatures", 'public');
        }

        $user = User::withoutEvents(function () use ($request, $lab, $signature_path) {
            do {
                $no = 'STF-' . rand(100000, 999999);
            } while (User::where('staff_no', $no)->exists());

            return User::create([
            'staff_no' => $no,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'role' => $request->role,
            'department' => $request->department,
            'phone' => $request->phone,
            'address' => $request->address,
            'position' => $request->position,
            'employment_type' => $request->employment_type,
            'permissions' => $request->permissions ?? [],
            'signature_path' => $signature_path,
            'lab_id' => $lab->id,
            'is_active' => true
            ]);
        });

        // Attach to lab_user pivot table
        $user->labs()->attach($lab->id, ['is_active' => true]);

        return redirect()->route('staff.index')
            ->with('message', 'Staff member created successfully.');
    }
    public function show(User $staff): Response
    {
        return Inertia::render('Staff/Show', [
            'user' => $staff,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $staff): Response
    {
        $departments = Department::where('lab_id', auth()->user()->lab_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Staff/Edit', [
            'user' => $staff,
            'departments' => $departments,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StaffUpdateRequest $request, User $staff)
    {
        if (!auth()->user()->hasPermission('staff.manage')) {
            return back()->with('error', 'You do not have permission to manage staff.');
        }

        $data = $request->validated();

        if ($request->hasFile('signature')) {
            // Delete old signature if exists
            if ($staff->signature_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($staff->signature_path);
            }

            $lab = auth()->user()->lab;
            $path = $request->file('signature')->store("lab/{$lab->slug}/signatures", 'public');
            $data['signature_path'] = $path;
        }

        $staff->update($data);

        return redirect()->route('staff.index')
            ->with('message', 'Staff profile updated successfully.');
    }

    /**
     * Update only the staff member's signature.
     */
    public function updateSignature(Request $request, User $staff)
    {
        $request->validate([
            'signature' => ['required', 'image', 'max:2048'],
        ]);

        if ($staff->signature_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($staff->signature_path);
        }

        $lab = auth()->user()->lab;
        $path = $request->file('signature')->store("lab/{$lab->slug}/signatures", 'public');
        $staff->update(['signature_path' => $path]);

        return redirect()->back()
            ->with('message', 'Signature updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $staff)
    {
        if (!auth()->user()->hasPermission('staff.manage')) {
            return back()->with('error', 'You do not have permission to manage staff.');
        }

        $staff->update(['is_active' => false]);

        return redirect()->route('staff.index')
            ->with('message', 'Staff member deactivated successfully.');
    }

    public function checkEmail(Request $request)
    {
        $exists = User::where('email', $request->email)->exists();
        return response()->json(['exists' => $exists]);
    }
}