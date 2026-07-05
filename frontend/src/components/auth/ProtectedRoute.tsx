import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredModule?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requiredModule,
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Wait for Zustand persist to hydrate from localStorage before checking auth.
  // Dual-check: if isAuthenticated is already true (fresh login via login() call),
  // skip hydration wait entirely. Otherwise wait for localStorage hydration.
  const [hydrated, setHydrated] = useState(() => {
    if (isAuthenticated) return true; // fresh login — already in memory
    return useAuthStore.persist.hasHydrated();
  });

  useEffect(() => {
    // Fresh login: isAuthenticated just became true in memory
    if (isAuthenticated && !hydrated) {
      setHydrated(true);
      return;
    }
    if (!hydrated) {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      if (useAuthStore.persist.hasHydrated()) setHydrated(true);
      return unsub;
    }
  }, [hydrated, isAuthenticated]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#1B2B5E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Memuatkan...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = user.role;
  const isAdmin = role === 'system_admin';

  if (allowedRoles && !isAdmin && !allowedRoles.includes(role)) {
    return <AccessDenied role={user.role_label} />;
  }

  if (requiredModule && !isAdmin) {
    const perms = user.permissions as any;
    const modules: string[] = perms?.modules ?? [];
    if (!modules.includes('*') && !modules.includes(requiredModule)) {
      return <AccessDenied role={user.role_label} module={requiredModule} />;
    }
  }

  return <>{children}</>;
}

function AccessDenied({ role, module }: { role: string; module?: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-6xl">🔒</div>
      <h2 className="text-2xl font-bold" style={{ color: '#1B2B5E' }}>
        Akses Ditolak
      </h2>
      <p className="text-gray-500 text-center max-w-sm">
        Peranan anda sebagai <strong>{role}</strong> tidak mempunyai kebenaran
        untuk mengakses {module ? `modul ${module}` : 'halaman ini'}.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="btn btn-navy"
      >
        Kembali ke Dashboard
      </button>
    </div>
  );
}
