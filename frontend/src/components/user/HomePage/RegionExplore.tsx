/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { REGION_GRADIENTS, regionCover, useRegions } from "@/hooks/user/useRegions";

export const RegionExplore = () => {
    const { regions, isLoading } = useRegions();

    return (
        <section>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="font-display flex items-center gap-2 text-2xl font-bold">
                        <MapPin className="h-6 w-6 text-rose-500" /> Khám phá theo vùng miền
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Chọn một vùng đất để bắt đầu hành trình</p>
                </div>
                <Link href="/explore" className="text-sm font-bold text-[var(--accent-primary)] hover:underline">
                    Xem 34 tỉnh thành
                </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {isLoading
                    ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-[var(--border-color)] md:h-48" />)
                    : (regions ?? []).map((region) => (
                          <Link key={region.key} href={`/explore?region=${region.key}`}>
                              <motion.div whileHover={{ y: -5 }} className="group relative h-40 cursor-pointer overflow-hidden rounded-2xl shadow-sm md:h-48">
                                  <img src={regionCover(region)} alt={region.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                                      <h3 className="text-lg font-bold">{region.name}</h3>
                                      <p className="text-xs opacity-85">
                                          {region.provinces.length} tỉnh · {region.locations} địa điểm · {region.itineraries} lộ trình
                                      </p>
                                  </div>
                                  <div className={`absolute right-3 top-3 h-8 w-8 rounded-full bg-gradient-to-br ${REGION_GRADIENTS[region.key] ?? "from-slate-500 to-slate-700"} opacity-90 shadow-lg`} />
                              </motion.div>
                          </Link>
                      ))}
            </div>
        </section>
    );
};
