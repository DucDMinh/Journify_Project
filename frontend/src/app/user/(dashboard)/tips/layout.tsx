import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Cẩm nang du lịch", template: "%s | Journify" } };

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
