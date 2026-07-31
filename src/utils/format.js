// Hàm định dạng dùng chung trong toàn bộ app (tiền VND, phần trăm).
// (Trước đây nằm trong data/materials.js cùng 1 mảng dữ liệu vật liệu mẫu
// không liên quan tới app báo giá khung tranh và không nơi nào dùng tới —
// đã bỏ mảng đó, chỉ giữ lại 2 hàm format thực sự được dùng.)
export const formatVND = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)

export const formatPercent = (value) =>
  new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 1,
  }).format(value) + '%'
