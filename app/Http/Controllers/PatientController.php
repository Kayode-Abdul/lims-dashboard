<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePatientRequest;
use App\Http\Requests\UpdatePatientRequest;
use App\Models\Patient;
use App\Models\Hospital;
use App\Models\Doctor;
use App\Models\Hmo;
use App\Models\PatientClassification;

class PatientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(\Illuminate\Http\Request $request)
    {
        $query = Patient::query()->with(['hospital', 'doctor', 'hmo', 'classification']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $searchTerms = preg_split('/\s+/', trim($search));
            $query->where(function ($q) use ($search, $searchTerms) {
                // Match patient_id or phone with the full search string
                $q->where('patient_id', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    // Match each word against first_name or last_name
                    ->orWhere(function ($nameQuery) use ($searchTerms) {
                        foreach ($searchTerms as $term) {
                            $nameQuery->where(function ($wordQuery) use ($term) {
                                $wordQuery->where('first_name', 'like', "%{$term}%")
                                    ->orWhere('last_name', 'like', "%{$term}%");
                            });
                        }
                    });
            });
        }

        $patients = $query->latest()->paginate(10)->withQueryString();

        return \Inertia\Inertia::render('Patients/Index', [
            'patients' => $patients,
            'filters' => $request->only(['search']),
            'classifications' => PatientClassification::all(),
            'hospitals' => Hospital::all(),
            'doctors' => Doctor::all(),
            'hmos' => Hmo::all(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return \Inertia\Inertia::render('Patients/Create', [
            'hospitals' => Hospital::all(),
            'doctors' => Doctor::all(),
            'hmos' => Hmo::all(),
            'classifications' => PatientClassification::all(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePatientRequest $request)
    {
        $patient = Patient::create($request->validated());

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'patient' => $patient,
            ]);
        }

        return redirect()->route('patients.index')
            ->with('message', 'Patient created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Patient $patient)
    {
        $orders = \App\Models\TestOrder::where('patient_id', $patient->id)
            ->with(['test', 'orderedBy'])
            ->select('order_number', 'patient_id')
            ->selectRaw('MAX(ordered_at) as ordered_at')
            ->selectRaw('SUM(price) as total_price')
            ->selectRaw('SUM(discount) as total_discount')
            ->selectRaw('SUM(amount_paid) as total_paid')
            ->selectRaw('GROUP_CONCAT(DISTINCT status) as statuses')
            ->groupBy('order_number', 'patient_id')
            ->latest('ordered_at')
            ->get();

        foreach ($orders as $order) {
            $order->tests = \App\Models\TestOrder::where('order_number', $order->order_number)
                ->with('test')
                ->get()
                ->pluck('test.test_name')
                ->toArray();

            $price = (float)$order->total_price;
            $discount = (float)($order->total_discount ?? 0);
            $paid = (float)($order->total_paid ?? 0);
            $order->balance = max(0, ($price - $discount) - $paid);

            $statusArray = explode(',', $order->statuses);
            if (in_array('pending', $statusArray)) $order->status = 'pending';
            elseif (in_array('collected', $statusArray)) $order->status = 'collected';
            elseif (in_array('processing', $statusArray)) $order->status = 'processing';
            else $order->status = 'completed';
        }

        return \Inertia\Inertia::render('Patients/Show', [
            'patient' => $patient,
            'orders' => $orders
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Patient $patient)
    {
        if (!auth()->user()->hasPermission('patients.edit')) {
            return back()->with('error', 'You do not have permission to edit patients.');
        }

        return \Inertia\Inertia::render('Patients/Edit', [
            'patient' => $patient,
            'hospitals' => Hospital::all(),
            'doctors' => Doctor::all(),
            'hmos' => Hmo::all(),
            'classifications' => PatientClassification::all(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePatientRequest $request, Patient $patient)
    {
        if (!auth()->user()->hasPermission('patients.edit')) {
            return back()->with('error', 'You do not have permission to update patients.');
        }

        $patient->update($request->validated());

        return redirect()->route('patients.index')
            ->with('message', 'Patient updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Patient $patient)
    {
        if (!auth()->user()->hasPermission('patients.delete')) {
            return back()->with('error', 'You do not have permission to delete patient records.');
        }

        $patient->delete();

        return redirect()->route('patients.index')->with('message', 'Patient deleted successfully.');
    }
}
