<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * TEKUN SPPT — StoreCreditAssessmentRequest
 * Validates credit assessment decision submission (Module 2).
 * Only credit_officer and branch_manager roles can submit.
 */
class StoreCreditAssessmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = auth()->user()?->role;
        return in_array($role, ['credit_officer', 'branch_manager', 'system_admin']);
    }

    public function rules(): array
    {
        return [
            'application_id'  => ['required', 'integer', 'exists:applications,id'],
            'total_score'     => ['required', 'integer', 'min:0', 'max:100'],
            'risk_grade'      => ['required', 'string', 'in:A,B,C,D,E'],
            'ccris_score'     => ['nullable', 'integer', 'min:0', 'max:100'],
            'ctos_score'      => ['nullable', 'integer', 'min:0', 'max:100'],
            'income_score'    => ['nullable', 'integer', 'min:0', 'max:100'],
            'business_score'  => ['nullable', 'integer', 'min:0', 'max:100'],
            'character_score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'dsr'             => ['required', 'numeric', 'min:0', 'max:100'],
            'amount_approved' => ['required', 'numeric', 'min:0'],
            'tenure_approved' => ['required', 'integer', 'min:6', 'max:60'],
            'profit_rate'     => ['required', 'numeric', 'min:0', 'max:20'],
            'decision'        => ['required', 'string', 'in:approved,rejected,query'],
            'decision_reason' => ['required', 'string', 'min:10', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'application_id.required'  => 'ID permohonan diperlukan.',
            'application_id.exists'    => 'Permohonan tidak dijumpai.',
            'total_score.required'     => 'Skor kredit diperlukan.',
            'risk_grade.required'      => 'Gred risiko diperlukan.',
            'risk_grade.in'            => 'Gred risiko mesti A, B, C, D, atau E.',
            'dsr.required'             => 'Nisbah Perkhidmatan Hutang (DSR) diperlukan.',
            'amount_approved.required' => 'Jumlah diluluskan diperlukan.',
            'tenure_approved.min'      => 'Tempoh pembiayaan minimum ialah 6 bulan.',
            'tenure_approved.max'      => 'Tempoh pembiayaan maksimum ialah 60 bulan.',
            'decision.required'        => 'Keputusan penilaian diperlukan.',
            'decision.in'              => 'Keputusan mesti: approved, rejected, atau query.',
            'decision_reason.required' => 'Sebab keputusan diperlukan.',
            'decision_reason.min'      => 'Sebab keputusan perlu sekurang-kurangnya 10 aksara.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Sila semak semula maklumat penilaian kredit.',
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}
