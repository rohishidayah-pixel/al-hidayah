import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewsForm from "./pages/NewsForm";
import Topbar from "./components/Topbar";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#f2f4f7] dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        
        {/* 🔹 Topbar di atas */}
        <Topbar />

        {/* Konten utama */}
        <main className="flex-grow container mx-auto px-4 py-6 pb-24">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/newsform"
              element={
                <ProtectedRoute>
                  <NewsForm />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        {/* Footer desktop */}
        <Footer />

        {/* 🔹 Navbar bawah untuk mobile */}
        <Navbar />
      </div>
    </Router>
  );
}
