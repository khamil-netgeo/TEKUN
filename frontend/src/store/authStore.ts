import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * TEKUN SPPT — Auth Store
 * Stores authenticated user info including role and module permissions.
 * Roles defined in Tender Document: TEKUN/SPPT/2026/TENDER
 */

export interface UserPermissions {
  modules:        string[];   // ['module1', 'module3'] or ['*'] for admin
  actions:        string[];   // granular action permissions
  data_scope:     'own' | 'branch' | 'national';
  approval_limit: number;     // max RM amount this role can approve
}

export interface User {
  id:          number;
  name:        string;
  email:       string;
  role:        string;        // e.g. 'branch_officer', 'finance_officer'
  role_label:  string;        // e.g. 'Pegawai Pembiayaan Cawangan'
  branch:      string | null;
  branch_code: string | null;
  state:       string | null;
  permissions: UserPermissions | null;
  token:       string;
}

interface AuthState {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
  login:           (user: User, token: string) => void;
  logout:          () => void;
  hasPermission:   (permission: string) => boolean;
  hasModuleAccess: (module: string) => boolean;
  canApprove:      (amount: number) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,

      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      /** Check if user has a specific action permission */
      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'system_admin') return true;
        const actions = user.permissions?.actions ?? [];
        return actions.includes('*') || actions.includes(permission);
      },

      /** Check if user has access to a specific module */
      hasModuleAccess: (module) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'system_admin') return true;
        const modules = user.permissions?.modules ?? [];
        return modules.includes('*') || modules.includes(module);
      },

      /** Check if user can approve a given RM amount */
      canApprove: (amount) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'system_admin') return true;
        const limit = user.permissions?.approval_limit ?? 0;
        return limit >= amount;
      },
    }),
    {
      name: 'sppt-auth',
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
