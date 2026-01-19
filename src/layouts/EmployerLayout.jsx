import { Outlet } from "react-router-dom";
import Header from "../components/layout/Header.tsx";
import EmployerNav from "../components/layout/EmployerNav.jsx";

export default function EmployerLayout() {
  return (
    <>
      <Header />
      <div className="employer-layout">
        <EmployerNav />
        <main className="app-main-with-sidebar">
          <Outlet />
        </main>
      </div>
    </>
  );
}

