<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTestResultRequest extends FormRequest
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
            'test_order_id' => 'required|exists:test_orders,id',
            'result_value' => 'nullable|string',
            'result_type' => 'nullable|string',
            'reference_range' => 'nullable|string',
            'units' => 'nullable|string',
            'is_abnormal' => 'boolean',
            'notes' => 'nullable|string',
            'subtest_results' => 'nullable|array',
        ];
    }
}