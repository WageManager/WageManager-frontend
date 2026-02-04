import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import EmployerNav from '../components/layout/EmployerNav';
import AuthGuard from '../components/auth/AuthGuard';

export default function EmployerLayout() {
  return (
    <AuthGuard allowedRoles={['EMPLOYER']}>
      <Header />
      <div className="employer-layout">
        <EmployerNav />
        <main className="app-main-with-sidebar">
          <Outlet />
        </main>
      </div>
    </AuthGuard>
  );
}
