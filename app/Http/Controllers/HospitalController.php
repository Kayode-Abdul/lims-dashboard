<?php

namespace App\Http\Controllers;

use App\Models\Hospital;
use Illuminate\Http\Request;

class HospitalController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('referrals.manage');
        $hospitals = Hospital::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return \Inertia\Inertia::render('Hospitals/Index', [
            'hospitals' => $hospitals,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('referrals.manage');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $hospital = Hospital::create($validated);

        if ($request->wantsJson()) {
            return response()->json($hospital);
        }

        return redirect()->back()->with('message', 'Hospital created successfully.');
    }

    public function update(Request $request, Hospital $hospital)
    {
        $this->authorize('referrals.manage');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $hospital->update($validated);

        return redirect()->back()->with('message', 'Hospital updated successfully.');
    }

    public function destroy(Hospital $hospital)
    {
        $this->authorize('referrals.manage');

        $hospital->delete();

        return redirect()->back()->with('message', 'Hospital deleted successfully.');
    }

    public function account(Request $request, Hospital $hospital)
    {
        $this->authorize('referrals.manage');
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        $query = \App\Models\TestOrder::where('hospital_id', $hospital->id)
            ->whereBetween('ordered_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);

        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
        }

        $stats = $query->selectRaw('COUNT(DISTINCT order_number) as total_orders')
            ->selectRaw('SUM(price) as total_billed')
            ->selectRaw('SUM(discount) as total_discount')
            ->selectRaw('SUM(amount_paid) as total_paid')
            ->first();

        $stats->outstanding = ($stats->total_billed - $stats->total_discount) - $stats->total_paid;

        // Get detailed transactions (grouped by order)
        $transactions = \App\Models\TestOrder::with(['patient', 'doctor'])
            ->where('hospital_id', $hospital->id)
            ->whereBetween('ordered_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select('order_number', 'patient_id', 'doctor_id', 'ordered_at')
            ->selectRaw('SUM(price) as total_price')
            ->selectRaw('SUM(discount) as total_discount')
            ->selectRaw('SUM(amount_paid) as total_paid')
            ->groupBy('order_number', 'patient_id', 'doctor_id', 'ordered_at')
            ->latest('ordered_at')
            ->paginate(15);

        return \Inertia\Inertia::render('Hospitals/Account', [
            'hospital' => $hospital,
            'stats' => $stats,
            'transactions' => $transactions,
            'doctors' => \App\Models\Doctor::where('hospital_id', $hospital->id)->get(),
            'filters' => $request->only(['start_date', 'end_date', 'doctor_id']),
        ]);
    }
}
