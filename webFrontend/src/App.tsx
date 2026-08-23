import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AdminLoginPage from "./pages/AdminLoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import ClientManagementPage from "./pages/ClientManagementPage";
import ClientFormPage from "./pages/ClientFormPage";
import ClientViewPage from "./pages/ClientViewPage";
import ClientComplaintHistoryPage from "./pages/ClientComplaintHistoryPage";
import ClientListPage from "./pages/ClientListPage";
import RiderManagementPage from "./pages/RiderManagementPage";
import RiderFormPage from "./pages/RiderFormPage";
import RiderViewPage from "./pages/RiderViewPage";
import RiderOrderHistoryPage from "./pages/RiderOrderHistoryPage";
import RiderListPage from "./pages/RiderListPage";
import RiderTrackingPage from "./pages/RiderTrackingPage";
import ComplaintManagementPage from "./pages/ComplaintManagementPage";
import ComplaintListPage from "./pages/ComplaintListPage";
import SearchComplaintPage from "./pages/SearchComplaintPage";
import ComplaintDetailPage from "./pages/ComplaintDetailPage";
import PaymentManagementPage from "./pages/PaymentManagementPage";
import PaymentListPage from "./pages/PaymentListPage";

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3500} newestOnTop closeOnClick pauseOnHover />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="clients" element={<ClientManagementPage />} />
            <Route path="clients/new" element={<ClientFormPage />} />
            <Route path="clients/all" element={<ClientListPage />} />
            <Route path="clients/:id" element={<ClientViewPage />} />
            <Route path="clients/:id/edit" element={<ClientFormPage />} />
            <Route path="clients/:id/complaints" element={<ClientComplaintHistoryPage />} />
            <Route path="riders" element={<RiderManagementPage />} />
            <Route path="riders/new" element={<RiderFormPage />} />
            <Route path="riders/all" element={<RiderListPage />} />
            <Route path="riders/:id" element={<RiderViewPage />} />
            <Route path="riders/:id/edit" element={<RiderFormPage />} />
            <Route path="riders/:id/tracking" element={<RiderTrackingPage />} />
            <Route path="riders/:id/orders/:filter" element={<RiderOrderHistoryPage />} />
            <Route path="complaints" element={<ComplaintManagementPage />} />
            <Route path="complaints/search" element={<SearchComplaintPage />} />
            <Route path="complaints/:id/view" element={<ComplaintDetailPage />} />
            <Route path="complaints/:status" element={<ComplaintListPage />} />
            <Route path="payments" element={<PaymentManagementPage />} />
            <Route path="payments/:status" element={<PaymentListPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
