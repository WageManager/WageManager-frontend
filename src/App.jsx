import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage.jsx";

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
          <Route path="remittance-manage" element={<RemittanceManagePage />} />
          <Route path="worker-manage" element={<WorkerManagePage />} />
          <Route path="add-workplace" element={<AddWorkplacePage />} />
          <Route path="employer-mypage" element={<EmployerMyPage />} />
          <Route
            path="employer-mypage-receive"
            element={<EmployerMyPageReceive />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
