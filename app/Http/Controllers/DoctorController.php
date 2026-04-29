<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Models\Hospital;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('referrals.manage');
        $doctors = Doctor::with('hospital')
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $hospitals = Hospital::all();

        return \Inertia\Inertia::render('Doctors/Index', [
            'doctors' => $doctors,
            'hospitals' => $hospitals,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('referrals.manage');

        $validated = $request->validate([
            'hospital_id' => 'required|exists:hospitals,id',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $doctor = Doctor::create($validated);

        if ($request->wantsJson()) {
            return response()->json($doctor->load('hospital'));
        }

        return redirect()->back()->with('message', 'Doctor created successfully.');
    }

    public function update(Request $request, Doctor $doctor)
    {
        $this->authorize('referrals.manage');

        $validated = $request->validate([
            'hospital_id' => 'required|exists:hospitals,id',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $doctor->update($validated);

        return redirect()->back()->with('message', 'Doctor updated successfully.');
    }

    public function destroy(Doctor $doctor)
    {
        $this->authorize('referrals.manage');

        $doctor->delete();

        return redirect()->back()->with('message', 'Doctor deleted successfully.');
    }
}
