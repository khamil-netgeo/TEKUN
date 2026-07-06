import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Search, CheckCircle, XCircle, AlertTriangle, User, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEligibilityChecker } from '../hooks/useProducts';
import type { EligibilityCheckParams, EligibilityCheckResult } from '../types';

function ResultCard({ result }: { result: EligibilityCheckResult }) {
  const { t } = useTranslation();
  return (
    <div
      className={`rounded-xl border-2 p-4 ${
        result.eligible ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-gray-800">{result.product}</h3>
        <span
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
            result.eligible
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {result.eligible ? (
            <><CheckCircle className="w-3 h-3" /> {t('eligibility.eligible')}</>
          ) : (
            <><XCircle className="w-3 h-3" /> {t('eligibility.ineligible')}</>
          )}
        </span>
      </div>

      <p className="text-xs text-gray-600 mb-3">{result.summary}</p>

      {result.failed.length > 0 && (
        <div className="space-y-1 mb-2">
          {result.failed.map((item, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-red-700">
              <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{item.message}</span>
            </div>
          ))}
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="space-y-1 mb-2">
          {result.warnings.map((item, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-yellow-700">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{item.message}</span>
            </div>
          ))}
        </div>
      )}

      {result.passed.length > 0 && (
        <div className="space-y-1">
          {result.passed.map((item, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-green-700">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{item.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EligibilityCheckerPage() {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm<EligibilityCheckParams>();
  const { results, checking, error, checkAll, reset } = useEligibilityChecker();
  const [hasChecked, setHasChecked] = useState(false);

  const onSubmit = async (data: EligibilityCheckParams) => {
    reset();
    setHasChecked(false);
    await checkAll(data);
    setHasChecked(true);
  };

  const eligibleCount = results.filter((r) => r.eligible).length;
  const ineligibleCount = results.filter((r) => !r.eligible).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-tekun-green">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-tekun-blue">
              {t('eligibility.title')}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('eligibility.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Form */}
        <div className="col-span-12 md:col-span-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-tekun-blue" />
                  {t('eligibility.applicantInfo')}
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">
                      {t('eligibility.icNumber')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t('eligibility.icPlaceholder')}
                      maxLength={14}
                      {...register('ic', { required: t('eligibility.icRequired'), minLength: 12 })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tekun-blue focus:border-transparent"
                    />
                    {errors.ic && <p className="text-xs text-red-500 mt-1">{errors.ic?.message}</p>}
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 block mb-1">{t('eligibility.gender')}</label>
                    <select
                      {...register('gender')}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tekun-blue focus:border-transparent"
                    >
                      <option value="">{t('eligibility.select')}</option>
                      <option value="M">{t('eligibility.male')}</option>
                      <option value="F">{t('eligibility.female')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 block mb-1">{t('eligibility.businessSector')}</label>
                    <select
                      {...register('sector')}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tekun-blue focus:border-transparent"
                    >
                      <option value="">{t('eligibility.select')}</option>
                      <option value="perniagaan">{t('eligibility.sectorGeneral')}</option>
                      <option value="pertanian">{t('eligibility.sectorAgriculture')}</option>
                      <option value="perkhidmatan">{t('eligibility.sectorServices')}</option>
                      <option value="pembuatan">{t('eligibility.sectorManufacturing')}</option>
                      <option value="teknologi">{t('eligibility.sectorTechnology')}</option>
                      <option value="makanan">{t('eligibility.sectorFnb')}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-tekun-orange" />
                  {t('eligibility.businessInfo')}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">
                      {t('eligibility.businessAge')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder={t('eligibility.businessAgePlaceholder')}
                      {...register('business_age_months', { min: 0, valueAsNumber: true })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tekun-blue focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  {t('eligibility.externalCheck')}
                </h3>
                <div className="space-y-2">
                  {[
                    { key: 'is_blacklisted' as const, label: t('eligibility.blacklisted'), invert: true },
                    { key: 'ccris_clear' as const, label: t('eligibility.ccrisClear'), invert: false },
                    { key: 'ctos_clear' as const, label: t('eligibility.ctosClear'), invert: false },
                    { key: 'muflis_clear' as const, label: t('eligibility.bankruptClear'), invert: false },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-700">{label}</span>
                      <select
                        {...register(key, { setValueAs: (v) => v === '' ? undefined : v === '1' })}
                        className="text-xs border border-gray-200 rounded p-1 focus:ring-1 focus:ring-tekun-blue"
                      >
                        <option value="">{t('eligibility.unknown')}</option>
                        <option value="1">{t('eligibility.yes')}</option>
                        <option value="0">{t('eligibility.no')}</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={checking}
                className="w-full py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 bg-tekun-blue"
              >
                {checking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('eligibility.checking')}
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    {t('eligibility.checkEligibility')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="col-span-12 md:col-span-7">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {hasChecked && results.length > 0 && (
            <div className="space-y-3">
              {/* Summary bar */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-700">{t('eligibility.checkResults')}</h3>
                <div className="flex gap-3">
                  <span className="flex items-center gap-1 text-sm font-semibold text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    {eligibleCount} {t('eligibility.eligible')}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-red-600">
                    <XCircle className="w-4 h-4" />
                    {ineligibleCount} {t('eligibility.ineligible')}
                  </span>
                </div>
              </div>

              {results.map((result) => (
                <ResultCard key={result.product_id} result={result} />
              ))}
            </div>
          )}

          {!hasChecked && !checking && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t('eligibility.emptyState')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}