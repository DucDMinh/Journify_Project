import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: { absolute: "Tổng quan | Quản trị Journify", template: "%s | Quản trị Journify" },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-950 items-center">
      {children}
    </div>
  );
}
