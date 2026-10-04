import Link from "next/link";
import { Compass, Home, Map } from "lucide-react";

export const metadata = {
  title: "Không tìm thấy trang",
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-300/30 blur-3xl dark:bg-orange-500/10" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/10" />
      <div className="relative mx-auto w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-lg">
          <Compass className="h-10 w-10" />
        </div>
        <p className="font-display text-7xl font-bold tracking-tight text-gray-900 dark:text-white">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white/90">Bạn đi lạc rồi!</h1>
        <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
          Trang bạn tìm không tồn tại hoặc đã được di chuyển. Hãy quay lại trang chủ để tiếp tục hành trình nhé.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-orange-600"
          >
            <Home className="h-4 w-4" /> Về trang chủ
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Map className="h-4 w-4" /> Khám phá điểm đến
          </Link>
        </div>
      </div>
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Journify
      </p>
    </div>
  );
}
