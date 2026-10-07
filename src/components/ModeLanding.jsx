const CARDS = [
  {
    id: 'legacy',
    title: 'Báo giá Sale',
    desc: 'Tính giá khung theo vật liệu.',
    badge: null,
    icon: (
      <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    ),
  },
  {
    id: 'new',
    title: 'Báo giá Sale Admin',
    desc: 'Báo giá theo dòng sản phẩm, duyệt biên lợi nhuận, quản lý khách hàng, thống kê và bản xem trước gửi khách.',
    badge: 'Mới · cần đăng nhập',
    primary: true,
    icon: (
      <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    id: 'docs',
    title: 'Báo giá đơn đặt hàng và giao hàng', // 🌟 Rút gọn tiêu đề để không bị rớt dòng
    desc: 'Mỗi báo giá có 1 phiếu báo giá và 1 phiếu giao hàng. Bấm vào chữ để sửa, xem lớn, in hoặc gửi khách.',
    badge: 'Cần đăng nhập',
    icon: (
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M6 3h9l4 4v14H6zM14 3v5h5" /><path d="M9 13h7M9 17h4" />
      </g>
    ),
  },
  {
    id: 'guest',
    title: 'Bảng giá Qahatranh',
    desc: 'Không cần đăng nhập. Chỉ xem bảng giá sản phẩm tiêu chuẩn.',
    badge: 'Không cần đăng nhập',
    icon: (
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </g>
    ),
  },
]

export default function ModeLanding({ onPick }) {
  return (
    <div className="min-h-screen bg-[#eef1f4] flex flex-col items-center justify-center px-4 py-10">
      <img src="/images/logoCompany.png" alt="Qaha Tranh" className="w-20 h-20 rounded-2xl shadow-md mb-4" />
      <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1f2c] text-center">Hệ thống báo giá Qaha Tranh</h1>
      <p className="text-[#6b7280] mt-1 mb-8 text-center">Chọn cách bạn muốn vào hệ thống</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full max-w-6xl">
        {CARDS.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c.id)}
            className={`group text-left rounded-2xl p-6 border transition shadow-sm hover:shadow-lg hover:-translate-y-0.5 flex flex-col h-full ${
              c.primary ? 'bg-[#ff4f25] border-[#ff4f25] text-white' : 'bg-white border-[#e3e7ec] text-[#1a1f2c]'
            }`}
          >
            <span className={`inline-flex w-11 h-11 rounded-xl items-center justify-center mb-4 ${c.primary ? 'bg-white/20' : 'bg-[#f3f4f6]'}`}>
              <svg width="22" height="22" viewBox="0 0 24 24">{c.icon}</svg>
            </span>
            {/* 🌟 Ép tiêu đề nằm trên 1 dòng (whitespace-nowrap) và giới hạn độ rộng để tự động thêm dấu "..." nếu quá dài (truncate) */}
            <h2 className="font-bold text-lg whitespace-nowrap truncate w-full" title={c.title}>{c.title}</h2>
            {/* 🌟 Thêm flex-grow vào phần mô tả để đẩy badge xuống cuối cùng, giúp các thẻ luôn bằng nhau */}
            <p className={`text-sm mt-1.5 leading-relaxed flex-grow ${c.primary ? 'text-white/85' : 'text-[#6b7280]'}`}>{c.desc}</p>
            {c.badge && (
              <span className={`inline-block mt-4 text-[11px] font-semibold px-2.5 py-1 rounded-full w-max ${c.primary ? 'bg-white text-[#ff4f25]' : 'bg-[#f3f4f6] text-[#4b5563]'}`}>
                {c.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}