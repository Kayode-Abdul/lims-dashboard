<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        $labId = auth()->user()->lab_id;

        return Department::where('lab_id', $labId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $labId = auth()->user()->lab_id;

        $department = Department::firstOrCreate(
            ['lab_id' => $labId, 'name' => $request->name],
            ['is_active' => true]
        );

        return response()->json([
            'success' => true,
            'department' => $department,
        ]);
    }

    public function destroy(Department $department)
    {
        $labId = auth()->user()->lab_id;

        if ($department->lab_id !== $labId) {
            abort(403);
        }

        $department->update(['is_active' => false]);

        return response()->json(['success' => true]);
    }
}
