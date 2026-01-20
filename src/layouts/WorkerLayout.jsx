import { Outlet } from "react-router-dom";
import Header from "../components/layout/Header.tsx";
import WorkerNav from "../components/layout/WorkerNav.jsx";

export default function WorkerLayout() {
  return (
    <>
      <Header />
      <div className="worker-layout">
        <WorkerNav />
        <main className="app-main-with-sidebar">
          <Outlet />
        </main>
      </div>
    </>
  );
}
