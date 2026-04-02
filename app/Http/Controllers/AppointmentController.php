<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Test;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Requests\StoreAppointmentRequest; // Assuming these requests exist
use App\Http\Requests\UpdateAppointmentRequest; // Assuming these requests exist

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::with(['patient', 'test']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->whereHas('patient', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('patient_id', 'like', "%{$search}%");
            })->orWhere('appointment_type', 'like', "%{$search}%")
                ->orWhereHas('test', function ($q) use ($search) {
                    $q->where('test_name', 'like', "%{$search}%");
                });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('scheduled_at', $request->date);
        }

        $appointments = $query->latest('scheduled_at')->paginate(15)->withQueryString();

        return Inertia::render('Appointments/Index', [
            'appointments' => $appointments,
            'patients' => Patient::where('is_active', true)->get(['id', 'first_name', 'last_name', 'patient_id']),
            'tests' => Test::where('is_active', true)->get(['id', 'test_name', 'test_code']),
            'filters' => $request->only(['search', 'status', 'date']),
        ]);
    }

    public function store(StoreAppointmentRequest $request)
    {
        Appointment::create($request->validated());

        return redirect()->route('appointments.index')
            ->with('message', 'Appointment scheduled successfully.');
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment)
    {
        $appointment->update($request->validated());

        return redirect()->route('appointments.index')
            ->with('message', 'Appointment updated successfully.');
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();

        return redirect()->route('appointments.index')
            ->with('message', 'Appointment cancelled and removed.');
    }
}
