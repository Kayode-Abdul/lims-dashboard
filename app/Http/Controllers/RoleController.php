<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    /**
     * Display a listing of the roles.
     */
    public function index()
    {
        $this->authorize('lab.settings');

        $roles = Role::where('lab_id', auth()->user()->lab_id)
            ->latest()
            ->get();

        return Inertia::render('Roles/Index', [
            'roles' => $roles
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create()
    {
        $this->authorize('lab.settings');

        return Inertia::render('Roles/Create');
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('lab.settings');

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'name')->where(function ($query) {
                    return $query->where('lab_id', auth()->user()->lab_id);
                }),
            ],
            'permissions' => 'nullable|array',
        ]);

        Role::create([
            'lab_id' => auth()->user()->lab_id,
            'name' => $validated['name'],
            'permissions' => $validated['permissions'] ?? [],
        ]);

        return redirect()->route('roles.index')
            ->with('message', 'Role created successfully.');
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role)
    {
        $this->authorize('lab.settings');

        // Ensure role belongs to current lab
        if ($role->lab_id !== auth()->user()->lab_id) {
            abort(403);
        }

        return Inertia::render('Roles/Edit', [
            'role' => $role
        ]);
    }

    /**
     * Update the specified role in storage.
     */
    public function update(Request $request, Role $role)
    {
        $this->authorize('lab.settings');

        if ($role->lab_id !== auth()->user()->lab_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'name')->where(function ($query) {
                    return $query->where('lab_id', auth()->user()->lab_id);
                })->ignore($role->id),
            ],
            'permissions' => 'nullable|array',
        ]);

        $role->update([
            'name' => $validated['name'],
            'permissions' => $validated['permissions'] ?? [],
        ]);

        return redirect()->route('roles.index')
            ->with('message', 'Role updated successfully.');
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(Role $role)
    {
        $this->authorize('lab.settings');

        if ($role->lab_id !== auth()->user()->lab_id) {
            abort(403);
        }

        $role->delete();

        return redirect()->route('roles.index')
            ->with('message', 'Role deleted successfully.');
    }
}
