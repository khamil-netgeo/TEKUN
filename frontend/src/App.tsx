import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, Component, type ReactNode, type ErrorInfo } from 'react';
import '@/i18n';

// Global Error Boundary — catches component crashes and shows a user-friendly message instead of blank screen
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SPPT ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5F6FA', gap: 16, padding: 24 }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ color: '#1B2B5E', fontSize: 20, fontWeight: 700, margin: 0 }}>Ralat Sistem</h2>
          <p style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', maxWidth: 400, margin: 0 }}>
            Halaman ini mengalami ralat yang tidak dijangka. Sila muat semula halaman atau hubungi pentadbir sistem.
          </p>
          <p style={{ color: '#9CA3AF', fontSize: 12, fontFamily: 'monospace', background: '#F3F4F6', padding: '8px 16px', borderRadius: 8, maxWidth: 500, wordBreak: 'break-all' }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{ background: '#1B2B5E', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Muat Semula
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy load pages
const LoginPage            = lazy(() => import('@/pages/auth/LoginPage'));
const LandingPage          = lazy(() => import('@/pages/public/LandingPage'));
const MulaMohonPage        = lazy(() => import('@/pages/public/MulaMohonPage'));
const CaraMohonPage        = lazy(() => import('@/pages/public/CaraMohonPage'));
const FAQPage              = lazy(() => import('@/pages/public/FAQPage'));
const MengenaiPage         = lazy(() => import('@/pages/public/MengenaiPage'));
const SemakKelayakanPage   = lazy(() => import('@/pages/public/SemakKelayakanPage'));
const DashboardPage        = lazy(() => import('@/pages/DashboardPage'));

// Module 1 — Permohonan & Kelayakan
const ApplicationList      = lazy(() => import('@/pages/module1/ApplicationList'));
const NewApplication       = lazy(() => import('@/pages/module1/NewApplication'));
const RegistrationEkyc     = lazy(() => import('@/pages/module1/RegistrationEkyc'));
const OtpVerification      = lazy(() => import('@/pages/module1/OtpVerification'));
const AutoReject           = lazy(() => import('@/pages/module1/AutoReject'));
const DocumentUpload       = lazy(() => import('@/pages/module1/DocumentUpload'));
const ApplicationTimeline  = lazy(() => import('@/pages/module1/ApplicationTimeline'));

// Module 2 — Penilaian Kredit
const CreditDashboard      = lazy(() => import('@/pages/module2/CreditDashboard'));
const CreditScoring        = lazy(() => import('@/pages/module2/CreditScoring'));
const AmortizationCalc     = lazy(() => import('@/pages/module2/AmortizationCalc'));
const ApprovalWorkflow     = lazy(() => import('@/pages/module2/ApprovalWorkflow'));
const OfferLetter          = lazy(() => import('@/pages/module2/OfferLetter'));

// Module 3 — Pengeluaran Dana
const DisbursementList     = lazy(() => import('@/pages/module3/DisbursementList'));
const EsignTracking        = lazy(() => import('@/pages/module3/EsignTracking'));
const AgingEscalation      = lazy(() => import('@/pages/module3/AgingEscalation'));
const AuthorityMatrix      = lazy(() => import('@/pages/module3/AuthorityMatrix'));

// Module 4 — Pengurusan Akaun
const Account360           = lazy(() => import('@/pages/module4/Account360'));
const PaymentChannels      = lazy(() => import('@/pages/module4/PaymentChannels'));
const Moratorium           = lazy(() => import('@/pages/module4/Moratorium'));
const TawidhCalculator     = lazy(() => import('@/pages/module4/TawidhCalculator'));

// Module 5 — Pemulihan & NPL
const NplDashboard         = lazy(() => import('@/pages/module5/NplDashboard'));
const DunningWorkflow      = lazy(() => import('@/pages/module5/DunningWorkflow'));

// Module 6 — Dashboard & Analitik
const ExecutiveDashboard   = lazy(() => import('@/pages/module6/ExecutiveDashboard'));
const ReportBuilder        = lazy(() => import('@/pages/module6/ReportBuilder'));

// Module 7 — CRM & Usahawan
const EntrepreneurProfile  = lazy(() => import('@/pages/module7/EntrepreneurProfile'));
const FieldVisit           = lazy(() => import('@/pages/module7/FieldVisit'));

// Module 8 — Pengurusan Cawangan
const BranchManagement     = lazy(() => import('@/pages/module8/BranchManagement'));

// Module 9 — Produk Pembiayaan
const ProductConfig        = lazy(() => import('@/pages/module9/ProductConfig'));

// Module 10 — Integrasi API
const ApiHealth            = lazy(() => import('@/pages/module10/ApiHealth'));

// Module 11 — Audit & Kawalan
const AuditTrail           = lazy(() => import('@/pages/module11/AuditTrail'));

// Module 12 — Pentadbiran Sistem
const UserManagement       = lazy(() => import('@/pages/module12/UserManagement'));

// Admin
const AdminPage            = lazy(() => import('@/pages/admin/AdminPage'));

// ─────────────────────────────────────────────────────────────────────────────
// Role constants (from tender document)
// ─────────────────────────────────────────────────────────────────────────────
const R = {
  USAHAWAN:        'usahawan',
  BRANCH_OFFICER:  'branch_officer',
  BRANCH_MANAGER:  'branch_manager',
  CREDIT_OFFICER:  'credit_officer',
  FINANCE_OFFICER: 'finance_officer',
  EXECUTIVE:       'executive',
  SYSTEM_ADMIN:    'system_admin',
} as const;

// Module 1 roles
const M1_ROLES = [R.USAHAWAN, R.BRANCH_OFFICER, R.BRANCH_MANAGER];
// Module 2 roles
const M2_ROLES = [R.BRANCH_OFFICER, R.BRANCH_MANAGER, R.CREDIT_OFFICER];
// Module 3 roles
const M3_ROLES = [R.BRANCH_MANAGER, R.CREDIT_OFFICER, R.FINANCE_OFFICER];
// Module 4 roles
const M4_ROLES = [R.USAHAWAN, R.FINANCE_OFFICER];
// Module 5 roles — usahawan can view own NPL/payment notices per tender
const M5_ROLES = [R.USAHAWAN, R.CREDIT_OFFICER, R.FINANCE_OFFICER];
// Module 6 roles
const M6_ROLES = [R.CREDIT_OFFICER, R.EXECUTIVE];
// Module 7 roles
const M7_ROLES = [R.BRANCH_OFFICER, R.BRANCH_MANAGER, R.CREDIT_OFFICER];
// Module 8 roles
const M8_ROLES = [R.BRANCH_MANAGER, R.EXECUTIVE];
// Module 9–12 roles (admin only)
const ADMIN_ONLY = [R.SYSTEM_ADMIN];

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-4 animate-spin"
          style={{ borderColor: '#E8EAF0', borderTopColor: '#1B2B5E' }}
        />
        <span className="text-sm" style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
          Memuatkan...
        </span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/daftar" element={<RegistrationEkyc />} />
          <Route path="/register" element={<RegistrationEkyc />} />
          <Route path="/mula-mohon" element={<MulaMohonPage />} />
          <Route path="/cara-mohon" element={<CaraMohonPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/mengenai" element={<MengenaiPage />} />
          <Route path="/semak-kelayakan" element={<SemakKelayakanPage />} />
          <Route path="/otp" element={<OtpVerification />} />
          <Route path="/permohonan/ditolak" element={<AutoReject />} />

          {/* Protected App Routes — outer guard: must be authenticated */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard — all authenticated users */}
            <Route path="dashboard" element={<DashboardPage />} />

            {/* ── MODULE 1 — Permohonan & Kelayakan ─────────────────────── */}
            <Route
              path="module1/applications"
              element={
                <ProtectedRoute allowedRoles={M1_ROLES} requiredModule="module1">
                  <ApplicationList />
                </ProtectedRoute>
              }
            />
            <Route
              path="module1/new"
              element={
                <ProtectedRoute allowedRoles={[R.USAHAWAN, R.BRANCH_OFFICER, R.BRANCH_MANAGER]} requiredModule="module1">
                  <NewApplication />
                </ProtectedRoute>
              }
            />
            <Route path="module1/documents" element={<ProtectedRoute allowedRoles={M1_ROLES} requiredModule="module1"><DocumentUpload /></ProtectedRoute>} />
            <Route path="module1/timeline"  element={<ProtectedRoute allowedRoles={M1_ROLES} requiredModule="module1"><ApplicationTimeline /></ProtectedRoute>} />

            {/* ── MODULE 2 — Penilaian & Kelulusan ──────────────────────── */}
            <Route path="module2/dashboard"      element={<ProtectedRoute allowedRoles={M2_ROLES} requiredModule="module2"><CreditDashboard /></ProtectedRoute>} />
            <Route path="module2/scoring"        element={<ProtectedRoute allowedRoles={M2_ROLES} requiredModule="module2"><CreditScoring /></ProtectedRoute>} />
            <Route path="module2/credit-scoring" element={<ProtectedRoute allowedRoles={M2_ROLES} requiredModule="module2"><CreditScoring /></ProtectedRoute>} />
            <Route path="module2/assessment/:refNo" element={<ProtectedRoute allowedRoles={M2_ROLES} requiredModule="module2"><CreditScoring /></ProtectedRoute>} />
            <Route path="module2/amortization"element={<ProtectedRoute allowedRoles={M2_ROLES} requiredModule="module2"><AmortizationCalc /></ProtectedRoute>} />
            <Route path="module2/approval"    element={<ProtectedRoute allowedRoles={[R.BRANCH_MANAGER, R.CREDIT_OFFICER]} requiredModule="module2"><ApprovalWorkflow /></ProtectedRoute>} />
            <Route path="module2/offer-letter"element={<ProtectedRoute allowedRoles={M2_ROLES} requiredModule="module2"><OfferLetter /></ProtectedRoute>} />

            {/* ── MODULE 3 — Pengeluaran Dana ────────────────────────────── */}
            <Route path="module3/disbursement"element={<ProtectedRoute allowedRoles={M3_ROLES} requiredModule="module3"><DisbursementList /></ProtectedRoute>} />
            <Route path="module3/esign"       element={<ProtectedRoute allowedRoles={M3_ROLES} requiredModule="module3"><EsignTracking /></ProtectedRoute>} />
            <Route path="module3/aging"       element={<ProtectedRoute allowedRoles={M3_ROLES} requiredModule="module3"><AgingEscalation /></ProtectedRoute>} />
            <Route path="module3/authority"   element={<ProtectedRoute allowedRoles={M3_ROLES} requiredModule="module3"><AuthorityMatrix /></ProtectedRoute>} />

            {/* ── MODULE 4 — Pengurusan Akaun ────────────────────────────── */}
            <Route path="module4/accounts"    element={<ProtectedRoute allowedRoles={M4_ROLES} requiredModule="module4"><Account360 /></ProtectedRoute>} />
            <Route path="module4/payments"    element={<ProtectedRoute allowedRoles={M4_ROLES} requiredModule="module4"><PaymentChannels /></ProtectedRoute>} />
            <Route path="module4/moratorium"  element={<ProtectedRoute allowedRoles={[R.FINANCE_OFFICER]} requiredModule="module4"><Moratorium /></ProtectedRoute>} />
            <Route path="module4/tawidh"      element={<ProtectedRoute allowedRoles={[R.FINANCE_OFFICER]} requiredModule="module4"><TawidhCalculator /></ProtectedRoute>} />

            {/* ── MODULE 5 — Pemantauan & Kutipan ───────────────────────── */}
            <Route path="module5/npl"           element={<ProtectedRoute allowedRoles={M5_ROLES} requiredModule="module5"><NplDashboard /></ProtectedRoute>} />
            <Route path="module5/npl-dashboard" element={<ProtectedRoute allowedRoles={M5_ROLES} requiredModule="module5"><NplDashboard /></ProtectedRoute>} />
            <Route path="module5/dunning"       element={<ProtectedRoute allowedRoles={M5_ROLES} requiredModule="module5"><DunningWorkflow /></ProtectedRoute>} />

            {/* ── MODULE 6 — Dashboard & Analitik ───────────────────────── */}
            <Route path="module6/dashboard"            element={<ProtectedRoute allowedRoles={M6_ROLES} requiredModule="module6"><ExecutiveDashboard /></ProtectedRoute>} />
            <Route path="module6/executive-dashboard"  element={<ProtectedRoute allowedRoles={M6_ROLES} requiredModule="module6"><ExecutiveDashboard /></ProtectedRoute>} />
            <Route path="module6/reports"              element={<ProtectedRoute allowedRoles={M6_ROLES} requiredModule="module6"><ReportBuilder /></ProtectedRoute>} />

            {/* ── MODULE 7 — CRM & Usahawan ─────────────────────────────── */}
            <Route path="module7/entrepreneurs" element={<ProtectedRoute allowedRoles={M7_ROLES} requiredModule="module7"><EntrepreneurProfile /></ProtectedRoute>} />
            <Route path="module7/field-visits"  element={<ProtectedRoute allowedRoles={M7_ROLES} requiredModule="module7"><FieldVisit /></ProtectedRoute>} />

            {/* ── MODULE 8 — Pengurusan Cawangan ────────────────────────── */}
            <Route path="module8/branches" element={<ProtectedRoute allowedRoles={M8_ROLES} requiredModule="module8"><BranchManagement /></ProtectedRoute>} />

            {/* ── MODULE 9 — Produk Pembiayaan (admin only) ─────────────── */}
            <Route path="module9/products" element={<ProtectedRoute allowedRoles={ADMIN_ONLY} requiredModule="module9"><ProductConfig /></ProtectedRoute>} />

            {/* ── MODULE 10 — Integrasi API (admin only) ────────────────── */}
            <Route path="module10/api-health" element={<ProtectedRoute allowedRoles={ADMIN_ONLY} requiredModule="module10"><ApiHealth /></ProtectedRoute>} />

            {/* ── MODULE 11 — Audit & Kawalan ───────────────────────────── */}
            <Route path="module11/audit" element={<ProtectedRoute allowedRoles={[R.EXECUTIVE, R.SYSTEM_ADMIN]} requiredModule="module11"><AuditTrail /></ProtectedRoute>} />

            {/* ── MODULE 12 — Pentadbiran Sistem (admin only) ───────────── */}
            <Route path="module12/users" element={<ProtectedRoute allowedRoles={ADMIN_ONLY} requiredModule="module12"><UserManagement /></ProtectedRoute>} />

            {/* Admin page */}
            <Route path="admin" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><AdminPage /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
