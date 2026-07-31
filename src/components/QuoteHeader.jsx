export default function QuoteHeader({ onMenuClick }) {
  return (
    <div className="bg-orange-500 rounded-2xl shadow-lg p-6 sm:p-8 flex items-center gap-4">
      <button
        onClick={onMenuClick}
        aria-label="Mở menu"
        className="lg:hidden shrink-0 text-paper/80 hover:text-paper"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">
          BẢNG BÁO GIÁ
        </h1>
        <p className="text-white/60 mt-1">
          Hệ thống tính toán tự động theo yêu cầu
        </p>
      </div>
    </div>
  )
}
