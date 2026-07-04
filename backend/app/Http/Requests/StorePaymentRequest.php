<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * TEKUN SPPT — StorePaymentRequest
 * Validates payment recording for a financing account (Module 4).
 */
class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'account_id'        => ['required', 'integer', 'exists:accounts,id'],
            'amount'            => ['required', 'numeric', 'min:1'],
            'channel'           => ['required', 'string', 'in:fpx,duitnow,counter,auto_debit,cheque'],
            'payment_date'      => ['required', 'date', 'before_or_equal:today'],
            'transaction_ref'   => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'account_id.required'      => 'ID akaun diperlukan.',
            'account_id.exists'        => 'Akaun tidak dijumpai.',
            'amount.required'          => 'Jumlah bayaran diperlukan.',
            'amount.min'               => 'Jumlah bayaran minimum ialah RM1.',
            'channel.required'         => 'Saluran pembayaran diperlukan.',
            'channel.in'               => 'Saluran pembayaran tidak sah.',
            'payment_date.required'    => 'Tarikh bayaran diperlukan.',
            'payment_date.before_or_equal' => 'Tarikh bayaran tidak boleh melebihi tarikh hari ini.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Sila semak maklumat pembayaran.',
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}
