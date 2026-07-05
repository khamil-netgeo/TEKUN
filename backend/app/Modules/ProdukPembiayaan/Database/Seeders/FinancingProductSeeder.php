<?php

namespace App\Modules\ProdukPembiayaan\Database\Seeders;

use Illuminate\Database\Seeder;
use App\Modules\ProdukPembiayaan\Models\FinancingProduct;
use App\Modules\ProdukPembiayaan\Models\ProductEligibilityRule;

/**
 * Module 9 — Produk Pembiayaan
 * Seeds the 4 TEKUN financing schemes with eligibility rules.
 */
class FinancingProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'code'                       => 'SKM-001',
                'name'                       => 'TEKUN Mikro',
                'name_en'                    => 'TEKUN Micro',
                'description'                => 'Pembiayaan mikro untuk usahawan kecil yang memerlukan modal permulaan atau modal pusingan. Sesuai untuk perniagaan baru dan sedia ada.',
                'description_en'             => 'Micro financing for small entrepreneurs needing start-up or working capital. Suitable for new and existing businesses.',
                'min_amount'                 => 1000.00,
                'max_amount'                 => 50000.00,
                'profit_rate'                => 4.00,
                'min_tenure_months'          => 6,
                'max_tenure_months'          => 36,
                'processing_fee_type'        => 'fixed',
                'processing_fee_value'       => 0.00,
                'min_age'                    => 18,
                'max_age'                    => 60,
                'min_business_age_months'    => 0,
                'eligible_sectors'           => ['all'],
                'eligible_genders'           => ['M', 'F'],
                'eligible_races'             => null,
                'requires_ssm_registration'  => false,
                'requires_business_premises' => false,
                'blacklist_check_required'   => true,
                'ccris_check_required'       => true,
                'ctos_check_required'        => true,
                'muflis_check_required'      => true,
                'esyariah_check_required'    => false,
                'required_documents'         => ['IC', 'BORANG_PERMOHONAN', 'PENYATA_BANK_3BULAN'],
                'is_active'                  => true,
                'color_hex'                  => '#1B2B5E',
                'display_order'              => 1,
            ],
            [
                'code'                       => 'SKM-002',
                'name'                       => 'TEKUN Usahawan',
                'name_en'                    => 'TEKUN Entrepreneur',
                'description'                => 'Pembiayaan untuk usahawan yang ingin mengembangkan perniagaan sedia ada. Memerlukan perniagaan berdaftar dengan SSM.',
                'description_en'             => 'Financing for entrepreneurs looking to expand existing businesses. Requires SSM-registered business.',
                'min_amount'                 => 50000.00,
                'max_amount'                 => 500000.00,
                'profit_rate'                => 4.00,
                'min_tenure_months'          => 12,
                'max_tenure_months'          => 60,
                'processing_fee_type'        => 'percentage',
                'processing_fee_value'       => 0.50,
                'min_age'                    => 21,
                'max_age'                    => 60,
                'min_business_age_months'    => 12,
                'eligible_sectors'           => ['all'],
                'eligible_genders'           => ['M', 'F'],
                'eligible_races'             => null,
                'requires_ssm_registration'  => true,
                'requires_business_premises' => true,
                'blacklist_check_required'   => true,
                'ccris_check_required'       => true,
                'ctos_check_required'        => true,
                'muflis_check_required'      => true,
                'esyariah_check_required'    => false,
                'required_documents'         => ['IC', 'BORANG_PERMOHONAN', 'SIJIL_SSM', 'PENYATA_BANK_6BULAN', 'PENYATA_KEWANGAN'],
                'is_active'                  => true,
                'color_hex'                  => '#E65100',
                'display_order'              => 2,
            ],
            [
                'code'                       => 'SKM-003',
                'name'                       => 'TEKUN Wanita',
                'name_en'                    => 'TEKUN Women',
                'description'                => 'Skim pembiayaan khas untuk usahawan wanita. Kadar keuntungan yang lebih rendah untuk memperkasakan wanita dalam perniagaan.',
                'description_en'             => 'Special financing scheme for women entrepreneurs. Lower profit rate to empower women in business.',
                'min_amount'                 => 1000.00,
                'max_amount'                 => 200000.00,
                'profit_rate'                => 3.50,
                'min_tenure_months'          => 6,
                'max_tenure_months'          => 60,
                'processing_fee_type'        => 'fixed',
                'processing_fee_value'       => 0.00,
                'min_age'                    => 18,
                'max_age'                    => 60,
                'min_business_age_months'    => 0,
                'eligible_sectors'           => ['all'],
                'eligible_genders'           => ['F'],
                'eligible_races'             => null,
                'requires_ssm_registration'  => false,
                'requires_business_premises' => false,
                'blacklist_check_required'   => true,
                'ccris_check_required'       => true,
                'ctos_check_required'        => true,
                'muflis_check_required'      => true,
                'esyariah_check_required'    => false,
                'required_documents'         => ['IC', 'BORANG_PERMOHONAN', 'PENYATA_BANK_3BULAN'],
                'is_active'                  => true,
                'color_hex'                  => '#880E4F',
                'display_order'              => 3,
            ],
            [
                'code'                       => 'SKM-004',
                'name'                       => 'TEKUN Belia',
                'name_en'                    => 'TEKUN Youth',
                'description'                => 'Skim pembiayaan khas untuk usahawan muda berusia 18-35 tahun. Kadar keuntungan yang lebih rendah untuk menggalakkan keusahawanan belia.',
                'description_en'             => 'Special financing scheme for young entrepreneurs aged 18-35. Lower profit rate to encourage youth entrepreneurship.',
                'min_amount'                 => 1000.00,
                'max_amount'                 => 100000.00,
                'profit_rate'                => 3.50,
                'min_tenure_months'          => 6,
                'max_tenure_months'          => 48,
                'processing_fee_type'        => 'fixed',
                'processing_fee_value'       => 0.00,
                'min_age'                    => 18,
                'max_age'                    => 35,
                'min_business_age_months'    => 0,
                'eligible_sectors'           => ['all'],
                'eligible_genders'           => ['M', 'F'],
                'eligible_races'             => null,
                'requires_ssm_registration'  => false,
                'requires_business_premises' => false,
                'blacklist_check_required'   => true,
                'ccris_check_required'       => true,
                'ctos_check_required'        => true,
                'muflis_check_required'      => true,
                'esyariah_check_required'    => false,
                'required_documents'         => ['IC', 'BORANG_PERMOHONAN', 'PENYATA_BANK_3BULAN'],
                'is_active'                  => true,
                'color_hex'                  => '#2E7D32',
                'display_order'              => 4,
            ],
        ];

        foreach ($products as $productData) {
            $product = FinancingProduct::updateOrCreate(
                ['code' => $productData['code']],
                $productData
            );

            // Seed eligibility rules for each product
            $this->seedRules($product);
        }

        $this->command->info('✅ 4 financing products seeded with eligibility rules.');
    }

    private function seedRules(FinancingProduct $product): void
    {
        $rules = [];

        // Common rules for all products
        $rules[] = [
            'rule_code'           => 'CITIZENSHIP',
            'rule_name'           => 'Warganegara Malaysia',
            'rule_name_en'        => 'Malaysian Citizenship',
            'rule_type'           => 'custom',
            'operator'            => 'eq',
            'rule_value'          => [true],
            'is_hard_reject'      => true,
            'rejection_message'   => 'Pemohon mestilah warganegara Malaysia.',
            'rejection_message_en'=> 'Applicant must be a Malaysian citizen.',
            'is_active'           => true,
            'priority'            => 10,
        ];

        // Product-specific rules
        if ($product->code === 'SKM-003') {
            // TEKUN Wanita — gender rule
            $rules[] = [
                'rule_code'           => 'GENDER_FEMALE',
                'rule_name'           => 'Pemohon mestilah wanita',
                'rule_name_en'        => 'Applicant must be female',
                'rule_type'           => 'gender',
                'operator'            => 'eq',
                'rule_value'          => ['F'],
                'is_hard_reject'      => true,
                'rejection_message'   => 'Skim TEKUN Wanita terhad kepada pemohon wanita sahaja.',
                'rejection_message_en'=> 'TEKUN Wanita scheme is restricted to female applicants only.',
                'is_active'           => true,
                'priority'            => 20,
            ];
        }

        if ($product->code === 'SKM-004') {
            // TEKUN Belia — age rule
            $rules[] = [
                'rule_code'           => 'AGE_BELIA',
                'rule_name'           => 'Umur 18–35 tahun',
                'rule_name_en'        => 'Age 18–35 years',
                'rule_type'           => 'age',
                'operator'            => 'between',
                'rule_value'          => [18, 35],
                'is_hard_reject'      => true,
                'rejection_message'   => 'Skim TEKUN Belia terhad kepada pemohon berumur 18 hingga 35 tahun.',
                'rejection_message_en'=> 'TEKUN Belia scheme is restricted to applicants aged 18 to 35 years.',
                'is_active'           => true,
                'priority'            => 20,
            ];
        }

        if ($product->code === 'SKM-002') {
            // TEKUN Usahawan — business age rule
            $rules[] = [
                'rule_code'           => 'BUSINESS_AGE_12M',
                'rule_name'           => 'Perniagaan beroperasi sekurang-kurangnya 12 bulan',
                'rule_name_en'        => 'Business must be operating for at least 12 months',
                'rule_type'           => 'business_age',
                'operator'            => 'gte',
                'rule_value'          => [12],
                'is_hard_reject'      => true,
                'rejection_message'   => 'Perniagaan mesti beroperasi sekurang-kurangnya 12 bulan untuk skim Usahawan.',
                'rejection_message_en'=> 'Business must be operating for at least 12 months for the Usahawan scheme.',
                'is_active'           => true,
                'priority'            => 30,
            ];
        }

        foreach ($rules as $ruleData) {
            ProductEligibilityRule::updateOrCreate(
                [
                    'financing_product_id' => $product->id,
                    'rule_code'            => $ruleData['rule_code'],
                ],
                array_merge($ruleData, ['financing_product_id' => $product->id])
            );
        }
    }
}
