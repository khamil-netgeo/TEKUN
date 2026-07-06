/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  ⛔  DO NOT MODIFY — SHARED INFRASTRUCTURE FILE                            ║
 * ║                                                                              ║
 * ║  This file is OWNED by the Core Foundation Agent and the Orchestrator.      ║
 * ║  It is shared across ALL 12 modules.                                        ║
 * ║                                                                              ║
 * ║  Module agents (M1–M12) MUST NOT edit this file.                            ║
 * ║  Any change to this file requires Orchestrator approval.                    ║
 * ║                                                                              ║
 * ║  If you need to add module-specific navigation items, add them to           ║
 * ║  your module's routes.tsx file — NOT here.                                  ║
 * ║                                                                              ║
 * ║  Violations will be detected by the pre-commit hook and rejected.           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredModule?: string;
}

/**
 * ProtectedRoute — TEKUN SPPT Auth Guard
 *
 * Strategy: Use a two-phase check.
 * Phase 1: Check Zustand in-memory state (covers fresh login without page reload).
 * Phase 2: If not in memory, wait for localStorage hydration (covers page reload).
 *
 * StrictMode-safe: uses useAuthStore.getState() for synchronous reads to avoid
 * React's double-invoke of useState initializers causing stale closures.
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  requiredModule,
}: ProtectedRouteProps) {
  const location = useLocation();

  // Use getState() for synchronous reads — avoids StrictMode stale closure issues
  const [hydrated, setHydrated] = useState(() => {
    // Check if persist has already hydrated (app was reloaded and localStorage was read)
    if (useAuthStore.persist.hasHydrated()) return true;
    // Check if we have in-memory auth state (fresh login, no reload needed)
    const currentState = useAuthStore.getState();
    if (currentState.isAuthenticated) return true;
    return false;
  });

  // Subscribe to store changes for reactive updates
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (hydrated) return;

    // Subscribe to hydration completion
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Double-check in case hydration already completed between render and effect
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      unsub();
      return;
    }

    return unsub;
  }, [hydrated]);

  // Also watch for isAuthenticated changes (handles fresh login in StrictMode)
  useEffect(() => {
    if (isAuthenticated && !hydrated) {
      setHydrated(true);
    }
  }, [isAuthenticated, hydrated]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#E8EAF0', borderTopColor: '#1B2B5E' }}
          />
          <p className="text-sm text-gray-500">Memuatkan...</p>
        </div>
      </div>
    );
  }

  // Read the LATEST state directly (not from hook closure) to avoid stale state
  const currentState = useAuthStore.getState();
  const currentUser = currentState.user;
  const currentIsAuthenticated = currentState.isAuthenticated;

  if (!currentIsAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = currentUser.role;
  const isAdmin = role === 'system_admin';

  if (allowedRoles && !isAdmin && !allowedRoles.includes(role)) {
    return <AccessDenied role={currentUser.role_label} />;
  }

  if (requiredModule && !isAdmin) {
    const perms = currentUser.permissions as any;
    const modules: string[] = perms?.modules ?? [];
    if (!modules.includes('*') && !modules.includes(requiredModule)) {
      return <AccessDenied role={currentUser.role_label} module={requiredModule} />;
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
