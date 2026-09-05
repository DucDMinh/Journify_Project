"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Compass } from "lucide-react";
import { toast } from 'sonner';
import { useAuth } from "@/hooks/auth/AuthContext";

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);


  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading("Đang xử lý...");

    try {
      const endpoint = isLogin ? "http://localhost:8000/auth/login" : "http://localhost:8000/auth/register";
      const bodyData = isLogin ? { email, password } : { name, email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(isLogin ? "Đăng nhập thành công!" : "Đăng ký thành công!", { id: toastId });
        login(result.token, result.user);
        router.push('/');

      } else {
        toast.error(result.message || "Có lỗi xảy ra, vui lòng thử lại.", { id: toastId });
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("Không thể kết nối đến máy chủ.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        <div className="hidden md:flex md:w-1/2 bg-brand-600 relative flex-col justify-between p-12 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-brand-600/20 to-transparent"></div>

          <div className="relative z-10 flex items-center gap-2">
            <Compass className="h-8 w-8" />
            <span className="text-2xl font-black tracking-tight">TravelApp</span>
          </div>

          <div className="relative z-10 mt-auto">
            <motion.h2
              key={isLogin ? "login-title" : "reg-title"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold leading-tight mb-4"
            >
              {isLogin ? "Khám phá thế giới theo cách của bạn." : "Bắt đầu hành trình của bạn ngay hôm nay."}
            </motion.h2>
            <p className="text-brand-100 text-lg">
              Lên kế hoạch, quản lý chi phí và lưu giữ mọi khoảnh khắc tuyệt vời.
            </p>
          </div>
        </div>
        <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "register"}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {isLogin ? "Chào mừng trở lại! 👋" : "Tạo tài khoản mới ✨"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  {isLogin ? "Vui lòng đăng nhập để tiếp tục lịch trình của bạn." : "Điền thông tin bên dưới để tham gia cùng chúng tôi."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Họ và tên</label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 h-5 w-5 text-gray-400" />
                      <input
                        required
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 h-5 w-5 text-gray-400" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hello@example.com"
                      className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mật khẩu</label>
                    {isLogin && <a href="#" className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">Quên mật khẩu?</a>}
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 h-5 w-5 text-gray-400" />
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all dark:text-white"
                    />
                  </div>
                </div>

                <button
                  disabled={isLoading}
                  type="submit"
                  className="w-full mt-6 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setEmail(""); setPassword(""); setName(""); // Reset form
                    }}
                    className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
                  </button>
                </p>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};