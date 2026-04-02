<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTestRequest extends FormRequest
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
            'test_code' => [
                'required',
                'string',
                'max:50',
                \Illuminate\Validation\Rule::unique('tests')->ignore($this->route('test')),
            ],
            'test_name' => 'required|string|max:255',
            'category_id' => 'required|exists:test_categories,id',
            'price_walk_in' => 'required|numeric|min:0',
            'price_hmo' => 'required|numeric|min:0',
            'price_doctor_referred' => 'required|numeric|min:0',
            'turnaround_time' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'reference_range' => 'nullable|string',
            'reference_range_male' => 'nullable|string',
            'reference_range_female' => 'nullable|string',
            'reference_range_adult' => 'nullable|string',
            'reference_range_child' => 'nullable|string',
            'units' => 'nullable|string',
            'department' => 'nullable|string|max:255',
            'is_active' => 'required|boolean',
            'is_group' => 'nullable|boolean',
            'has_subtests' => 'nullable|boolean',
            'subtest_definitions' => 'nullable|array',
            'parent_id' => 'nullable|exists:tests,id',
            'hmo_prices' => 'nullable|array',
            'hmo_prices.*' => 'nullable|numeric|min:0',
            'hospital_prices' => 'nullable|array',
            'hospital_prices.*' => 'nullable|numeric|min:0',
        ];
    }
}