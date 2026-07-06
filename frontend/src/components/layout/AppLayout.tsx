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

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Toaster } from 'react-hot-toast';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function AppLayout() {
  const { title, subtitle } = usePageTitle();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F5F6FA' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontSize: 13, borderRadius: 8 },
          success: { iconTheme: { primary: '#2E7D32', secondary: 'white' } },
          error: { iconTheme: { primary: '#C62828', secondary: 'white' } },
        }}
      />
    </div>
  );
}
