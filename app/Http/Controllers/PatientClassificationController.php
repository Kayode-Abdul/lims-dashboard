<?php

namespace App\Http\Controllers;

use App\Models\PatientClassification;
use Illuminate\Http\Request;

class PatientClassificationController extends Controller
{
    public function index(Request $request)
    {
        $classifications = PatientClassification::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return \Inertia\Inertia::render('PatientClassifications/Index', [
            'classifications' => $classifications,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        if (!auth()->user()->hasPermission('referrals.manage')) {
            return back()->with('error', 'You do not have permission to manage classifications.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $classification = PatientClassification::create($validated);

        if ($request->wantsJson()) {
            return response()->json($classification);
        }

        return redirect()->back()->with('message', 'Classification created successfully.');
    }

    public function update(Request $request, PatientClassification $classification)
    {
        if (!auth()->user()->hasPermission('referrals.manage')) {
            return back()->with('error', 'You do not have permission to manage classifications.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $classification->update($validated);

        return redirect()->back()->with('message', 'Classification updated successfully.');
    }

    public function destroy(PatientClassification $classification)
    {
        if (!auth()->user()->hasPermission('referrals.manage')) {
            return back()->with('error', 'You do not have permission to delete classifications.');
        }

        $classification->delete();

        return redirect()->back()->with('message', 'Classification deleted successfully.');
    }
}
