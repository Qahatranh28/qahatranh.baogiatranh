// Dữ liệu "catalog" cho chế độ Khung tiêu chuẩn: đơn giá riêng theo từng loại
// khung, hệ số cộng thêm theo tên khung, danh sách kích thước mặc định, và
// ảnh minh hoạ lấy từ thư mục public/images. Admin có thể sửa/thêm trực tiếp
// trong file này.

// Đơn giá mặc định (VND / m dài khung) riêng theo từng LOẠI KHUNG — thay cho
// việc dùng chung 1 "Đơn giá khung" cho mọi loại như trước. Áp dụng cho cả
// chế độ Khung tiêu chuẩn lẫn Custom: nhập chiều dài/chiều rộng ở Custom sẽ
// tự nhân với đúng đơn giá mặc định của loại khung đang chọn ở đây.
// Nếu 1 loại khung chưa có trong danh sách, hệ thống dùng lại "Đơn giá khung"
// chung ở mục Admin > Công cụ tính giá thành.
import { 
  SIZE_GO_DO,
  SIZE_GO_TU_NHIEN,
  SIZE_FULL,
  SIZE_NHOM
 } from './frameSizes.js';
 // Import các bảng giá mẫu
import { 
  PRICE_COMPOSITE_MONG, 
  PRICE_GO, PRICE_GO_DO,
  PRICE_NHOM_VUONG_C1,
  PRICE_NHOM_VUONG_C2,
  PRICE_GO_TU_NHIEN_VINTAGE,
  PRICE_NHOM_TRON_C1,
  PRICE_NHOM_TRON_C2
} from './framePrices.js'
// giá cost của khung tính theo M
export const khungTypeRates = {
  'Khung nhựa 1,5x1,5': 5100,
  'Khung nhựa 2x3': 9900,
  'Khung gỗ tự nhiên 2x3': 15333,
  'Khung gỗ tự nhiên vintage 2x3': 35000,
  'Khung nhôm tròn': 28000,
  'Khung nhôm vuông 0,5x2,5': 28000,
  'Khung nhôm vuông Dày 0,5x3,5': 30000,
  'Khung gương': 148000,
}

export function getKhungTypeRate(khungType, fallbackRate) {
  const rate = khungTypeRates[khungType]
  return rate != null ? rate : fallbackRate
}

// Nhóm "Loại khung" theo "Tên khung" (danh mục) — dùng cho chế độ Khung tiêu
// chuẩn: chọn Tên khung (ví dụ "Khung Composite") trước, dropdown "Loại khung"
// ngay sau đó chỉ hiển thị các loại khung thuộc đúng nhóm này. Admin có thể
// sửa/thêm trực tiếp tại đây — nhớ thêm đơn giá tương ứng ở khungTypeRates
// phía trên nếu thêm loại khung mới.
export const khungCategoryOptions = [
  'Khung Composite',
  'Khung gỗ tự nhiên',
  'Khung nhôm',
  'Khung gương',
]

export const khungTypesByCategory = {
  'Khung Composite': ['đen mỏng', 'trắng mỏng', 'gỗ mỏng', 'đen dày', 'trắng dày', 'gỗ dày'],
  'Khung gỗ tự nhiên': [
    'Khung gỗ tự nhiên',
    'Khung gỗ màu vintage',
    'Khung gỗ đỏ',
  ],
  'Khung nhôm': ['Vàng vuông', 'Đen vuông','Bạc vuông','Vàng hồng vuông','Vàng tròn','Đen tròn','Bạc tròn','Vàng hồng tròn'],
}

export function getKhungTypesByCategory(category) {
  return khungTypesByCategory[category] || []
}

// Tra ngược: 1 Loại khung thuộc Tên khung (danh mục) nào — dùng để đồng bộ
// lại dropdown "Tên khung" khi chuyển từ chế độ Custom sang Khung tiêu chuẩn.
export function getCategoryForKhungType(khungType) {
  const found = Object.entries(khungTypesByCategory).find(([, types]) =>
    types.includes(khungType)
  )
  return found ? found[0] : null
}

// ==========================================
// CẤU HÌNH KÍCH THƯỚC LINH HOẠT
// ==========================================

// 1. Danh sách kích thước mặc định (đầy đủ)
export const defaultStandardSizeOptions = SIZE_FULL

// 2. Danh sách kích thước giới hạn cho riêng 1 loại khung (Ví dụ: Khung A)
// ==========================================
// CẤU HÌNH KÍCH THƯỚC LINH HOẠT TỪNG LOẠI KHUNG
// ==========================================

// Tạo một "Từ điển" chứa kích thước riêng cho từng loại khung cụ thể
export const customSizeMap = {
  // 1. Kích thước riêng cho Khung gỗ đỏ (2 size)
  'Khung gỗ đỏ': SIZE_GO_DO,
  'Khung gỗ tự nhiên': SIZE_GO_TU_NHIEN,
  'Khung gỗ màu vintage' :SIZE_GO_TU_NHIEN,
  'Vàng vuông':SIZE_NHOM,
  'Đen vuông':SIZE_NHOM,
  'Bạc vuông':SIZE_NHOM,
  'Vàng hồng vuông':SIZE_NHOM,
  'Vàng tròn':SIZE_NHOM,
  'Đen tròn':SIZE_NHOM,
  'Bạc tròn':SIZE_NHOM,
  'Vàng hồng tròn':SIZE_NHOM
  // 💡 MẸO CHO ADMIN:
  // Bạn muốn thêm khung nào có size đặc biệt, chỉ cần copy mẫu trên, 
  // gõ chính xác Tên Loại Khung vào trong nháy đơn và liệt kê size bên dưới!
};

// Hàm kiểm tra và trả về kích thước
export function getStandardSizeOptions(khungType) {
  return customSizeMap[khungType] || SIZE_FULL
}

// Khách đặt size lẻ (ví dụ 45x65cm) trong chế độ Custom — nếu kích thước còn
// nằm trong khổ tiêu chuẩn (không vượt quá 1m ở cạnh nào), hệ thống tự làm
// tròn LÊN kích thước tiêu chuẩn nhỏ nhất đủ lớn để chứa vừa (ví dụ 45x65cm
// -> 50x70cm) và lấy giá niêm yết của khổ đó — không tính theo công thức
// chiều dài/chiều rộng thực nhập. Trả về null nếu không tìm được khổ tiêu
// chuẩn nào đủ lớn (khi đó vẫn tính theo công thức Custom như cũ, ví dụ với
// size quá cỡ hơn 1m).
export function findNearestStandardSize(width, height, category = null) {
  const w = Number(width) || 0
  const h = Number(height) || 0
  if (w <= 0 || h <= 0) return null
  
  // Lấy đúng danh sách kích thước dựa trên loại khung đang xét
  const currentSizeOptions = getStandardSizeOptions(category)
  
  const candidates = currentSizeOptions.filter(
    (o) =>
      (o.width >= w && o.height >= h) || (o.width >= h && o.height >= w)
  )
  if (!candidates.length) return null
  candidates.sort((a, b) => a.width * a.height - b.width * b.height)
  return candidates[0]
}

// Giá bán mặc định (VND) gán riêng cho từng cặp (Loại khung + Kích thước) —
// dùng ở chế độ Khung tiêu chuẩn. Khi Loại khung + Kích thước đang chọn đã có
// giá gán sẵn ở đây, hệ thống lấy ĐÚNG giá này làm Đơn giá bán (không tính lại
// theo công thức chiều dài/chiều rộng nữa). Loại khung nào chưa có dòng giá
// tương ứng với 1 kích thước thì tạm tính theo công thức giá thành + % lợi
// nhuận như cũ. Admin sửa/thêm trực tiếp tại đây, hoặc chỉnh ngay trong màn
// Admin > Công cụ tính giá thành > "Giá bán mặc định – Khung tiêu chuẩn".
export const defaultStandardPrices = {
  'đen mỏng': PRICE_COMPOSITE_MONG,
  'trắng mỏng': PRICE_COMPOSITE_MONG,
  'gỗ mỏng': PRICE_COMPOSITE_MONG,
  'Khung gỗ tự nhiên': PRICE_GO,
    'Khung gỗ màu vintage': PRICE_GO_TU_NHIEN_VINTAGE,
  'Khung gỗ đỏ': PRICE_GO_DO,
'Vàng vuông':PRICE_NHOM_VUONG_C1,
  'Đen vuông':PRICE_NHOM_VUONG_C1,
  'Bạc vuông':PRICE_NHOM_VUONG_C2,
  'Vàng hồng vuông':PRICE_NHOM_VUONG_C2,
  'Vàng tròn':PRICE_NHOM_TRON_C1,
  'Đen tròn':PRICE_NHOM_TRON_C1,
  'Bạc tròn':PRICE_NHOM_TRON_C2,
  'Vàng hồng tròn':PRICE_NHOM_TRON_C2
}

// Lấy giá bán mặc định đã gán cho (Loại khung + Kích thước). Trả về null nếu
// chưa có giá gán sẵn (khi đó App sẽ tự tính theo công thức + % lợi nhuận).
export function getStandardPrice(prices, khungType, sizeLabel) {
  const value = prices?.[khungType]?.[sizeLabel]
  return value != null && value !== '' ? Number(value) : null
}

// Ảnh minh hoạ lấy từ thư mục public/images (đường dẫn bắt đầu bằng /images/
// sẽ tự map sang thư mục public/images trong project). Muốn dùng ảnh chụp
// thật, chỉ cần thay file .svg trong public/images bằng ảnh thật CÙNG TÊN
// FILE (có thể đổi đuôi .svg thành .jpg/.png rồi sửa lại đường dẫn bên dưới),
// không cần sửa phần code khác.
export const khungTypeImageMap = {
  'đen mỏng': '/images/composite-den-1.5.png',
  'trắng mỏng': '/images/composite-trang-1.5.png',
  'gỗ mỏng': '/images/composite-go-1.5.png',
  'Khung gỗ màu vintage': '/images/go-vintage.png',
  'Khung gỗ đỏ': '/images/go-do.png',
  'Vàng vuông': '/images/nhom-vang-vuong.png',
  'Đen vuông': '/images/nhom-den-v.png',
  'Bạc vuông': '/images/nhom-bac-v.png',
  'Vàng hồng': '/images/nhom-vang-hong-v.png',
  'Vàng tròn': '/images/nhom-vang-t.png',
  'Đen tròn': '/images/nhom-den-t.png',
  'Bạc tròn': '/images/nhom-bac-t.png',
  'Vàng hồng tròn': '/images/nhom-vang-hong-t.png',
'Khung gỗ tự nhiên':'/images/go-tu-nhien.png',

}

// Ảnh riêng cho từng cặp (Tên khung + Loại khung) cụ thể — để trống nghĩa là
// dùng ảnh chung theo Loại khung ở trên. Muốn có ảnh riêng cho 1 sản phẩm cụ
// thể, thêm 1 dòng vào đây theo mẫu, khoá là "Tên khung||Loại khung":
// 'Khung ảnh để bàn||Khung gỗ tự nhiên vintage 2x3': '/images/ban-go-vintage-2x3.jpg',
export const khungComboImageMap = {}

export const DEFAULT_KHUNG_IMAGE = '/images/placeholder.svg'

export function getKhungImage(khungName, khungType, sizeLabel = '') {
  // 1. KIỂM TRA ƯU TIÊN CHO CÁC LOẠI KHUNG ĐẶC BIỆT (Dựa vào sizeLabel)
  // Chuyển sizeLabel về chữ thường để đảm bảo lệnh includes nhận diện chính xác
  const sizeStr = String(sizeLabel).toLowerCase()

  if (khungType === 'Khung gỗ đỏ') {
    if (sizeStr.includes('16 ảnh')) return '/images/go-do-16.png'
    if (sizeStr.includes('9 ảnh')) return '/images/go-do.png'
    return '/images/go-do.png' // Ảnh mặc định cho Khung gỗ đỏ nếu size bình thường
  }

  // Bạn có thể nhân bản cụm if trên cho các màu khác (Khung gỗ đen, Khung gỗ trắng...)
  // if (khungType === 'Khung gỗ đen') { ... }


  // 2. LOGIC TÌM ẢNH BÌNH THƯỜNG (Giữ nguyên code cũ của bạn)
  if (khungName && khungType) {
    const comboKey = `${khungName}||${khungType}`
    if (khungComboImageMap[comboKey]) return khungComboImageMap[comboKey]
  }
  
  if (khungType && khungTypeImageMap[khungType]) {
    return khungTypeImageMap[khungType]
  }
  
  return DEFAULT_KHUNG_IMAGE
}