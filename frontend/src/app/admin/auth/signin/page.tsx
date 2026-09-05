"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Compass,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle
} from "lucide-react";
import { toast } from 'sonner';
import { useAuth } from "@/hooks/auth/AuthContext";
import { api } from "@/lib/apiClient";
import { useSearchParams } from "next/navigation";

export default function AdminSignInScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const error_message = searchParams.get("error_message");

  useEffect(() => {
    if (error_message === "TOKEN_EXPIRED") {
      toast.error("Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại!");
    }
  }, [error_message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic client-side validation
    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Đang xác thực...");

    try {
      const { response, data } = await api.post("/auth/login", { email, password });
      if (response.ok && (data.success || data.token)) {

        const userRole = data.user?.role?.toUpperCase();
        if (userRole !== "ADMIN") {
          toast.error("Tài khoản không có quyền Quản trị viên!", { id: toastId });
          setError("Bạn không có quyền truy cập vào khu vực này.");
          return;
        }

        toast.success("Đăng nhập thành công! Đang chuyển hướng...", { id: toastId });

        login(data.token, data.user);
        window.location.href = "/";
      } else {
        const message = data.message || "Email hoặc mật khẩu không đúng.";
        toast.error(message, { id: toastId });
        setError(message);
      }
    } catch (err) {
      console.error("Admin Auth Error:", err);
      const msg = "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.";
      toast.error(msg, { id: toastId });
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-400/5 to-indigo-400/5 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }}
      />

      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-4xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-300/30 dark:shadow-black/20 border border-white/50 dark:border-gray-800/50 overflow-hidden flex flex-col md:flex-row min-h-[520px] relative z-10"
      >
        {/* Left Panel - Branding */}
        <div className="relative md:w-[42%] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 lg:p-10 text-white flex flex-col justify-between overflow-hidden">
          {/* Animated background shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-indigo-500/10 rounded-full blur-2xl"
            />
            <motion.div
              animate={{ rotate: -360, scale: [1, 1.1, 1] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -left-20 -bottom-20 w-48 h-48 bg-gradient-to-tr from-cyan-400/20 to-blue-500/10 rounded-full blur-2xl"
            />
            <motion.div
              animate={{ y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border border-white/5 rounded-full"
            />
          </div>

          {/* Logo & Brand */}
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center gap-3 mb-12"
            >
              <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-2xl ring-1 ring-white/20">
                <Compass className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight">TravelApp</span>
                <p className="text-xs text-blue-300/70 font-medium tracking-wider uppercase">
                  Administration
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-300">Secure Admin Portal</span>
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
                Quản trị
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  & Điều hành
                </span>
              </h2>

              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                Khu vực dành riêng cho quản trị viên
              </p>
            </motion.div>
          </div>

          {/* Footer info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="relative z-10 flex items-center gap-4 text-xs text-gray-500"
          >
            <span>&copy; {new Date().getFullYear()} TravelApp</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full" />
            <span>v2.4.1</span>
          </motion.div>
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 p-8 sm:p-12 flex flex-col justify-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-sm mx-auto w-full"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                <LogIn className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Đăng nhập
                </h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dành cho Quản trị viên hệ thống
              </p>
            </motion.div>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mb-6"
                >
                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <motion.form
              variants={containerVariants}
              onSubmit={handleSubmit}
              className="space-y-5"
              noValidate
            >
              {/* Email Field */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                >
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="admin@travelapp.com"
                    autoComplete="email"
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 font-medium"
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    tabIndex={-1}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium transition-colors"
                    onClick={() => toast("Tính năng đang phát triển", { icon: "🔧" })}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-12 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 font-medium"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants} className="pt-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-indigo-600 text-sm tracking-wide"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <span>Truy cập hệ thống</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.form>

            {/* Security note */}
            <motion.p
              variants={itemVariants}
              className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="h-3 w-3" />
              Kết nối được mã hóa và bảo mật
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}