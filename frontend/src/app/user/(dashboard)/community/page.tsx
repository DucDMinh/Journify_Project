/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Search, PenSquare, Map, HelpCircle, MapPin, Calendar, Users,
    MessageCircle, Heart, Share2, ArrowBigUp, ArrowBigDown,
    Trophy, Sparkles, ChevronRight, BookmarkPlus, MoreHorizontal
} from "lucide-react";

// --- MOCK DATA ---
const TOPICS = [
    { icon: "🌍", name: "Tất cả" }, { icon: "🎒", name: "Phượt xe máy" },
    { icon: "🧘‍♀️", name: "Chữa lành" }, { icon: "🍜", name: "Food Tour" },
    { icon: "🏕️", name: "Camping" }, { icon: "👶", name: "Du lịch gia đình" },
    { icon: "🧑‍🤝‍🧑", name: "Cặp đôi" }, { icon: "🚶", name: "Solo Travel" }
];

const FEED_POSTS = [
    {
        id: 1, type: "itinerary", author: "Hải Phạm", avatar: "https://i.pravatar.cc/150?u=1",
        title: "Food Tour Hải Phòng 2N1Đ chỉ với 800k", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800",
        content: "Cuối tuần vừa rồi mình vừa làm chuyến food tour đất Cảng, chia sẻ lại lộ trình siêu tiết kiệm cho anh em nhé...",
        likes: 245, comments: 42, isSaved: false
    },
    {
        id: 2, type: "qa", author: "Linh Tran", avatar: "https://i.pravatar.cc/150?u=2",
        title: "Đi Sapa tháng 10 mùa này có lạnh lắm không mọi người?",
        content: "Sắp tới nhóm mình định đi Sapa, có người già và trẻ nhỏ. Cần chuẩn bị áo khoác dày không ạ?",
        upvotes: 89, comments: 15
    },
    {
        id: 3, type: "review", author: "Hoàng Minh", avatar: "https://i.pravatar.cc/150?u=3", badge: "Chuyên gia Đà Lạt",
        title: "Review Tiệm Cafe Mùa Hè - Góc nhỏ chill chill", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800",
        content: "Quán nằm trong hẻm nhỏ, yên tĩnh, cafe trứng rất ngon. Chấm 9/10 nhé!", rating: 4.5,
        likes: 120, comments: 8
    },
    {
        id: 4, type: "checkin", author: "Trang Nhung", avatar: "https://i.pravatar.cc/150?u=4",
        title: "Đang ở Hội An, có quán nước mót nào vắng không cả nhà? 🌸", image: "https://images.unsplash.com/photo-1557427161-4701a0fa2cbF?q=80&w=800",
        likes: 56, comments: 12
    }
];

const BUDDIES = [
    { id: 1, name: "Mai Anh", dest: "Đà Lạt", dates: "15/08 - 18/08", text: "Mình là nữ (2k), cần tìm 1 bạn nữ ghép phòng Homestay và đi cafe chụp ảnh chéo cho nhau. Đã lo xong vé." },
    { id: 2, name: "Tuấn Hưng", dest: "Tà Xùa", dates: "Cuối tuần này", text: "Tuyển 2 xế cứng đi săn mây Tà Xùa thứ 7 này, nhóm đang có 4 người (2 nam 2 nữ)." }
];

const LEADERBOARD = [
    { id: 1, name: "Tuấn Đạt", role: "Phượt thủ siêu cấp", points: 2540, avatar: "https://i.pravatar.cc/150?u=5" },
    { id: 2, name: "Ngọc Diệp", role: "Food Reviewer", points: 1980, avatar: "https://i.pravatar.cc/150?u=6" },
    { id: 3, name: "Hoàng Oanh", role: "Local Guide", points: 1520, avatar: "https://i.pravatar.cc/150?u=7" }
];

export default function CommunityPage() {
    const [activeTopic, setActiveTopic] = useState("Tất cả");

    return (
        <div className="min-h-screen bg-[var(--bg-paper)] pb-20">
            <div className="relative bg-slate-900 overflow-hidden">
                <div className="absolute inset-0">
                    <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000" alt="Community" className="w-full h-full object-cover opacity-40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-paper)] via-slate-900/60 to-transparent" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-display font-bold text-white mb-4 drop-shadow-md">
                        Khám phá thế giới cùng nhau
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-gray-300 text-sm md:text-base mb-8 max-w-2xl mx-auto">
                        Cộng đồng đam mê xê dịch. Nơi chia sẻ lịch trình, kết bạn đồng hành và giải đáp mọi thắc mắc trên từng chuyến đi.
                    </motion.p>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="max-w-2xl mx-auto mb-10 relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[var(--accent-primary)] transition-colors" />
                        </div>
                        <input type="text" className="block w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:bg-slate-900/80 transition-all shadow-lg" placeholder="Tìm kiếm bài viết, thành viên, hashtag hoặc địa điểm..." />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap justify-center gap-4">
                        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-white font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all">
                            <PenSquare className="w-4 h-4" /> Đăng bài chia sẻ
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold hover:bg-white/20 transition-all">
                            <Map className="w-4 h-4" /> Lộ trình của tôi
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold hover:bg-white/20 transition-all">
                            <HelpCircle className="w-4 h-4" /> Đặt câu hỏi
                        </button>
                    </motion.div>
                </div>
            </div>
            <div className="border-b border-[var(--border-color)] bg-[var(--bg-card) top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex overflow-x-auto py-3 gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {TOPICS.map(topic => (
                            <button
                                key={topic.name}
                                onClick={() => setActiveTopic(topic.name)}
                                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${activeTopic === topic.name ? 'bg-[var(--text-main)] text-[var(--bg-paper)]' : 'bg-[var(--bg-paper)] border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-main)]'}`}
                            >
                                <span>{topic.icon}</span> {topic.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* 🌟 2. BẢNG TIN CỘNG ĐỒNG (CỘT TRÁI - 8 Cột) */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-display text-2xl font-bold">Bảng tin mới nhất</h2>
                        <button className="text-sm font-bold text-[var(--accent-primary)] hover:underline">Sắp xếp: Phổ biến</button>
                    </div>

                    {/* MASONRY LAYOUT */}
                    <div className="columns-1 md:columns-2 gap-6 space-y-6">
                        {FEED_POSTS.map((post) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                key={post.id}
                                className="break-inside-avoid bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Header Post */}
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full object-cover border border-[var(--border-color)]" />
                                        <div>
                                            <p className="font-bold text-sm text-[var(--text-main)] flex items-center gap-1.5">
                                                {post.author}
                                                {post.badge && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full">{post.badge}</span>}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">2 giờ trước</p>
                                        </div>
                                    </div>
                                    <button className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><MoreHorizontal className="w-5 h-5" /></button>
                                </div>

                                {/* Content Post (Thay đổi theo Type) */}
                                {post.image && (
                                    <div className="w-full relative">
                                        <img src={post.image} alt="post img" className="w-full object-cover max-h-80" />
                                        {post.type === "itinerary" && (
                                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                                <Map className="w-3.5 h-3.5" /> Lộ trình chia sẻ
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-2 leading-snug">{post.title}</h3>
                                    <p className="text-sm text-[var(--text-muted)] line-clamp-3 mb-4">{post.content}</p>

                                    {/* Action Bar */}
                                    {post.type === "qa" ? (
                                        // Giao diện Reddit cho Hỏi Đáp
                                        <div className="flex items-center gap-4 border-t border-[var(--border-color)] pt-3">
                                            <div className="flex items-center bg-[var(--bg-paper)] rounded-full border border-[var(--border-color)]">
                                                <button className="p-1.5 hover:text-green-500 hover:bg-green-50 rounded-l-full transition-colors"><ArrowBigUp className="w-5 h-5" /></button>
                                                <span className="font-bold text-sm px-1">{post.upvotes}</span>
                                                <button className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-r-full transition-colors"><ArrowBigDown className="w-5 h-5" /></button>
                                            </div>
                                            <button className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]"><MessageCircle className="w-4 h-4" /> {post.comments}</button>
                                        </div>
                                    ) : (
                                        // Giao diện FB/Instagram cho bài thường
                                        <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-3">
                                            <div className="flex items-center gap-4">
                                                <button className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-rose-500 transition-colors"><Heart className="w-4 h-4" /> {post.likes}</button>
                                                <button className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><MessageCircle className="w-4 h-4" /> {post.comments}</button>
                                            </div>
                                            {post.type === "itinerary" ? (
                                                <button className="flex items-center gap-1 text-xs font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-1.5 rounded-lg hover:bg-[var(--accent-primary)]/20 transition-colors">
                                                    <BookmarkPlus className="w-4 h-4" /> Clone
                                                </button>
                                            ) : (
                                                <button className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><Share2 className="w-4 h-4" /></button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* 🌟 CỘT PHẢI (STICKY SIDEBAR - 4 Cột) */}
                <div className="lg:col-span-4 space-y-8 relative">
                    <div className="sticky top-24 space-y-8">

                        {/* 🌟 6. THỬ THÁCH & SỰ KIỆN */}
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group cursor-pointer">
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform"><Sparkles className="w-20 h-20" /></div>
                            <div className="relative z-10">
                                <span className="bg-white/20 backdrop-blur-md text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Thử thách tháng 8</span>
                                <h3 className="font-display font-bold text-xl mt-3 mb-2 leading-snug">Review góc sống ảo chưa ai biết ở quê bạn!</h3>
                                <p className="text-indigo-100 text-sm mb-4">Top 1 nhận Voucher 1.000.000đ & Huy hiệu &quot;Bậc thầy địa phương&quot;.</p>
                                <button className="w-full py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:shadow-md transition-shadow">Tham gia ngay</button>
                            </div>
                        </div>

                        {/* 🌟 3. TÌM BẠN ĐỒNG HÀNH */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-display font-bold text-lg flex items-center gap-2"><Users className="w-5 h-5 text-[var(--accent-primary)]" /> Tìm bạn đồng hành</h3>
                                <button className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-4">
                                {BUDDIES.map(buddy => (
                                    <div key={buddy.id} className="p-3.5 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-color)] hover:border-[var(--accent-primary)]/40 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-sm">{buddy.name}</span>
                                            <span className="text-[10px] font-bold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-0.5 rounded-full flex items-center gap-1"><MapPin className="w-3 h-3" /> {buddy.dest}</span>
                                        </div>
                                        <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 mb-2"><Calendar className="w-3 h-3" /> {buddy.dates}</p>
                                        <p className="text-xs text-[var(--text-main)] leading-relaxed mb-3">{buddy.text}</p>
                                        <button className="w-full py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-xs font-bold hover:bg-[var(--accent-primary)] hover:text-white hover:border-[var(--accent-primary)] transition-colors">Nhắn tin</button>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-4 py-2.5 bg-[var(--bg-paper)] border border-dashed border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors flex items-center justify-center gap-2">
                                Đăng tin tìm bạn
                            </button>
                        </div>

                        {/* 🌟 5. BẢNG VINH DANH (GAMIFICATION) */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
                            <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-4"><Trophy className="w-5 h-5 text-yellow-500" /> Bảng vinh danh tháng</h3>
                            <div className="space-y-4">
                                {LEADERBOARD.map((user, index) => (
                                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-paper)] transition-colors">
                                        <div className={`w-6 text-center font-display font-bold text-lg ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-700' : 'text-[var(--text-muted)]'}`}>
                                            #{index + 1}
                                        </div>
                                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-[var(--border-color)]" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-[var(--text-main)] truncate">{user.name}</p>
                                            <p className="text-xs text-[var(--text-muted)] truncate">{user.role}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-[var(--accent-primary)]">{user.points}</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">Điểm</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}