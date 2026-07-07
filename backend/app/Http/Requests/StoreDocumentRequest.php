<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * TEKUN SPPT — StoreDocumentRequest
 * Validates document upload for an application (Module 1).
 * Max file size: 5MB. Allowed types: PDF, JPG, PNG.
 */
class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'type' => [
                'required',
                'string',
                'in:ic_front,ic_back,bank_statement,ssm_cert,business_photo,others,mykad,ssm,bank3,income,premise,other',
            ],
            'file' => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:10240', // 10MB in kilobytes
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required'  => 'Sila pilih jenis dokumen.',
            'type.in'        => 'Jenis dokumen tidak sah.',
            'file.required'  => 'Sila muat naik fail dokumen.',
            'file.mimes'     => 'Fail mesti dalam format PDF, JPG, atau PNG.',
            'file.max'       => 'Saiz fail tidak boleh melebihi 10MB.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Ralat muat naik dokumen.',
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}
