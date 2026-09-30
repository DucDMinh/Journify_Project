/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { TRAVEL_TIPS, getTipBySlug } from "@/data/travelTips";
import { TipCard } from "@/components/user/TipCard";

export function generateStaticParams() {
    return TRAVEL_TIPS.map((tip) => ({ slug: tip.slug }));
}

export default async function TipDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const tip = getTipBySlug(slug);
    if (!tip) notFound();

    const related = TRAVEL_TIPS.filter((t) => t.slug !== tip.slug).slice(0, 3);
    const updated = new Date(tip.updatedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });

    return (
        <div className="min-h-screen bg-[var(--bg-paper)] pb-20">
            <div className="relative h-[320px] overflow-hidden md:h-[420px]">
                <img src={tip.cover} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-paper)] via-black/40 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 mx-auto max-w-3xl px-4 pb-8 sm:px-6">
                    <Link href="/tips" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-white/90 hover:underline">
                        <ArrowLeft className="h-4 w-4" /> Cẩm nang
                    </Link>
                    <span className="mb-3 block w-fit rounded-full bg-[var(--accent-primary)] px-3 py-1 text-xs font-bold text-white">{tip.tag}</span>
                    <h1 className="font-display text-3xl font-bold leading-tight text-white drop-shadow md:text-4xl">{tip.title}</h1>
                    <p className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80">
                        <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" /> {tip.readMinutes} phút đọc
                        </span>
                        <span>Cập nhật {updated}</span>
                    </p>
                </div>
            </div>

            <article className="mx-auto max-w-3xl px-4 sm:px-6">
                <p className="mt-8 text-lg leading-relaxed text-[var(--text-main)]">{tip.excerpt}</p>
                {tip.sections.map((section) => (
                    <section key={section.heading} className="mt-8">
                        <h2 className="font-display text-xl font-bold text-[var(--text-main)]">{section.heading}</h2>
                        {section.paragraphs.map((p, i) => (
                            <p key={i} className="mt-3 leading-relaxed text-[var(--text-main)]/90">
                                {p}
                            </p>
                        ))}
                        {section.bullets && (
                            <ul className="mt-3 space-y-1.5 pl-5">
                                {section.bullets.map((b) => (
                                    <li key={b} className="list-disc text-[var(--text-main)]/90">
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                ))}

                {tip.relatedRegion && (
                    <Link
                        href={`/explore?region=${tip.relatedRegion}`}
                        className="mt-10 flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--accent-primary)]"
                    >
                        <span className="flex items-center gap-3 font-semibold text-[var(--text-main)]">
                            <MapPin className="h-5 w-5 text-[var(--accent-primary)]" /> Khám phá địa điểm trong vùng này
                        </span>
                        <span className="text-sm font-bold text-[var(--accent-primary)]">Xem ngay →</span>
                    </Link>
                )}
            </article>

            <div className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
                <h3 className="font-display mb-5 text-xl font-bold text-[var(--text-main)]">Bài viết liên quan</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {related.map((t) => (
                        <TipCard key={t.slug} tip={t} />
                    ))}
                </div>
            </div>
        </div>
    );
}
