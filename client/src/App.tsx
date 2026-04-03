import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/auth-context";
import RootLayout from "@/components/layout/root-layout";
import HomePage from "@/pages/home";
import EventsPage from "@/pages/events";
import EventDetailPage from "@/pages/event-detail";
import LeaderboardPage from "@/pages/leaderboard";
import ContactPage from "@/pages/contact";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import VerifyEmailPage from "@/pages/verify-email";
import ResetPasswordPage from "@/pages/reset-password";
import ProfilePage from "@/pages/profile";
import CoordinatorDashboard from "@/pages/coordinator-dashboard";
import AdminDashboard from "@/pages/admin";
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
              background: "#09090b",
              color: "#ffffff",
              border: "1px solid #27272a",
              borderRadius: "0px",
              fontSize: "13px",
              fontFamily: "monospace",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#09090b" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#09090b" },
            },
          }}
        />
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:eventId" element={<EventDetailPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/leaderboard/:eventId" element={<LeaderboardPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-events" element={<MyEventsPage />} />
            <Route path="/coordinator/:eventId" element={<CoordinatorDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
