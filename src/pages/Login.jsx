import { useState } from "react";
import { login } from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("❌ Login gagal. Periksa email & password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 via-emerald-400 to-green-700 dark:from-gray-900 dark:via-gray-800 dark:to-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/logo 3.jpg" alt="logo" className="w-20 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">
            Login Admin
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Masuk untuk mengelola konten
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3 text-red-500 text-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-2"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800">
            <Mail className="text-gray-400 dark:text-gray-300 mr-2" size={18} />
            <input
              type="email"
              placeholder="Email"
              className="flex-grow outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800">
            <Lock className="text-gray-400 dark:text-gray-300 mr-2" size={18} />
            <input
              type="password"
              placeholder="Password"
              className="flex-grow outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
          >
            <LogIn size={18} /> Masuk
          </button>
        </form>
      </motion.div>
    </div>
  );
}
