<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * TEKUN SPPT — RegisterRequest
 * Validates new user registration (applicant/usahawan self-registration).
 * Tender ref: SRS-APP-001 — Pendaftaran Akaun Pemohon
 */
class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                  => ['required', 'string', 'min:3', 'max:150'],
            'email'                 => ['required', 'email', 'unique:users,email'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['required'],
            'ic_no'                 => ['required', 'string', 'regex:/^\d{6}-\d{2}-\d{4}$/'],
            'phone'                 => ['required', 'string', 'regex:/^(\+?60|0)[0-9]{8,10}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'                  => 'Sila masukkan nama penuh.',
            'email.required'                 => 'Sila masukkan alamat e-mel.',
            'email.email'                    => 'Format e-mel tidak sah.',
            'email.unique'                   => 'Alamat e-mel ini telah didaftarkan.',
            'password.required'              => 'Sila masukkan kata laluan.',
            'password.min'                   => 'Kata laluan perlu sekurang-kurangnya 8 aksara.',
            'password.confirmed'             => 'Pengesahan kata laluan tidak sepadan.',
            'password_confirmation.required' => 'Sila sahkan kata laluan.',
            'ic_no.required'                 => 'Sila masukkan nombor kad pengenalan.',
            'ic_no.regex'                    => 'Format nombor kad pengenalan tidak sah (contoh: 900101-14-1234).',
            'phone.required'                 => 'Sila masukkan nombor telefon.',
            'phone.regex'                    => 'Format nombor telefon tidak sah.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Pendaftaran gagal. Sila semak maklumat yang dimasukkan.',
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}
