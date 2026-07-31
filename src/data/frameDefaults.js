// Giá trị mặc định của các đơn giá & hệ số tiêu hao, dùng cho công cụ tính
// giá thành khung tranh trong trang Admin. Admin có thể chỉnh sửa các giá trị
// này; chúng chỉ được tính lại thành bảng chi tiết khi nhập chiều dài/chiều rộng.
export const defaultFrameSettings = {
  // Đơn giá vật tư (lấy theo mức giá phổ biến nhất trong bảng làm mặc định)
  khungPerM: 35000, // VND/m 
  tranhInPerM2: 398131, // VND/m² (giữ nguyên theo mẫu cũ của bạn)
  micaPerM2: 193160, // VND/m² (Lấy theo giá Mica Trong 2 ly)
  kinhPerM2: 85000, // VND/m² (Lấy theo bảng giá Kính)
  vanPerM2: 38632, // VND/m² (Lấy theo giá Ván 4 ly)
  giayBoPerM2: 32771, // VND/m² (Lấy theo giá Giấy bo trắng 0.8 ly)
  satXiPerM: 10000, // VND/m
  keGocPerBo: 4500, // VND/bộ
  mocTreoPerCai: 500, // VND/cái
  dayTreoPerM: 500, // VND/m
  dinhGhimPerCai: 60, // VND/cái
  peCuonPerKg: 45000, // VND/kg
  xopBongKhiPerCay: 380000, // VND/cây
  cartonPerKg: 5000, // VND/kg
  bangKeoPerCay: 90000, // VND/cây

  // Nhân công & chi phí chung
  luongNhanCongPerGio: 40000, // VND/giờ
  tyLeSXC: 30, // % trên chi phí nhân công trực tiếp
  markupPercent: 40, // % lợi nhuận cộng thêm vào giá vốn để ra giá bán khách hàng

  // Hệ số tiêu hao / định mức
  vien_cm: 2,
  day_cm: 3,
  haoHutKhung_cm: 20,
  haoHutSatXi_cm: 60,
  gioLam1mKhung: 0.1, // giờ/m
  gioLam1m2MicaKinhVan: 0.2, // giờ/m²
  gioLam1m2GiayBo: 0.25, // giờ/m²
  gioSon1mKhung: 0.17, // giờ/m
  gioDongGoi1m2: 0.5, // giờ/m²
  mocTreoMacDinh_cai: 2,
  dayTreoMacDinh_m: 1,
  dinhGhimTheoGoc_cai: 3, // mỗi góc, 4 góc
  dinhGhimTheoChuVi_per10cm: 1, // 1 cái / 10cm chu vi
}

export const frameComponentToggles = [
  { key: 'khung', label: 'Đóng khung', default: true },
  { key: 'tranhIn', label: 'In tranh', default: false },
  { key: 'micaKinh', label: 'Mica / Kính', default: false },
  { key: 'van', label: 'Ván lót', default: false },
  { key: 'giayBo', label: 'Giấy bo (matboard)', default: false },
  { key: 'satXi', label: 'Sắt xi', default: false },
  { key: 'son', label: 'Sơn', default: false },
  { key: 'dongGoi', label: 'Đóng gói', default: false },
]

// ==========================================
// 1. CÁC TÙY CHỌN KHUNG
// ==========================================
export const khungTypeOptions = [
  'Khung nhựa 1,5x1,5',
  'Khung nhựa 2x3',
  'Khung gỗ tự nhiên 2x3',
  'Khung gỗ tự nhiên vintage 2x3',
  'Khung nhôm tròn',
  'Khung nhôm vuông 0,5x2,5',
  'Khung nhôm vuông Dày 0,5x3,5',
  'Khung gương',
]

// Nhận diện LOẠI KHUNG có phải khung nhôm hay không (để tính Bộ ke góc)
export const isNhomType = (type) => (type || '').toLowerCase().includes('nhôm')


// ==========================================
// 2. CÁC TÙY CHỌN IN TRANH & GIÁ GỐC
// ==========================================
export const tranhInTypeOptions = [
  'Tranh in giấy mỹ thuật',
  'Tranh in 9 ly mờ',
  'Tranh in 9 ly bóng',
  'Tranh in 5 ly mờ',
  'Tranh in formex 10 ly bóng',
  'Tranh in formex 10 ly mờ',
  'Tranh in canvas đúng size',
  'Tranh in canvas căng khung tràn viền',
  'Tranh in canvas căng khung nổi hoàn thiện'
]

export const tranhInTypeRates = {
  'Tranh in giấy mỹ thuật': 255399,
  'Tranh in 9 ly mờ': 358598,
  'Tranh in 9 ly bóng': 402823,
  'Tranh in 5 ly mờ': 302787,
  'Tranh in formex 10 ly bóng': 552984,
  'Tranh in formex 10 ly mờ': 529657,
  'Tranh in canvas đúng size': 237272,
  'Tranh in canvas căng khung tràn viền': 527510,
  'Tranh in canvas căng khung nổi hoàn thiện': 975271,
}

export function getTranhInTypeRate(tranhInType, fallbackRate) {
  const rate = tranhInTypeRates[tranhInType]
  return rate != null ? rate : fallbackRate
}


// ==========================================
// 3. CÁC TÙY CHỌN MICA / KÍNH & GIÁ GỐC
// ==========================================
export const micaKinhTypeOptions = [
  'Mica',
  'Kính'
]

// Hàm kiểm tra xem lựa chọn hiện tại có phải là Kính không (Dùng để ẩn dropdown số Ly)
export const isKinhType = (type) => (type || '').toLowerCase().includes('kính')

// Các tùy chọn số Ly và Giá chỉ dành riêng cho Mica
export const micaKinhLyOptions = ['1,5 ly', '2 ly', '3 ly', '4 ly']

export const micaTypeRates = {
  '1,5 ly': 184538,
  '2 ly': 193160,
  '3 ly': 277479,
  '4 ly': 370196,
}


// ==========================================
// 4. CÁC TÙY CHỌN VÁN LÓT & GIÁ GỐC
// ==========================================
export const vanLyOptions = ['2,5 ly', '4 ly', '8 ly']

export const vanTypeRates = {
  '2,5 ly': 26874,
  '4 ly': 38632,
  '8 ly': 45350,
}


// ==========================================
// 5. CÁC TÙY CHỌN GIẤY BO & GIÁ GỐC
// ==========================================
export const giayBoTypeOptions = [
  'Giấy bo màu 0.8 ly',
  'Giấy bo trắng 0.8 ly',
  'Giấy bo kem 1.4 ly',
  'Giấy bo 2 ly',
]

export const giayBoTypeRates = {
  'Giấy bo màu 0.8 ly': 32771,
  'Giấy bo trắng 0.8 ly': 32771,
  'Giấy bo kem 1.4 ly': 72824,
  'Giấy bo 2 ly': 84962,
}