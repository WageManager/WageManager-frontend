import { Routes, Route, Navigate } from "react-router-dom";

// Auth Components
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import KakaoRedirect from "./pages/auth/KakaoRedirect";

// Notification Components
import NotificationPage from "./pages/NotificationPage";

// Worker Components
import WorkerMonthlyCalendarPage from "./pages/workers/WorkerMonthlyCalendarPage";
import WorkerWeeklyCalendarPage from "./pages/workers/WorkerWeeklyCalendarPage";
import WorkerRemittancePage from "./pages/workers/WorkerRemittancePage";
import WorkerMyPage from "./pages/workers/WorkerMyPage";

// Employer Components
import DailyCalendarPage from "./pages/employer/DailyCalendarPage";
import EmployerRemittanceManagePage from "./pages/employer/EmployerRemittanceManagePage";
import EmployerWorkerManagePage from "./pages/employer/EmployerWorkerManagePage";
import EmployerMyPage from "./pages/employer/EmployerMyPage";

// Layouts
import NotificationLayout from "./layouts/NotificationLayout";
import WorkerLayout from "./layouts/WorkerLayout";
import EmployerLayout from "./layouts/EmployerLayout";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/auth" element={<KakaoRedirect />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/notifications" element={<NotificationLayout><NotificationPage /></NotificationLayout>} />
        <Route path="/worker" element={<WorkerLayout />}>
          <Route
            index
            element={<Navigate to="/worker/monthly-calendar" replace />}
          />
          <Route path="monthly-calendar" element={<WorkerMonthlyCalendarPage />} />
          <Route path="weekly-calendar" element={<WorkerWeeklyCalendarPage />} />
          <Route path="remittance" element={<WorkerRemittancePage />} />
          <Route path="mypage" element={<WorkerMyPage />} />
        </Route>

        <Route path="/employer" element={<EmployerLayout />}>
          <Route
            index
            element={<Navigate to="/employer/daily-calendar" replace />}
          />
          <Route path="daily-calendar" element={<DailyCalendarPage />} />
          <Route path="remittance-manage" element={<EmployerRemittanceManagePage />} />
          <Route path="worker-manage" element={<EmployerWorkerManagePage />} />
          <Route path="employer-mypage" element={<EmployerMyPage />} />
          <Route path="employer-mypage-receive" element={<EmployerMyPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
