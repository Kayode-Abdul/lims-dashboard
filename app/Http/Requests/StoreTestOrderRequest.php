<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTestOrderRequest extends FormRequest
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
            'patient_type' => 'required|in:walk-in,hmo,referred',
            'hmo_id' => 'nullable|exists:hmos,id',
            'hmo_type' => 'nullable|string|max:255',
            'test_ids' => 'required|array|min:1',
            'test_ids.*' => 'exists:tests,id',
            'hospital_id' => 'nullable|exists:hospitals,id',
            'doctor_id' => 'nullable|exists:doctors,id',
            'price' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'discount_type' => 'required|in:amount,percentage',
            'amount_paid' => 'required|numeric|min:0',
            'payment_method' => 'required|string',
            'notes' => 'nullable|string',
            'sample_type' => 'nullable|string|max:255',
            'subtest_selections' => 'nullable|array',
        ];
    }
}