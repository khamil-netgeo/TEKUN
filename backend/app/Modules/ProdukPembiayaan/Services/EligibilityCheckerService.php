<?php

namespace App\Modules\ProdukPembiayaan\Services;

use App\Modules\ProdukPembiayaan\Models\FinancingProduct;
use App\Modules\ProdukPembiayaan\Models\ProductEligibilityRule;
use Carbon\Carbon;

/**
 * Module 9 — Produk Pembiayaan
 * Rule engine that evaluates applicant data against product eligibility rules.
 *
 * Supported rule_types: age | gender | sector | blacklist | business_age | custom
 * Supported operators:  gte | lte | eq | neq | in | not_in | between
 */
class EligibilityCheckerService
{
    /**
     * Check an applicant against a specific product's eligibility rules.
     *
     * @param  FinancingProduct  $product
     * @param  array             $applicantData  Keys: ic, dob, gender, sector,
     *                                           business_age_months, is_blacklisted,
     *                                           ccris_clear, ctos_clear, muflis_clear
     * @return array  { eligible: bool, passed: [], failed: [], warnings: [] }
     */
    public function check(FinancingProduct $product, array $applicantData): array
    {
        $passed   = [];
        $failed   = [];
        $warnings = [];

        // Derive age from IC or dob
        $age = $this->deriveAge($applicantData);

        // ── Core product-level checks (always applied) ─────────────────────────

        // Age check
        if ($age !== null) {
            if ($age < $product->min_age) {
                $failed[] = [
                    'rule'    => 'AGE_MIN',
                    'message' => "Umur minimum ialah {$product->min_age} tahun. Umur pemohon: {$age} tahun.",
                    'hard'    => true,
                ];
            } elseif ($age > $product->max_age) {
                $failed[] = [
                    'rule'    => 'AGE_MAX',
                    'message' => "Umur maksimum ialah {$product->max_age} tahun. Umur pemohon: {$age} tahun.",
                    'hard'    => true,
                ];
            } else {
                $passed[] = ['rule' => 'AGE', 'message' => "Umur {$age} tahun memenuhi syarat ({$product->min_age}–{$product->max_age} tahun)."];
            }
        }

        // Gender check (for Wanita scheme)
        if (!empty($product->eligible_genders)) {
            $gender = strtoupper($applicantData['gender'] ?? '');
            if ($gender && !in_array($gender, array_map('strtoupper', $product->eligible_genders))) {
                $failed[] = [
                    'rule'    => 'GENDER',
                    'message' => 'Skim ini terhad kepada ' . implode(' atau ', $product->eligible_genders) . ' sahaja.',
                    'hard'    => true,
                ];
            } elseif ($gender) {
                $passed[] = ['rule' => 'GENDER', 'message' => 'Jantina memenuhi syarat skim ini.'];
            }
        }

        // Sector check
        if (!empty($product->eligible_sectors) && !in_array('all', $product->eligible_sectors)) {
            $sector = strtolower($applicantData['sector'] ?? '');
            if ($sector && !in_array($sector, array_map('strtolower', $product->eligible_sectors))) {
                $failed[] = [
                    'rule'    => 'SECTOR',
                    'message' => 'Sektor perniagaan tidak layak untuk skim ini.',
                    'hard'    => false,
                ];
            } elseif ($sector) {
                $passed[] = ['rule' => 'SECTOR', 'message' => 'Sektor perniagaan layak.'];
            }
        }

        // Business age check
        $businessAgeMonths = (int) ($applicantData['business_age_months'] ?? 0);
        if ($product->min_business_age_months > 0) {
            if ($businessAgeMonths < $product->min_business_age_months) {
                $failed[] = [
                    'rule'    => 'BUSINESS_AGE',
                    'message' => "Perniagaan mesti beroperasi sekurang-kurangnya {$product->min_business_age_months} bulan.",
                    'hard'    => true,
                ];
            } else {
                $passed[] = ['rule' => 'BUSINESS_AGE', 'message' => 'Tempoh operasi perniagaan memenuhi syarat.'];
            }
        }

        // Blacklist check
        if ($product->blacklist_check_required) {
            $isBlacklisted = (bool) ($applicantData['is_blacklisted'] ?? false);
            if ($isBlacklisted) {
                $failed[] = [
                    'rule'    => 'BLACKLIST',
                    'message' => 'Pemohon disenaraihitam dan tidak layak untuk sebarang skim pembiayaan.',
                    'hard'    => true,
                ];
            } else {
                $passed[] = ['rule' => 'BLACKLIST', 'message' => 'Tiada rekod senarai hitam.'];
            }
        }

        // CCRIS check
        if ($product->ccris_check_required) {
            $ccrisClear = isset($applicantData['ccris_clear']) ? (bool) $applicantData['ccris_clear'] : null;
            if ($ccrisClear === false) {
                $warnings[] = ['rule' => 'CCRIS', 'message' => 'Rekod CCRIS menunjukkan komitmen semasa. Penilaian lanjut diperlukan.'];
            } elseif ($ccrisClear === true) {
                $passed[] = ['rule' => 'CCRIS', 'message' => 'Rekod CCRIS bersih.'];
            }
        }

        // Muflis check
        if ($product->muflis_check_required) {
            $muflisClear = isset($applicantData['muflis_clear']) ? (bool) $applicantData['muflis_clear'] : null;
            if ($muflisClear === false) {
                $failed[] = [
                    'rule'    => 'MUFLIS',
                    'message' => 'Pemohon diisytiharkan muflis. Tidak layak untuk pembiayaan.',
                    'hard'    => true,
                ];
            } elseif ($muflisClear === true) {
                $passed[] = ['rule' => 'MUFLIS', 'message' => 'Tiada rekod muflis.'];
            }
        }

        // ── Dynamic rules from product_eligibility_rules table ─────────────────
        foreach ($product->activeRules as $rule) {
            $result = $this->evaluateRule($rule, $applicantData, $age);
            if ($result === true) {
                $passed[] = ['rule' => $rule->rule_code, 'message' => $rule->rule_name];
            } elseif ($result === false) {
                $entry = [
                    'rule'    => $rule->rule_code,
                    'message' => $rule->rejection_message ?? $rule->rule_name,
                    'hard'    => $rule->is_hard_reject,
                ];
                if ($rule->is_hard_reject) {
                    $failed[] = $entry;
                } else {
                    $warnings[] = $entry;
                }
            }
        }

        $hardFailed = array_filter($failed, fn($f) => $f['hard'] ?? true);
        $eligible   = count($hardFailed) === 0;

        return [
            'eligible'   => $eligible,
            'product_id' => $product->id,
            'product'    => $product->name,
            'passed'     => $passed,
            'failed'     => $failed,
            'warnings'   => $warnings,
            'summary'    => $eligible
                ? 'Pemohon layak untuk skim ' . $product->name . '.'
                : 'Pemohon tidak layak. ' . count($hardFailed) . ' syarat tidak dipenuhi.',
        ];
    }

    /**
     * Check applicant against ALL active products and return eligibility matrix.
     */
    public function checkAllProducts(array $applicantData): array
    {
        $products = FinancingProduct::with('activeRules')->active()->ordered()->get();
        $results  = [];

        foreach ($products as $product) {
            $results[] = $this->check($product, $applicantData);
        }

        return $results;
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private function deriveAge(array $data): ?int
    {
        if (!empty($data['dob'])) {
            try {
                return Carbon::parse($data['dob'])->age;
            } catch (\Exception $e) {
                // fall through
            }
        }

        // Derive from IC (Malaysian MyKad: YYMMDD-PB-XXXX)
        if (!empty($data['ic'])) {
            $ic = preg_replace('/\D/', '', $data['ic']);
            if (strlen($ic) === 12) {
                $yy = (int) substr($ic, 0, 2);
                $mm = (int) substr($ic, 2, 2);
                $dd = (int) substr($ic, 4, 2);
                $year = $yy >= 0 && $yy <= (int) date('y') ? 2000 + $yy : 1900 + $yy;
                try {
                    return Carbon::createFromDate($year, $mm, $dd)->age;
                } catch (\Exception $e) {
                    // fall through
                }
            }
        }

        return null;
    }

    private function evaluateRule(ProductEligibilityRule $rule, array $data, ?int $age): ?bool
    {
        $value = $rule->rule_value;

        switch ($rule->rule_type) {
            case 'age':
                if ($age === null) return null;
                return $this->compare($age, $rule->operator, $value);

            case 'gender':
                $gender = strtoupper($data['gender'] ?? '');
                if (!$gender) return null;
                return $this->compare($gender, $rule->operator, $value);

            case 'sector':
                $sector = strtolower($data['sector'] ?? '');
                if (!$sector) return null;
                return $this->compare($sector, $rule->operator, $value);

            case 'blacklist':
                $isBlacklisted = (bool) ($data['is_blacklisted'] ?? false);
                return $this->compare($isBlacklisted, $rule->operator, $value);

            case 'business_age':
                $months = (int) ($data['business_age_months'] ?? 0);
                return $this->compare($months, $rule->operator, $value);

            default:
                return null;
        }
    }

    private function compare(mixed $actual, string $operator, mixed $expected): bool
    {
        // Unwrap single-element arrays
        if (is_array($expected) && count($expected) === 1 && !in_array($operator, ['in', 'not_in', 'between'])) {
            $expected = $expected[0];
        }

        return match ($operator) {
            'gte'     => $actual >= $expected,
            'lte'     => $actual <= $expected,
            'gt'      => $actual > $expected,
            'lt'      => $actual < $expected,
            'eq'      => $actual == $expected,
            'neq'     => $actual != $expected,
            'in'      => in_array($actual, (array) $expected),
            'not_in'  => !in_array($actual, (array) $expected),
            'between' => is_array($expected) && count($expected) === 2
                         && $actual >= $expected[0] && $actual <= $expected[1],
            default   => false,
        };
    }
}
