import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import WorkerNav from '../components/layout/WorkerNav';
import AuthGuard from '../components/auth/AuthGuard';

export default function WorkerLayout() {
  return (
    <AuthGuard allowedRoles={['WORKER']}>
      <Header />
      <div className="worker-layout">
        <WorkerNav />
        <main className="app-main-with-sidebar">
          <Outlet />
        </main>
      </div>
    </AuthGuard>
  );
}
