const CARDS = [
  {
    id: 'legacy',
    title: 'Trang báo giá cũ',
    desc: 'Tính giá khung theo vật liệu, kích thước như trước đây. Lịch sử lưu ở bảng cũ.',
    badge: null,
    icon: (
      <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    ),
  },
  {
    id: 'new',
    title: 'Trang báo giá mới',
    desc: 'Báo giá theo dòng sản phẩm, duyệt biên lợi nhuận, quản lý khách hàng, thống kê và bản xem trước gửi khách.',
    badge: 'Mới · cần đăng nhập',
    primary: true,
    icon: (
      <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    id: 'guest',
    title: 'Khách xem giá',
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

      <div className="grid gap-4 md:grid-cols-3 w-full max-w-4xl">
        {CARDS.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c.id)}
            className={`group text-left rounded-2xl p-6 border transition shadow-sm hover:shadow-lg hover:-translate-y-0.5 ${
              c.primary ? 'bg-[#ff4f25] border-[#ff4f25] text-white' : 'bg-white border-[#e3e7ec] text-[#1a1f2c]'
            }`}
          >
            <span className={`inline-flex w-11 h-11 rounded-xl items-center justify-center mb-4 ${c.primary ? 'bg-white/20' : 'bg-[#f3f4f6]'}`}>
              <svg width="22" height="22" viewBox="0 0 24 24">{c.icon}</svg>
            </span>
            <h2 className="font-bold text-lg">{c.title}</h2>
            <p className={`text-sm mt-1.5 leading-relaxed ${c.primary ? 'text-white/85' : 'text-[#6b7280]'}`}>{c.desc}</p>
            {c.badge && (
              <span className={`inline-block mt-4 text-[11px] font-semibold px-2.5 py-1 rounded-full ${c.primary ? 'bg-white text-[#ff4f25]' : 'bg-[#f3f4f6] text-[#4b5563]'}`}>
                {c.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
