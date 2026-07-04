<?php

namespace App\Modules\PengurusanCawangan\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) {
            return false;
        }
        // Allow: system_admin, eksekutif, pengurus_cawangan
        return in_array($user->role, ['system_admin', 'eksekutif', 'pengurus_cawangan']);
    }

    public function rules(): array
    {
        return [
            'name'           => 'sometimes|string|max:255',
            'state'          => 'sometimes|string|max:100',
            'district'       => 'sometimes|string|max:100',
            'address'        => 'sometimes|nullable|string|max:500',
            'phone'          => 'sometimes|nullable|string|max:20',
            'email'          => 'sometimes|nullable|email|max:255',
            'manager_name'   => 'sometimes|nullable|string|max:255',
            'manager_email'  => 'sometimes|nullable|email|max:255',
            'is_active'      => 'sometimes|boolean',
            'monthly_target' => 'sometimes|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'email.email'         => 'Alamat emel tidak sah.',
            'manager_email.email' => 'Alamat emel pengurus tidak sah.',
            'monthly_target.min'  => 'Sasaran bulanan tidak boleh negatif.',
        ];
    }
}
