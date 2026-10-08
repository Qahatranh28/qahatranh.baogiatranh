// Toàn bộ phân quyền của trang báo giá mới nằm ở đây — muốn đổi quyền chỉ sửa file này.
// Role giữ nguyên như hệ thống cũ: admin | editor | sale (lấy từ bảng `admin`).

export const ROLE_LABELS = { admin: 'Quản lý', editor: 'Biên tập viên', sale: 'Sale' }

export function getPerms(user) {
  const role = user?.role
  const isAdmin = role === 'admin'
  const isEditor = role === 'editor'
  const isSale = role === 'sale'
  return {
    role,
    isAdmin,
    isEditor,
    isSale,
    canCreateQuote: isAdmin || isEditor || isSale,
    canViewSheets: isAdmin || isEditor,
    // Xem/nhập giá vốn, lợi nhuận, biên lợi nhuận (giống hệ thống cũ: chỉ admin)
    canSeeCost: isAdmin,
    // Sale chỉ thấy báo giá của mình; admin & editor thấy tất cả
    seeAllQuotes: isAdmin || isEditor,
    // Chuyển trạng thái "Đã chốt" (duyệt) — chỉ quản lý
    canApprove: isAdmin,
    canDeleteQuote: isAdmin,
    // Sửa thông tin công ty / điều khoản MẶC ĐỊNH cho mọi báo giá
    canEditDefaults: isAdmin || isEditor,
    canManageAccounts: isAdmin,
    tabs: isAdmin ? ['quotes', 'customers', 'stats', 'accounts'] : ['quotes', 'customers', 'stats'],
  }
}

// Sale chỉ sửa được báo giá của chính mình; admin/editor sửa tất cả.
export function canEditQuote(user, quote) {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'editor') return true
  return String(quote?.ownerId ?? '') === '' || String(quote?.ownerId) === String(user.id)
}
