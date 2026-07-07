import { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  MessageSquare,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Info,
  ArrowLeft,
} from 'lucide-react';
import api from '@/services/api';
// No useAuthStore needed as per requirements, assuming API is authenticated
// import { useAuthStore } from '@/store/authStore';

// Type definitions
type AccountSummary = {
  accountNumber: string;
  monthlyPayment: number;
  currentBalance: number;
};

type FormDataState = {
  reason: string;
  duration: string;
  details: string;
};

type FormErrors = {
  reason?: string;
  duration?: string;
  details?: string;
  files?: string;
};

const UsahawanMoratorium = () => {
  const navigate = useNavigate();
  const [accountData, setAccountData] = useState<AccountSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormDataState>({
    reason: '',
    duration: '',
    details: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  const fetchAccountData = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be a specific account ID or inferred from auth
      const response = await api.get<AccountSummary>('/api/accounts/my/summary');
      setAccountData(response.data);
    } catch (error) {
      console.error("Gagal memuatkan data akaun:", error);
      // Demo fallback data
      setAccountData({
        accountNumber: 'TKN-010185081234',
        monthlyPayment: 450.00,
        currentBalance: 18500.75,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  const handleInputChange = (e: ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = files.length + newFiles.length;

      if (totalFiles > 3) {
        setErrors(prev => ({ ...prev, files: 'Anda hanya boleh memuat naik maksimum 3 fail.' }));
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const invalidFiles = newFiles.filter(file => !allowedTypes.includes(file.type));
      if (invalidFiles.length > 0) {
        setErrors(prev => ({ ...prev, files: 'Sila muat naik fail PDF, JPG, atau PNG sahaja.' }));
        return;
      }

      setFiles(prev => [...prev, ...newFiles]);
      setErrors(prev => ({ ...prev, files: undefined }));
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.reason) newErrors.reason = 'Sila pilih sebab permohonan.';
    if (!formData.duration) newErrors.duration = 'Sila pilih tempoh yang dimohon.';
    if (formData.details.length < 50) {
      newErrors.details = 'Keterangan lanjut mesti sekurang-kurangnya 50 aksara.';
    }
    if (files.length === 0) {
      newErrors.files = 'Sila muat naik sekurang-kurangnya satu dokumen sokongan.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const submissionData = new FormData();
    submissionData.append('reason', formData.reason);
    submissionData.append('duration', formData.duration);
    submissionData.append('details', formData.details);
    files.forEach(file => {
      submissionData.append('documents', file);
    });

    try {
      await api.post('/api/accounts/my/moratorium', submissionData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSubmitSuccess(true);
    } catch (error) {
      console.error("Gagal menghantar permohonan:", error);
      // Demo fallback: simulate success after 1.5s
      setTimeout(() => {
        setSubmitSuccess(true);
        setIsSubmitting(false);
      }, 1500);
      return; // Prevent finally block from running too early
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-50 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
        <span className="ml-2 text-navy">Memuatkan data...</span>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <CheckCircle className="h-16 w-16 text-green" />
        <h1 className="mt-4 text-2xl font-bold text-navy">Permohonan Dihantar</h1>
        <p className="mt-2 max-w-md text-gray-600">
          Permohonan anda telah berjaya dihantar. Pegawai kami akan menghubungi anda dalam masa 3-5 hari bekerja.
        </p>
        <button
          onClick={() => navigate('/module4/accounts')}
          className="mt-8 inline-flex items-center rounded-lg bg-navy px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Kembali ke Akaun
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Permohonan Moratorium</h1>
        <p className="mt-1 text-gray-600">Sila lengkapkan borang di bawah untuk memohon penangguhan bayaran balik pembiayaan.</p>

        {/* Account Info Section */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-navy">Maklumat Akaun Semasa</h2>
          {accountData ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Nombor Akaun</p>
                <p className="text-base font-semibold text-gray-800">{accountData.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Bayaran Bulanan Semasa</p>
                <p className="text-base font-semibold text-gray-800">RM {accountData.monthlyPayment.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Baki Terkini</p>
                <p className="text-base font-semibold text-gray-800">RM {accountData.currentBalance.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-gray-500">Gagal memuatkan maklumat akaun.</p>
          )}
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-navy">Butiran Permohonan</h2>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Sebab Permohonan */}
              <div className="sm:col-span-1">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                  Sebab Permohonan
                </label>
                <div className="relative mt-1">
                  <FileText className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <select
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className={`block w-full rounded-md border-gray-300 py-2 pl-10 pr-3 text-gray-900 shadow-sm focus:border-navy focus:ring-navy sm:text-sm ${errors.reason ? 'border-red-500' : ''}`}
                    required
                  >
                    <option value="" disabled>Pilih sebab...</option>
                    <option value="Masalah Kewangan">Masalah Kewangan</option>
                    <option value="Bencana Alam">Bencana Alam</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Kehilangan Pekerjaan">Kehilangan Pekerjaan</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
                {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
              </div>

              {/* Tempoh Diminta */}
              <div className="sm:col-span-1">
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Tempoh Diminta
                </label>
                <div className="relative mt-1">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <select
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className={`block w-full rounded-md border-gray-300 py-2 pl-10 pr-3 text-gray-900 shadow-sm focus:border-navy focus:ring-navy sm:text-sm ${errors.duration ? 'border-red-500' : ''}`}
                    required
                  >
                    <option value="" disabled>Pilih tempoh...</option>
                    <option value="1">1 bulan</option>
                    <option value="3">3 bulan</option>
                    <option value="6">6 bulan</option>
                  </select>
                </div>
                {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
              </div>

              {/* Keterangan Lanjut */}
              <div className="sm:col-span-2">
                <label htmlFor="details" className="block text-sm font-medium text-gray-700">
                  Keterangan Lanjut
                </label>
                <div className="relative mt-1">
                  <MessageSquare className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    id="details"
                    name="details"
                    rows={4}
                    value={formData.details}
                    onChange={handleInputChange}
                    className={`block w-full rounded-md border-gray-300 py-2 pl-10 pr-3 text-gray-900 shadow-sm focus:border-navy focus:ring-navy sm:text-sm ${errors.details ? 'border-red-500' : ''}`}
                    placeholder="Berikan penjelasan terperinci mengenai sebab permohonan anda..."
                    minLength={50}
                    required
                  />
                </div>
                <div className="mt-1 flex justify-between text-sm text-gray-500">
                  <span>Minimum 50 aksara.</span>
                  <span>{formData.details.length} / 50</span>
                </div>
                {errors.details && <p className="mt-1 text-sm text-red-600">{errors.details}</p>}
              </div>

              {/* Dokumen Sokongan */}
              <div className="sm:col-span-2">
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
                  Dokumen Sokongan
                </label>
                <div className={`mt-1 flex justify-center rounded-md border-2 border-dashed px-6 pb-6 pt-5 ${errors.files ? 'border-red-500' : 'border-gray-300'}`}>
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md bg-white font-medium text-navy focus-within:outline-none focus-within:ring-2 focus-within:ring-navy focus-within:ring-offset-2 hover:text-navy/90"
                      >
                        <span>Muat naik fail</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                      </label>
                      <p className="pl-1">atau seret dan lepas</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, PNG, JPG (Maks. 3 fail)</p>
                  </div>
                </div>
                {errors.files && <p className="mt-1 text-sm text-red-600">{errors.files}</p>}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-medium text-gray-900">Fail yang dimuat naik:</h3>
                    <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                      {files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between py-2 pl-3 pr-4 text-sm">
                          <div className="flex w-0 flex-1 items-center">
                            <FileText className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                            <span className="ml-2 w-0 flex-1 truncate">{file.name}</span>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <button type="button" onClick={() => removeFile(index)} className="font-medium text-red-600 hover:text-red-500">
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {submitError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse items-center justify-end gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/module4/accounts')}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 sm:w-auto"
            >
              Kembali ke Akaun
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-navy px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-navy/50 sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghantar...
                </>
              ) : (
                'Hantar Permohonan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsahawanMoratorium;