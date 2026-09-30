export interface TipSection {
    heading: string;
    paragraphs: string[];
    bullets?: string[];
}

export interface TravelTip {
    slug: string;
    title: string;
    tag: string;
    excerpt: string;
    cover: string;
    readMinutes: number;
    updatedAt: string;
    relatedRegion?: "mien-bac" | "mien-trung" | "tay-nguyen" | "mien-nam";
    sections: TipSection[];
}

export const TRAVEL_TIPS: TravelTip[] = [
    {
        slug: "checklist-chuan-bi-truoc-chuyen-di",
        title: "Checklist chuẩn bị trước mọi chuyến đi: 24 giờ cuối cùng",
        tag: "Chuẩn bị",
        excerpt: "Danh sách kiểm tra gọn nhẹ để không bao giờ quên sạc dự phòng, giấy tờ hay thuốc cá nhân.",
        cover: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?q=80&w=1200&auto=format&fit=crop",
        readMinutes: 4,
        updatedAt: "2026-08-10",
        sections: [
            {
                heading: "Giấy tờ và tiền bạc",
                paragraphs: ["Chụp lại CCCD, bằng lái và vé xe/máy bay rồi lưu vào một album riêng trên điện thoại. Nếu mất giấy tờ gốc, bản chụp giúp bạn làm việc với khách sạn và cơ quan chức năng nhanh hơn rất nhiều."],
                bullets: ["CCCD/hộ chiếu + bản chụp", "Bằng lái xe (nếu tự lái)", "Tiền mặt nhỏ lẻ cho vùng núi/đảo ít ATM", "Thẻ ngân hàng đã bật thanh toán quốc tế nếu cần"],
            },
            {
                heading: "Đồ điện tử",
                paragraphs: ["Ở vùng cao và đảo, điện có thể chập chờn. Một cục sạc dự phòng 20.000 mAh đủ cho 2–3 ngày dùng bản đồ liên tục."],
                bullets: ["Sạc dự phòng + dây sạc dự phòng", "Tải bản đồ offline khu vực sẽ đi", "Tai nghe, đèn pin nhỏ nếu cắm trại"],
            },
            {
                heading: "Sức khỏe",
                paragraphs: ["Mang theo túi thuốc cá nhân: thuốc say xe, tiêu hóa, hạ sốt, băng cá nhân và thuốc đang dùng hằng ngày. Kiểm tra dự báo thời tiết 3 ngày và điều chỉnh quần áo cho phù hợp."],
            },
            {
                heading: "Trước khi ra khỏi nhà",
                paragraphs: ["Tắt bếp gas, rút phích cắm không cần thiết, gửi lộ trình cho người thân. Trên Journify, bạn có thể bật chế độ chia sẻ công khai để bạn bè theo dõi hành trình."],
            },
        ],
    },
    {
        slug: "kinh-nghiem-di-phuot-mien-nui-phia-bac",
        title: "Kinh nghiệm phượt xe máy miền núi phía Bắc an toàn",
        tag: "Phượt",
        excerpt: "Đèo dốc, sương mù và đường trơn: những nguyên tắc sống còn khi chạy xe qua Hà Giang, Lào Cai, Cao Bằng.",
        cover: "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop",
        readMinutes: 6,
        updatedAt: "2026-07-22",
        relatedRegion: "mien-bac",
        sections: [
            {
                heading: "Chọn xe và kiểm tra trước khi đi",
                paragraphs: ["Xe số hoặc xe côn tay 125–150cc là lựa chọn cân bằng giữa sức kéo và tiết kiệm xăng. Kiểm tra phanh, lốp, đèn và nhớt trước khi xuất phát; đổ đầy bình ở thị trấn cuối cùng vì trên đèo ít cây xăng."],
            },
            {
                heading: "Kỹ thuật đổ đèo",
                paragraphs: ["Xuống dốc dài luôn về số thấp để hãm bằng động cơ, không rà phanh liên tục vì phanh sẽ nóng và mất tác dụng. Vào cua bám làn của mình, bóp còi trước khúc cua khuất."],
                bullets: ["Giữ khoảng cách ít nhất 30 m với xe trước", "Không vượt ở khúc cua và khi sương mù", "Dừng nghỉ mỗi 60–90 phút để tránh mỏi tay"],
            },
            {
                heading: "Thời tiết và giờ chạy",
                paragraphs: ["Sương mù dày nhất từ 5–8h sáng và sau 17h. Cố gắng chạy trong khung 8h–16h, đặc biệt ở Mã Pí Lèng, Ô Quy Hồ và Khau Phạ. Mùa mưa (tháng 6–9) dễ sạt lở, hãy xem cảnh báo giao thông địa phương trước khi đi."],
            },
            {
                heading: "Trang bị",
                paragraphs: ["Mũ bảo hiểm 3/4 hoặc fullface, găng tay, áo giáp mỏng, áo mưa bộ. Túi chống nước cho điện thoại và giấy tờ. Dùng giá đỡ điện thoại có nắp che mưa để theo dõi lộ trình trên Journify."],
            },
        ],
    },
    {
        slug: "lap-ngan-sach-du-lich-tiet-kiem",
        title: "Cách lập ngân sách du lịch tiết kiệm mà vẫn trọn vẹn",
        tag: "Ngân sách",
        excerpt: "Công thức chia ngân sách 40/30/20/10 và những khoản người mới đi hay bỏ sót.",
        cover: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1200&auto=format&fit=crop",
        readMinutes: 5,
        updatedAt: "2026-08-02",
        sections: [
            {
                heading: "Quy tắc 40/30/20/10",
                paragraphs: ["Chia tổng ngân sách thành 4 phần: 40% di chuyển và lưu trú, 30% ăn uống, 20% vé tham quan và trải nghiệm, 10% dự phòng. Phần dự phòng không được động vào trừ trường hợp khẩn cấp."],
            },
            {
                heading: "Những khoản hay quên",
                paragraphs: ["Phí gửi xe, nước uống dọc đường, tip hướng dẫn viên, phí đổi lịch vé và tiền quà mang về thường đội chi phí lên 10–15% so với dự tính."],
                bullets: ["Phí cầu đường, gửi xe", "Bảo hiểm du lịch (rất rẻ so với rủi ro)", "Đồ ăn vặt, cà phê", "Quà cho gia đình"],
            },
            {
                heading: "Mẹo giảm chi phí thật sự hiệu quả",
                paragraphs: ["Đi lệch mùa cao điểm 1–2 tuần, đặt phòng có bếp để tự nấu bữa sáng, đi nhóm 4 người để chia phòng và xe. Với lộ trình dài, dùng AI Planner của Journify để ước tính chi phí từng địa điểm rồi cắt bớt điểm không cần thiết."],
            },
        ],
    },
    {
        slug: "san-may-ta-xua-va-cac-diem-san-may",
        title: "Săn mây đúng cách: Tà Xùa, Y Tý và những điểm săn mây đẹp nhất",
        tag: "Trekking",
        excerpt: "Thời điểm, điều kiện thời tiết và cách đọc dự báo để không lên đến nơi rồi chỉ thấy sương mù.",
        cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop",
        readMinutes: 5,
        updatedAt: "2026-06-30",
        relatedRegion: "mien-bac",
        sections: [
            {
                heading: "Điều kiện để có biển mây",
                paragraphs: ["Biển mây hình thành khi đêm trước lạnh, độ ẩm cao, gió nhẹ và sáng hôm sau nắng ấm. Chênh lệch nhiệt độ ngày đêm từ 8°C trở lên là dấu hiệu tốt. Mùa đẹp nhất là tháng 11 đến tháng 3."],
            },
            {
                heading: "Đọc dự báo thế nào",
                paragraphs: ["Xem độ ẩm 90–100% lúc 4–6h sáng, tốc độ gió dưới 10 km/h, trời quang sau 7h. Nếu mưa cả đêm hôm trước thì gần như chắc chắn có mây nhưng đường trơn, hãy đi thật chậm."],
            },
            {
                heading: "Các điểm săn mây nổi tiếng",
                paragraphs: ["Tà Xùa (Sơn La) với sống lưng khủng long; Y Tý (Lào Cai) mây tràn qua ruộng bậc thang; Đà Lạt có đồi Đa Phú và Cầu Đất dễ tiếp cận bằng xe máy; Bình Liêu (Quảng Ninh) sống lưng khủng long phía đông."],
                bullets: ["Đến điểm ngắm trước bình minh 30–45 phút", "Mang áo khoác dày dù ban ngày nóng", "Không chen lấn ở mép vực để chụp ảnh"],
            },
        ],
    },
    {
        slug: "du-lich-mot-minh-an-toan",
        title: "Du lịch một mình an toàn: nguyên tắc cho người đi solo lần đầu",
        tag: "Solo",
        excerpt: "Từ cách chọn chỗ ở đến việc chia sẻ vị trí, những thói quen nhỏ giúp chuyến đi solo yên tâm hơn.",
        cover: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=1200&auto=format&fit=crop",
        readMinutes: 5,
        updatedAt: "2026-07-05",
        sections: [
            {
                heading: "Chỗ ở",
                paragraphs: ["Ưu tiên homestay/hostel có đánh giá gần đây, gần trung tâm, có lễ tân 24/7. Đọc kỹ đánh giá của những người đi một mình, đặc biệt là về lối đi ban đêm và khóa cửa phòng."],
            },
            {
                heading: "Chia sẻ hành trình",
                paragraphs: ["Gửi lịch trình cho ít nhất một người thân, bật chia sẻ vị trí trực tiếp và hẹn giờ nhắn tin mỗi tối. Lưu số cứu hộ 112, cảnh sát 113 và số khách sạn vào danh bạ khẩn cấp."],
            },
            {
                heading: "Ứng xử trên đường",
                paragraphs: ["Tự tin, quan sát và tin vào trực giác. Không khoe đồ đắt tiền, không nhận đồ uống từ người lạ, tránh về khách sạn quá muộn ở nơi chưa quen. Với các chuyến trekking, luôn thuê porter hoặc đi cùng nhóm tại địa phương."],
            },
            {
                heading: "Kết nối cộng đồng",
                paragraphs: ["Cộng đồng Journify là nơi hỏi kinh nghiệm thực tế từ người vừa đi về. Bạn có thể clone lộ trình công khai của người khác và chỉnh sửa cho phù hợp thay vì lên kế hoạch từ đầu."],
            },
        ],
    },
    {
        slug: "cam-nang-mien-tay-song-nuoc",
        title: "Cẩm nang miền Tây sông nước: chợ nổi, miệt vườn và mùa nước nổi",
        tag: "Miền Nam",
        excerpt: "Đi miền Tây tháng nào đẹp nhất, ăn gì ở Cần Thơ, Đồng Tháp, An Giang và cách đi chợ nổi đúng giờ.",
        cover: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=1200&auto=format&fit=crop",
        readMinutes: 6,
        updatedAt: "2026-08-15",
        relatedRegion: "mien-nam",
        sections: [
            {
                heading: "Thời điểm",
                paragraphs: ["Mùa nước nổi (tháng 9–11) là lúc An Giang, Đồng Tháp đẹp nhất với rừng tràm Trà Sư, cánh đồng sen và cá linh bông điên điển. Mùa trái cây (tháng 5–8) phù hợp với miệt vườn Vĩnh Long, Cần Thơ."],
            },
            {
                heading: "Chợ nổi Cái Răng",
                paragraphs: ["Chợ họp từ 4h30 và tan dần sau 8h. Thuê thuyền tại bến Ninh Kiều từ 5h, mang theo tiền lẻ để ăn bún riêu, hủ tiếu ngay trên ghe. Tránh cuối tuần nếu không muốn đông."],
            },
            {
                heading: "Ăn gì",
                paragraphs: ["Bún cá Châu Đốc, lẩu mắm, bánh xèo củ hủ dừa, cá lóc nướng trui, chè bưởi. Đặc sản mang về: mắm Châu Đốc, khô cá sặc, bánh pía Sóc Trăng."],
            },
            {
                heading: "Di chuyển",
                paragraphs: ["Xe khách giường nằm từ TP.HCM đến Cần Thơ khoảng 3–4 giờ. Trong vùng, thuê xe máy hoặc đi xe buýt liên tỉnh rất rẻ. Với lộ trình 3–4 ngày, gợi ý vòng Cần Thơ → Đồng Tháp → An Giang → về TP.HCM."],
            },
        ],
    },
];

export const getTipBySlug = (slug: string) => TRAVEL_TIPS.find((t) => t.slug === slug);
