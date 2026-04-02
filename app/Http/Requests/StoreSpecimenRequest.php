<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSpecimenRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'test_order_id' => 'required|exists:test_orders,id',
            'sample_type' => 'required|string',
            'collection_at' => 'required|date',
            'storage_location' => 'nullable|string',
            'notes' => 'nullable|string',
        ];
    }
}
