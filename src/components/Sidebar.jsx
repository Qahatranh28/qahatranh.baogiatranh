export default function Sidebar({
  view,
  onViewChange,
  isAdmin,
  user,                  // 👈 Thêm prop user để nhận dữ liệu từ App.jsx
  isOpen,
  onClose,
  onLoginClick,
  onLogout,
  onAddProductClick,
  onCreateAdminClick,
  onManageProductsClick,
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
          <div className={`w-20 h-20 rounded-lg bg-blueprint flex items-center justify-center overflow-hidden ${isAdmin && user ? 'mb-4' : ''}`}>
            <img 
              src="/images/logoCompany.png" 
              alt="Logo" 
              className="w-full h-full object-contain" 
            />
          </div>

          {/* 🌟 HIỂN THỊ THÔNG TIN USER KHI ĐÃ ĐĂNG NHẬP */}
          {isAdmin && user && (
            <div className="bg-paper p-3 rounded-lg border border-line">
              <p className="text-[10px] font-mono uppercase tracking-widest text-blueprint/50 mb-1">
                Đang đăng nhập
              </p>
              <p className="font-semibold text-sm text-blueprint truncate">
                {user?.full_name || user?.username || 'Người dùng'}
              </p>
              <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded font-medium ${
                user?.role === 'admin' 
                  ? 'bg-amber text-white' 
                  : 'bg-blueprint/10 text-blueprint'
              }`}>
                {user?.role === 'admin' ? 'Quản trị viên' : 'Biên tập viên'}
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => {
              onViewChange('create')
              onClose?.()
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'create'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-orange-50 hover:text-orange-500'
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
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-orange-50 hover:text-orange-500'
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

          {/* Khu vực quản trị dành riêng cho người đã đăng nhập */}
          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-line space-y-1">
              <p className="px-3 text-[10px] font-medium uppercase tracking-widest text-blueprint/50 mb-1">
                Quản trị sản phẩm
              </p>
              
              {/* Nút Thêm sản phẩm mới (Ai cũng thấy) */}
              <button
                onClick={() => {
                  onAddProductClick?.()
                  onClose?.()
                }}
                className="w-full flex items-center gap-2 py-2 px-3 text-sm text-amber font-medium hover:bg-amber/10 rounded-md transition-colors text-left"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="12" height="12" rx="2.5" />
    <path d="M9 6v6M6 9h6" />
  </svg>
                <span>Thêm sản phẩm mới</span>
              </button>

              {/* Nút Xóa / Quản lý sản phẩm (Ai cũng thấy) */}
              <button
                onClick={() => {
                  onManageProductsClick?.()
                  onClose?.()
                }}
                className="w-full flex items-center gap-2 py-2 px-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors text-left"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 4.5h13" />
    <path d="M14 4.5v10a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 4 14.5v-10" />
    <path d="M6.5 4.5v-1.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" />
  </svg>
                <span>Xóa / Quản lý sản phẩm</span>
              </button>

              {/* 🌟 PHÂN QUYỀN: Nút Tạo tài khoản Admin mới CHỈ HIỆN KHI ROLE LÀ ADMIN */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    onCreateAdminClick?.()
                    onClose?.()
                  }}
                  className="w-full flex items-center gap-2 py-2 px-3 text-sm text-blueprint font-medium hover:bg-paper rounded-md transition-colors text-left"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="5.5" r="3" />
      <path d="M12.5 15.5v-1.5a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3v1.5" />
      <path d="M14 5.5v4M12 7.5h4" />
    </svg>
                  <span>Tạo tài khoản hệ thống</span>
                </button>
              )}
            </div>
          )}
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
              Đăng xuất ({user?.full_name || user?.user || 'Admin'})
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