<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StaffUpdateRequest extends FormRequest
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
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                \Illuminate\Validation\Rule::unique('users')->ignore($this->route('staff')),
            ],
            'role' => ['required', 'string', 'in:admin,pathologist,lab_tech,supervisor,receptionist'],
            'signature' => ['nullable', 'image', 'max:2048'],
            'department' => ['nullable', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
            'phone' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'position' => ['nullable', 'string', 'max:255'],
            'employment_type' => ['nullable', 'string', 'max:255'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:50'],
            'permissions' => ['nullable', 'array'],
        ];
    }
}
