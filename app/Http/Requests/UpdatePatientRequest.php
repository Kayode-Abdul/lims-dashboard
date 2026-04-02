<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePatientRequest extends FormRequest
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
            'patient_type' => 'required|string|in:walk-in,hmo,referred',
            'patient_id' => [
                'nullable',
                'string',
                Rule::unique('patients')->ignore($this->route('patient')),
            ],
            'title' => 'nullable|string|max:10',
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'other_names' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('patients')->ignore($this->route('patient')),
            ],
            'date_of_birth' => 'nullable|date',
            'sex' => 'nullable|string|in:Male,Female,Other',
            'blood_group' => 'nullable|string|max:5',
            'genotype' => 'nullable|string|max:5',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'nationality' => 'nullable|string|max:255',
            'occupation' => 'nullable|string|max:255',
            'marital_status' => 'nullable|string|max:50',
            'next_of_kin' => 'nullable|string|max:255',
            'next_of_kin_phone' => 'nullable|string|max:20',
            'height' => 'nullable|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'bmi' => 'nullable|numeric|min:0',
            'hospital_id' => 'nullable|exists:hospitals,id',
            'doctor_id' => 'nullable|exists:doctors,id',
            'hmo_id' => 'nullable|exists:hmos,id',
            'hmo_type' => 'nullable|string|max:255',
            'patient_classification_id' => 'nullable|exists:patient_classifications,id',
            'referrer' => 'nullable|string|max:255',
            'age_group' => 'nullable|string|in:Adult,Child',
            'age_weeks' => 'nullable|integer|min:0',
            'age_days' => 'nullable|integer|min:0',
        ];
    }
}