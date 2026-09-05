import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function Dashboard() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Tổng quan" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-4">
          Chào mừng đến với Hệ thống Quản trị!
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Đây là bảng điều khiển dành cho Admin. Tại đây bạn có thể quản lý các địa điểm phượt, thêm mới hình ảnh và tọa độ lên hệ thống cơ sở dữ liệu Supabase.
        </p>
      </div>
    </div>
  );
}