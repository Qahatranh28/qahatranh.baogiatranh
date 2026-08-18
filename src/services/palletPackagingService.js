// src/services/palletPackagingService.js
//
// 🌟 ĐÓNG GÓI PALLET — ÁP DỤNG CHO CẢ ĐƠN (không phải cho từng sản phẩm)
//
// Đây là mức giá TẠM THỜI do sale/admin chọn tay theo kích thước lớn nhất của
// đơn hàng (ví dụ khung dài hơn 1m, hơn 1,5m hay hơn 2m thì cần đóng pallet gỗ
// để vận chuyển). Khi nào có công thức tính chính xác hơn (theo thể tích, số
// lượng sản phẩm, khoảng cách giao hàng...), chỉ cần sửa lại hàm
// `computePalletPackagingFee` bên dưới — toàn bộ UI (PalletPackagingOption.jsx)
// và useQuoteBuilder.js sẽ tự động dùng công thức mới, không cần sửa gì thêm.

// Danh sách mốc đóng gói pallet mặc định. Admin có thể sửa số tiền ở đây khi
// chưa có công thức chuẩn.
export const PALLET_PACKAGING_TIERS = [
  { id: 'over_1m', label: 'Trên 1m', threshold: 100, price: 400000 },
  { id: 'over_1_5m', label: 'Trên 1,5m', threshold: 150, price: 600000 },
  { id: 'over_2m', label: 'Trên 2m', threshold: 200, price: 800000 },
]

// Lấy thông tin 1 mốc theo id
export function getPalletTierById(tierId) {
  return PALLET_PACKAGING_TIERS.find((t) => t.id === tierId) || null
}

// Tính phí đóng gói pallet.
// - Nếu không bật đóng gói pallet -> 0đ.
// - Nếu có chọn tay 1 mốc (tierId) -> lấy đúng giá của mốc đó.
// - Nếu không chọn tay mà có truyền kích thước lớn nhất của đơn (maxDimensionCm)
//   thì tự động chọn mốc phù hợp (dự phòng cho sau này khi công thức tính theo
//   kích thước được xác nhận).
export function computePalletPackagingFee({ enabled = false, tierId = null, maxDimensionCm = 0 } = {}) {
  if (!enabled) return { fee: 0, tier: null }

  if (tierId) {
    const tier = getPalletTierById(tierId)
    return { fee: tier ? tier.price : 0, tier }
  }

  const dim = Number(maxDimensionCm) || 0
  // Chọn mốc cao nhất mà kích thước vượt qua (dò từ lớn xuống nhỏ)
  const autoTier = [...PALLET_PACKAGING_TIERS].reverse().find((t) => dim > t.threshold) || null
  return { fee: autoTier ? autoTier.price : 0, tier: autoTier }
}
