import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import { ProtectedRoute } from "./components/Ui.jsx";

import Landing from "./pages/Landing.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import StudentRegistration from "./pages/StudentRegistration.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NoticeBoard from "./pages/NoticeBoard.jsx";
import Chapters from "./pages/Chapters.jsx";
import ChapterDetail from "./pages/ChapterDetail.jsx";
import ReportCard from "./pages/ReportCard.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/register"
            element={
              <ProtectedRoute roles={["student", "parent"]}>
                <StudentRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notices"
            element={
              <ProtectedRoute>
                <NoticeBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chapters"
            element={
              <ProtectedRoute>
                <Chapters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chapters/:id"
            element={
              <ProtectedRoute>
                <ChapterDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report-card"
            element={
              <ProtectedRoute roles={["student", "parent"]}>
                <ReportCard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Admin />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Landing />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
