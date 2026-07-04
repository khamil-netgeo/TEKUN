<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * TEKUN SPPT — LoginRequest
 * Validates user login credentials.
 */
class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email'    => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required'    => 'Sila masukkan alamat e-mel.',
            'email.email'       => 'Format e-mel tidak sah.',
            'password.required' => 'Sila masukkan kata laluan.',
            'password.min'      => 'Kata laluan perlu sekurang-kurangnya 6 aksara.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Sila semak e-mel dan kata laluan anda.',
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}
