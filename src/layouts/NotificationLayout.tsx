import Header from '../components/layout/Header';
import AuthGuard from '../components/auth/AuthGuard';

interface NotificationLayoutProps {
  children: React.ReactNode;
}

export default function NotificationLayout({ children }: NotificationLayoutProps) {
  return (
    <AuthGuard>
      <Header />
      <main className="app-main">
        {children}
      </main>
    </AuthGuard>
  );
}
