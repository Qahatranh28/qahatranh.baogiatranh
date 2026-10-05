// Giá trị mặc định khi chưa có gì trong bảng quote2_settings.

export const DEFAULT_MIN_MARGIN = 40
export const DEFAULT_TAX_RATE = 8
export const TAX_OPTIONS = [
  { value: 0, label: 'Không VAT' },
  { value: 8, label: 'VAT – 8%' },
  { value: 10, label: 'VAT – 10%' },
]

export const STATUS = {
  pending: { label: 'Chờ duyệt', short: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-800' },
  won: { label: 'Đã chốt (Win)', short: 'Đã chốt', cls: 'bg-emerald-100 text-emerald-700' },
  lost: { label: 'Thất bại (Loss)', short: 'Thất bại', cls: 'bg-red-100 text-red-700' },
}

export const LOST_REASONS = [
  'Giá cao',
  'Không hợp mẫu / chất liệu',
  'Khách không phản hồi',
  'Chọn đối thủ',
  'Khách hoãn / huỷ nhu cầu',
]

// Mẫu theo bản thiết kế của Qaha Tranh. Mọi trường đều sửa được ở nút "Thông tin công ty".
export const DEFAULT_COMPANY = {
  logoUrl: '/images/logoCompany.png',
  name: 'CÔNG TY TNHH QUANG HÀ TRANH',
  description: 'Tiên phong Khung khăn lụa HERMÈS & Giải pháp nghệ thuật cho không gian',
  // mỗi dòng = 1 gạch đầu dòng (chấm cam) dưới phần mô tả
  highlights: [
    'Chế tác thủ công tỉ mỉ, hoàn thiện tinh xảo.',
    'Trọn gói từ lên layout, in ấn, đóng khung đến lắp đặt.',
    'Đồng hành cùng nhà ở, villa, khách sạn, resort & các công trình mang dấu ấn riêng.',
  ].join('\n'),
  website: 'qahatranh.com',
  address: '14 đường D6, KDC Nam Long, P. Phước Long, TP.Hồ Chí Minh, Việt Nam',
  hotline: '076 4844 258',
  docTitle: 'BÁO GIÁ',
  brandName: 'QAHATRANH',
  bankName: '',
  bankAccount: '',
  bankHolder: '',
  qrUrl: '', // ảnh mã QR thanh toán (tải lên)
}

// Cú pháp điều khoản: "- " = mục chính, "-- " = mục con, **chữ** = in đậm.
// Người dùng không cần gõ cú pháp: trình chỉnh sửa có sẵn nút B / Mục chính / Mục con.
export const DEFAULT_TERMS = {
  title: 'Điều khoản báo giá',
  body: [
    '- **Hiệu lực báo giá:** 14 ngày.',
    '- **Giá cả:** Đã bao gồm VAT 8%.',
    '- **Cam kết sản phẩm: 100% Chính hãng & Nhập khẩu** (Khung tranh cao cấp; Mực In Canon chuẩn màu, bền màu 10 năm).',
    '- **Bảo hành: 12 tháng** (Đặc quyền 1 đổi 1 trong vòng 7 ngày đối với sản phẩm lỗi).',
    '- **Thời gian giao hàng: 5 - 7 ngày** tùy số lượng (Hỗ trợ giao gấp theo yêu cầu riêng của khách hàng).',
    '- **Tiến độ thanh toán:**',
    '-- **Đợt 1:** Tạm ứng 50% ngay khi ký hợp đồng.',
    '-- **Đợt 2:** Thanh toán 50% khi bàn giao tại showroom Qahatranh (Khách được duyệt trước ảnh/video thực tế sản phẩm trước khi giao tận nơi).',
  ].join('\n'),
}
