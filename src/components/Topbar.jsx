import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import { LogIn, LogOut, LayoutDashboard } from "lucide-react";
import DarkModeToggle from "./DarkModeToggle";

export default function Topbar() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logobg0.png"
            alt="Logo Light"
            className="h-12 w-auto object-contain dark:hidden"
          />
          <img
            src="/logo-drak.jpg"
            alt="Logo Dark"
            className="h-12 w-auto object-contain hidden dark:block"
          />
        </Link>

        {/* Dark Mode + Auth */}
        <div className="flex items-center gap-3">
          <DarkModeToggle />

          {!user ? (
            <Link to="/login" className="nav-btn bg-green-600 text-white">
              <LogIn size={20} />
            </Link>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="nav-btn bg-green-100 text-green-700"
              >
                <LayoutDashboard size={20} />
              </Link>
              <button
                onClick={handleLogout}
                className="nav-btn bg-red-500 text-white"
              >
                <LogOut size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
