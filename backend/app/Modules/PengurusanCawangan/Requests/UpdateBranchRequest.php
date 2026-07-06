<?php

namespace App\Modules\PengurusanCawangan\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Enums\Role;

/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan
 * Validates and authorises branch update requests.
 */
class UpdateBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) return false;

        // system_admin and executive can update any branch
        if ($user->hasRole([Role::SYSTEM_ADMIN->value, Role::EXECUTIVE->value])) {
            return true;
        }
        // branch_manager can only update their own branch
        if ($user->hasRole(Role::BRANCH_MANAGER->value)) {
            $branchCode = $user->branch_code ?? null;
            $branch = \App\Models\Branch::find($this->route('id'));
            return $branch && $branch->code === $branchCode;
        }
        return false;
    }

    public function rules(): array
    {
        return [
            'name'                   => 'sometimes|string|max:255',
            'address'                => 'sometimes|string|max:500',
            'phone'                  => 'sometimes|string|max:20',
            'email'                  => 'sometimes|email|max:255',
            'manager_name'           => 'sometimes|string|max:255',
            'target_collection_rate' => 'sometimes|numeric|min:0|max:100',
            'monthly_target'         => 'sometimes|numeric|min:0',
            'is_active'              => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'email.email'                        => 'Format e-mel tidak sah.',
            'target_collection_rate.min'         => 'Kadar sasaran kutipan tidak boleh negatif.',
            'target_collection_rate.max'         => 'Kadar sasaran kutipan tidak boleh melebihi 100%.',
        ];
    }
}