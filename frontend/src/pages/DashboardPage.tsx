import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist.hasHydrated()
  );

  // Wait for Zustand persist to fully hydrate before attempting redirect
  useEffect(() => {
    if (!hydrated) {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      if (useAuthStore.persist.hasHydrated()) setHydrated(true);
      return unsub;
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }

    const role = user.role;
    if (role === "executive") {
      navigate("/module6/executive-dashboard", { replace: true });
    } else if (role === "credit_officer") {
      navigate("/module2/credit-scoring", { replace: true });
    } else if (role === "branch_officer") {
      navigate("/module1/applications", { replace: true });
    } else if (role === "branch_manager") {
      navigate("/module1/applications", { replace: true });
    } else if (role === "finance_officer") {
      navigate("/module3/disbursement", { replace: true });
    } else if (role === "usahawan") {
      navigate("/module1/applications", { replace: true });
    } else if (role === "system_admin") {
      navigate("/module12/users", { replace: true });
    } else {
      navigate("/module1/applications", { replace: true });
    }
  }, [hydrated, isAuthenticated, user, navigate]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-full border-4 animate-spin mx-auto mb-3"
          style={{ borderColor: "#E8EAF0", borderTopColor: "#1B2B5E" }}
        />
        <p className="text-sm" style={{ color: "#6B7280" }}>
          Mengalihkan ke papan pemuka anda...
        </p>
      </div>
    </div>
  );
}
