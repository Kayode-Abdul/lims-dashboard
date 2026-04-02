<?php

namespace App\Http\Controllers;

use App\Models\Specimen;
use App\Models\TestOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Requests\StoreSpecimenRequest;
use Illuminate\Support\Facades\Auth;

class SpecimenController extends Controller
{
    public function index(Request $request)
    {
        $labId = auth()->user()->lab_id;
        $query = Specimen::whereHas('testOrder', function($q) use ($labId) {
            $q->where('lab_id', $labId);
        })->with(['testOrder.patient', 'testOrder.test', 'collector']);

        if ($request->filled('search')) {
            $search = $request->search;
            $searchTerms = preg_split('/\s+/', trim($search));
            $query->where(function ($outer) use ($search, $searchTerms) {
                $outer->where('sample_id', 'like', "%{$search}%")
                    ->orWhereHas('testOrder.patient', function ($q) use ($search, $searchTerms) {
                        $q->where(function ($inner) use ($search, $searchTerms) {
                            foreach ($searchTerms as $term) {
                                $inner->where(function ($wordQuery) use ($term) {
                                    $wordQuery->where('first_name', 'like', "%{$term}%")
                                        ->orWhere('last_name', 'like', "%{$term}%");
                                });
                            }
                        });
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $samples = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Samples/Index', [
            'samples' => $samples,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(StoreSpecimenRequest $request)
    {
        $validated = $request->validated();

        // Generate Unique Sample ID: SMP-YYYYMMDD-XXXX
        $count = Specimen::whereDate('created_at', now()->today())->count() + 1;
        $sampleId = 'SMP-' . now()->format('Ymd') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

        $specimen = Specimen::create([
            ...$validated,
            'sample_id' => $sampleId,
            'collected_by' => Auth::id(),
            'status' => 'collected',
        ]);

        // Update Test Order Status to 'collected'
        $specimen->testOrder->update(['status' => 'collected']);

        return redirect()->back()->with('message', 'Sample collected successfully: ' . $sampleId);
    }

    public function update(Request $request, Specimen $specimen)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:collected,processing,analyzed,stored,discarded',
            'storage_location' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $specimen->update($validated);

        return redirect()->back()->with('message', 'Sample updated successfully.');
    }

    public function destroy(Specimen $specimen)
    {
        $specimen->delete();
        return redirect()->back()->with('message', 'Sample record deleted.');
    }
}
