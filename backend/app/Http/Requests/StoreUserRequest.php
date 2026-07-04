<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * TEKUN SPPT — StoreUserRequest
 * Validates creation of new system users (Module 12 — Pentadbiran Sistem).
 * Only system_admin can create users.
 */
class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()?->role === 'system_admin';
    }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'min:3', 'max:150'],
            'email'        => ['required', 'email', 'unique:users,email'],
            'password'     => ['required', 'string', 'min:8'],
            'role'         => [
                'required',
                'string',
                'in:usahawan,branch_officer,branch_manager,credit_officer,finance_officer,executive,system_admin',
            ],
            'role_label'   => ['nullable', 'string', 'max:100'],
            'branch'       => ['nullable', 'string', 'max:150'],
            'branch_code'  => ['nullable', 'string', 'max:10'],
            'state'        => ['nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'     => 'Sila masukkan nama pengguna.',
            'email.required'    => 'Sila masukkan alamat e-mel.',
            'email.unique'      => 'Alamat e-mel ini telah digunakan.',
            'password.required' => 'Sila masukkan kata laluan.',
            'password.min'      => 'Kata laluan perlu sekurang-kurangnya 8 aksara.',
            'role.required'     => 'Sila pilih peranan pengguna.',
            'role.in'           => 'Peranan pengguna tidak sah.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Sila semak maklumat pengguna baru.',
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}
