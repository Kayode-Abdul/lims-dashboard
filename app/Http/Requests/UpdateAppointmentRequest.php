<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'patient_id' => 'required|exists:patients,id',
            'test_id' => 'nullable|exists:tests,id',
            'appointment_type' => 'required|string|max:255',
            'doctor_name' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'scheduled_at' => 'required|date',
            'duration' => 'required|integer|min:1',
            'status' => 'required|string|in:scheduled,confirmed,completed,cancelled,no-show',
            'notes' => 'nullable|string',
        ];
    }
}
