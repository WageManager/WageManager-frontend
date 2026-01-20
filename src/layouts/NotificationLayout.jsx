import Header from "../components/layout/Header.tsx";

export default function NotificationLayout({ children }) {
  return (
    <>
      <Header />
      <main className="app-main">
        {children}
      </main>
    </>
  );
}
