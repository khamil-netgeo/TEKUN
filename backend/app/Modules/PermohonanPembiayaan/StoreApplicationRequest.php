<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * TEKUN SPPT — StoreApplicationRequest
 * Validates new financing application submission (Module 1).
 * Tender ref: SRS-APP-001 — Borang Permohonan Pembiayaan
 */
class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Any authenticated user can submit an application
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            // Scheme selection
            'scheme' => ['required', 'string', 'in:tekun_micro,tekun_usahawan,tekun_wanita,tekun_belia'],

            // Amount requested — validated against scheme limits
            'amount_requested' => ['required', 'numeric', 'min:1000', 'max:50000'],

            // Personal info
            'ic_no'      => ['required', 'string', 'regex:/^\d{6}-\d{2}-\d{4}$/'],
            'full_name'  => ['required', 'string', 'min:3', 'max:150'],
            'phone'      => ['required', 'string', 'regex:/^(\+?60|0)[0-9]{8,10}$/'],
            'email'      => ['required', 'email', 'max:150'],

            // Business info (stored in address/purpose columns)
            'business_name'        => ['nullable', 'string', 'min:2', 'max:200'],
            'business_type'        => ['nullable', 'string', 'max:100'],
            'business_address'     => ['required', 'string', 'min:5', 'max:500'],
            'business_age_months'  => ['nullable', 'integer', 'min:0', 'max:600'],
            'monthly_income'       => ['nullable', 'numeric', 'min:0'],
            'monthly_expense'      => ['nullable', 'numeric', 'min:0'],
            'loan_purpose'         => ['required', 'string', 'min:5', 'max:1000'],

            // Branch
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'scheme.required'              => 'Sila pilih skim pembiayaan.',
            'scheme.in'                    => 'Skim pembiayaan tidak sah.',
            'amount_requested.required'    => 'Sila masukkan jumlah pembiayaan yang dipohon.',
            'amount_requested.min'         => 'Jumlah minimum pembiayaan ialah RM1,000.',
            'amount_requested.max'         => 'Jumlah maksimum pembiayaan ialah RM50,000.',
            'ic_no.required'               => 'Sila masukkan nombor kad pengenalan.',
            'ic_no.regex'                  => 'Format nombor kad pengenalan tidak sah (contoh: 900101-14-1234).',
            'full_name.required'           => 'Sila masukkan nama penuh.',
            'phone.required'               => 'Sila masukkan nombor telefon.',
            'phone.regex'                  => 'Format nombor telefon tidak sah.',
            'email.required'               => 'Sila masukkan alamat e-mel.',
            'email.email'                  => 'Format alamat e-mel tidak sah.',
            'business_name.required'       => 'Sila masukkan nama perniagaan.',
            'business_type.required'       => 'Sila masukkan jenis perniagaan.',
            'business_address.required'    => 'Sila masukkan alamat perniagaan.',
            'business_age_months.required' => 'Sila masukkan tempoh perniagaan.',
            'monthly_income.required'      => 'Sila masukkan pendapatan bulanan.',
            'monthly_expense.required'     => 'Sila masukkan perbelanjaan bulanan.',
            'loan_purpose.required'        => 'Sila nyatakan tujuan pembiayaan.',
            'loan_purpose.min'             => 'Tujuan pembiayaan perlu sekurang-kurangnya 10 aksara.',
        ];
    }

    /** Validate scheme-specific amount limits */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $scheme = $this->input('scheme');
            $amount = (float) $this->input('amount_requested', 0);

            $limits = [
                'tekun_micro'    => 10000,
                'tekun_usahawan' => 50000,
                'tekun_wanita'   => 30000,
                'tekun_belia'    => 20000,
            ];

            if ($scheme && isset($limits[$scheme]) && $amount > $limits[$scheme]) {
                $v->errors()->add(
                    'amount_requested',
                    'Jumlah yang dipohon melebihi had maksimum untuk skim ' . $scheme . ' (RM' . number_format($limits[$scheme]) . ').'
                );
            }

            // TEKUN Usahawan requires min 6 months business age
            if ($scheme === 'tekun_usahawan' && (int) $this->input('business_age_months', 0) < 6) {
                $v->errors()->add(
                    'business_age_months',
                    'Skim TEKUN Usahawan memerlukan perniagaan beroperasi sekurang-kurangnya 6 bulan.'
                );
            }

            // TEKUN Belia — check age from IC (must be 18-35)
            $ic = $this->input('ic_no', '');
            if ($scheme === 'tekun_belia' && strlen($ic) >= 6) {
                $year = (int) substr($ic, 0, 2);
                $fullYear = $year > 25 ? 1900 + $year : 2000 + $year;
                $age = now()->year - $fullYear;
                if ($age < 18 || $age > 35) {
                    $v->errors()->add('ic_no', 'Skim TEKUN Belia hanya untuk pemohon berumur 18 hingga 35 tahun.');
                }
            }
        });
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
