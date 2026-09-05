/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
interface Region {
    name: string;
    image: string;
    count: number;
    color: string;
}
const REGIONS: Region[] = [
    {
        name: "Miền Bắc",
        image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=600&auto=format&fit=crop",
        count: 24,
        color: "from-rose-500 to-amber-500",
    },
    {
        name: "Miền Trung",
        image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=600&auto=format&fit=crop",
        count: 18,
        color: "from-emerald-500 to-teal-500",
    },
    {
        name: "Miền Nam",
        image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=600&auto=format&fit=crop",
        count: 30,
        color: "from-orange-500 to-yellow-500",
    },
    {
        name: "Tây Nguyên",
        image: "https://tse2.mm.bing.net/th/id/OIP.oqXsW9T2Qu1e0LlaTu69uwHaFB?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        count: 12,
        color: "from-purple-500 to-indigo-500",
    },
];

export const RegionExplore = () => {
    return (
        <>
            <section>
                <div className="mb-6">
                    <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-rose-500" /> Khám phá theo vùng miền
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Chọn một vùng đất để bắt đầu hành trình</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {REGIONS.map((region) => (
                        <motion.div
                            key={region.name}
                            whileHover={{ y: -5 }}
                            className="relative rounded-2xl overflow-hidden h-40 md:h-48 cursor-pointer group shadow-sm"
                        >
                            <img src={region.image} alt={region.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                <h3 className="font-bold text-lg">{region.name}</h3>
                                <p className="text-xs opacity-80">{region.count} lộ trình</p>
                            </div>
                            <div className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-gradient-to-br ${region.color} opacity-90 shadow-lg`} />
                        </motion.div>
                    ))}
                </div>
            </section>
        </>
    )
}