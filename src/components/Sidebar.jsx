export default function Sidebar({
  view,
  onViewChange,
  isAdmin,
  isOpen,
  onClose,
  onLoginClick,
  onLogout,
}) {
  return (
    <>
      {/* Overlay khi mở sidebar trên mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-blueprint/40 z-30 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-line z-40 flex flex-col transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-line">
          <div className="w-20 h-20 rounded-lg bg-blueprint flex items-center justify-center overflow-hidden">
            <img 
              src="/images/logoCompany.png" 
              alt="Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => {
              onViewChange('create')
              onClose?.()
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'create'
                ? 'bg-orange-500 text-white' // Khi đang ở trang Báo giá: Nền cam, chữ trắng
                : 'text-gray-600 hover:bg-orange-50 hover:text-orange-500' // Khi ở trang khác: Di chuột vào sẽ sáng màu cam
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <rect x="3" y="2" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M6 6h6M6 9h6M6 12h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Báo giá
          </button>

          <button
            onClick={() => {
              onViewChange('history')
              onClose?.()
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'history'
                ? 'bg-orange-500 text-white' // Khi đang ở trang Báo giá: Nền cam, chữ trắng
                : 'text-gray-600 hover:bg-orange-50 hover:text-orange-500' // Khi ở trang khác: Di chuột vào sẽ sáng màu cam
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M9 4.5V9l3 2M15 9a6 6 0 1 1-6-6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Lịch sử báo giá
          </button>
        </nav>

        <div className="p-3 border-t border-line">
          {isAdmin ? (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blueprint/60 hover:bg-paper transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path
                  d="M7 15.5H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h3M12 12.5l3.5-3.5L12 5.5M15.5 9H7"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Đăng xuất admin
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blueprint/60 hover:bg-paper transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.4" />
                <path d="M3.5 15c.7-2.7 3-4 5.5-4s4.8 1.3 5.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              Đăng nhập admin
            </button>
          )}
        </div>
      </aside>
    </>
  )
}