import {
  frameComponentToggles,
  khungTypeOptions,
  micaKinhTypeOptions,
  micaKinhLyOptions,
  vanLyOptions,
  giayBoTypeOptions,
} from '../data/frameDefaults.js'

// 🌟 Bộ toggles mặc định cho tab "Custom" (lấy default từ khai báo frameComponentToggles)
export const defaultToggles = Object.fromEntries(
  frameComponentToggles.map((t) => [t.key, t.default])
)

// 🌟 CẤU HÌNH TOGGLES CHO KHUNG TIÊU CHUẨN (Khung, Tranh in, Kính, Đóng gói - TẮT VÁN LÓT)
export const simpleToggles = {
  khung: true,
  tranhIn: true,
  micaKinh: true,
  van: false,
  giayBo: false,
  satXi: false,
  son: false,
  dongGoi: true,
}

// 🌟 Ngưỡng (cm): chiều dài HOẶC chiều rộng vượt mốc này thì Size lẻ (khung tiêu chuẩn)
// mới tự động chuyển sang tab "Custom". Dưới ngưỡng này luôn áp giá theo size chuẩn
// làm tròn lên (findRoundUpStandardSize), không tự nhảy tab.
export const OVERSIZE_THRESHOLD_CM = 100

// 🌟 Bộ toggles mặc định khi Size lẻ vượt ngưỡng OVERSIZE_THRESHOLD_CM, buộc chuyển sang Custom.
// Theo yêu cầu nghiệp vụ: khổ lớn chỉ cần bật sẵn 2 mục "In tranh" và "Sắt xi",
// mọi mục khác (Khung, Kính/Mica, Ván lót, Giấy bo, Sơn, Đóng gói) đều TẮT —
// sale tự bật/tắt thêm cho phù hợp sau khi đã ở tab Custom.
export const oversizeCustomToggles = {
  khung: false,
  tranhIn: true,
  micaKinh: false,
  van: false,
  giayBo: false,
  satXi: true,
  son: false,
  dongGoi: false,
}

export const defaultSelections = {
  khungType: khungTypeOptions[0],
  tranhInType: 'tranh_in_5ly_mo',
  micaKinhType: micaKinhTypeOptions[0],
  micaKinhLy: micaKinhLyOptions[0],
  // 🌟 Số tấm mica (form Custom): 1 hoặc 2 tấm — mặc định 1 tấm.
  micaSheets: 1,
  vanLy: vanLyOptions[0],
  giayBoType: giayBoTypeOptions[0],
}

// 🌟 Tìm size chuẩn nhỏ nhất (đã có giá bán) mà cả 2 chiều đều ≥ kích thước khách đặt.
// Cho phép xoay ngang/dọc (không phân biệt thứ tự rộng/cao).
// Trả về null nếu không có size chuẩn nào đủ lớn (khách đặt vượt size chuẩn lớn nhất).
export function findRoundUpStandardSize(sizes, w, h) {
  if (!Array.isArray(sizes) || !(w > 0) || !(h > 0)) return null
  const reqMax = Math.max(w, h)
  const reqMin = Math.min(w, h)

  const candidates = sizes.filter((s) => {
    const sw = Number(s?.width) || 0
    const sh = Number(s?.height) || 0
    const price = s?.price != null ? Number(s.price) : null
    if (!(sw > 0) || !(sh > 0) || !(price > 0)) return false
    const sMax = Math.max(sw, sh)
    const sMin = Math.min(sw, sh)
    return sMax >= reqMax && sMin >= reqMin
  })

  if (candidates.length === 0) return null

  candidates.sort((a, b) => a.width * a.height - b.width * b.height)
  return candidates[0]
}