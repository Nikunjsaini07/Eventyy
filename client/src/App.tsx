import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/auth-context";
import RootLayout from "@/components/layout/root-layout";
import HomePage from "@/pages/home";
import EventsPage from "@/pages/events";
import EventDetailPage from "@/pages/event-detail";
import SchedulePage from "@/pages/schedule";
import ContactPage from "@/pages/contact";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import VerifyEmailPage from "@/pages/verify-email";
import ResetPasswordPage from "@/pages/reset-password";
import ProfilePage from "@/pages/profile";
import AdminDashboard from "@/pages/admin";
import CoordinatorPage from "@/pages/coordinator";
import NotFoundPage from "@/pages/not-found";
import MyEventsPage from "@/pages/my-events";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0a0a0a",
              color: "#ffffff",
              border: "1px solid rgba(255, 86, 101, 0.25)",
              borderRadius: "16px",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#0a0a0a" },
            },
            error: {
              iconTheme: { primary: "#f43f5e", secondary: "#0a0a0a" },
            },
          }}
        />
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:eventId" element={<EventDetailPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-events" element={<MyEventsPage />} />
            <Route path="/coordinator" element={<CoordinatorPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
