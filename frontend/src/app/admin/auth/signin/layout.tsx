import React from "react";

export default function AdminAuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
            {children}
        </div>
    );
}