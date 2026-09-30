"use client";
import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { TRAVEL_TIPS } from "@/data/travelTips";
import { TipCard } from "@/components/user/TipCard";

export default function TipsPage() {
    const [query, setQuery] = useState("");
    const [tag, setTag] = useState("Tất cả");
    const tags = useMemo(() => ["Tất cả", ...new Set(TRAVEL_TIPS.map((t) => t.tag))], []);

    const visible = TRAVEL_TIPS.filter((tip) => {
        const q = query.trim().toLowerCase();
        const matchQuery = !q || tip.title.toLowerCase().includes(q) || tip.excerpt.toLowerCase().includes(q);
        return matchQuery && (tag === "Tất cả" || tip.tag === tag);
    });

    return (
        <div className="min-h-screen bg-[var(--bg-paper)] pb-20">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="font-display flex items-center gap-2 text-3xl font-bold text-[var(--text-main)]">
                        <BookOpen className="h-7 w-7 text-purple-500" /> Cẩm nang du lịch
                    </h1>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Kinh nghiệm thực tế được đội ngũ Journify tổng hợp: chuẩn bị, ngân sách, an toàn và các điểm đến theo mùa.
                    </p>
                </div>

                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tìm bài viết..."
                            className="w-full rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-[var(--accent-primary)]"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
                        {tags.map((t) => (
                            <button
                                key={t}
                                onClick={() => setTag(t)}
                                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                                    tag === t
                                        ? "bg-[var(--text-main)] text-[var(--bg-paper)]"
                                        : "border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--text-main)]"
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {visible.length === 0 ? (
                    <p className="py-16 text-center text-sm text-[var(--text-muted)]">Không có bài viết phù hợp.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {visible.map((tip) => (
                            <TipCard key={tip.slug} tip={tip} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
