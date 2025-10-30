import React from "react";
import { Link } from "react-router-dom";
import { Home, Target, Users, ClipboardList, Newspaper, MessageSquare } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t shadow-lg md:hidden z-50">
      <div className="flex justify-around py-2">
        <Link to="/" className="nav-icon">
          <Home size={22} className="text-gray-700 dark:text-white" />
        </Link>
        <a href="#visi" className="nav-icon">
          <Target size={22} className="text-gray-700 dark:text-white" />
        </a>
        <a href="#struktur" className="nav-icon">
          <Users size={22} className="text-gray-700 dark:text-white" />
        </a>
        <a href="#program" className="nav-icon">
          <ClipboardList size={22} className="text-gray-700 dark:text-white" />
        </a>
        <a href="#berita" className="nav-icon">
          <Newspaper size={22} className="text-gray-700 dark:text-white" />
        </a>
        <a href="#komentar" className="nav-icon">
          <MessageSquare size={22} className="text-gray-700 dark:text-white" />
        </a>
      </div>
    </nav>
  );
}
