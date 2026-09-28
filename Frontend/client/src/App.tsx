import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Interviews from "./pages/Interviews";
import InterviewSetup from "./pages/InterviewSetup";
import InterviewRoom from "./pages/InterviewRoom";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import TestAI from "./pages/TestAI";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/test-ai" element={<TestAI />} />

          {/* Full-screen Live Interview Room */}
          <Route
            path="/interview-room"
            element={
              <ProtectedRoute>
                <InterviewRoom />
              </ProtectedRoute>
            }
          />

          {/* App Shell Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/interview-setup" element={<InterviewSetup />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}