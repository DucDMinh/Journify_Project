import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lộ trình của tôi" };

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
