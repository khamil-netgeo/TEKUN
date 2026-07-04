<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * TEKUN SPPT — UpdateApplicationRequest
 * Validates updates to an existing application (draft stage only).
 */
class UpdateApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'scheme'               => ['sometimes', 'string', 'in:tekun_micro,tekun_usahawan,tekun_wanita,tekun_belia'],
            'amount_requested'     => ['sometimes', 'numeric', 'min:1000', 'max:50000'],
            'full_name'            => ['sometimes', 'string', 'min:3', 'max:150'],
            'phone'                => ['sometimes', 'string', 'regex:/^(\+?60|0)[0-9]{8,10}$/'],
            'email'                => ['sometimes', 'email', 'max:150'],
            'business_name'        => ['sometimes', 'string', 'min:2', 'max:200'],
            'business_type'        => ['sometimes', 'string', 'max:100'],
            'business_address'     => ['sometimes', 'string', 'min:10', 'max:500'],
            'business_age_months'  => ['sometimes', 'integer', 'min:0', 'max:600'],
            'monthly_income'       => ['sometimes', 'numeric', 'min:0'],
            'monthly_expense'      => ['sometimes', 'numeric', 'min:0'],
            'loan_purpose'         => ['sometimes', 'string', 'min:10', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'scheme.in'                => 'Skim pembiayaan tidak sah.',
            'amount_requested.min'     => 'Jumlah minimum pembiayaan ialah RM1,000.',
            'amount_requested.max'     => 'Jumlah maksimum pembiayaan ialah RM50,000.',
            'ic_no.regex'              => 'Format nombor kad pengenalan tidak sah.',
            'phone.regex'              => 'Format nombor telefon tidak sah.',
            'email.email'              => 'Format alamat e-mel tidak sah.',
            'loan_purpose.min'         => 'Tujuan pembiayaan perlu sekurang-kurangnya 10 aksara.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Sila semak semula maklumat yang dimasukkan.',
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}
