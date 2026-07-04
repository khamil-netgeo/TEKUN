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
