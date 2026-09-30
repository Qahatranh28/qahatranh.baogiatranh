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

export const DEFAULT_COMPANY = {
  logoUrl: '/images/logoCompany.png',
  name: 'QAHA TRANH',
  tagline: 'Custom Framing Studio',
  address: '',
  phone: '',
  email: '',
  website: '',
  taxCode: '',
  bankName: '',
  bankAccount: '',
  bankHolder: '',
}

// Cố ý để trống: điều khoản là nội dung pháp lý/thương mại của công ty, do quản lý tự nhập
// bằng nút "✎ Điều khoản" trong bản xem trước.
export const DEFAULT_TERMS = {
  title: 'Điều khoản & điều kiện',
  body: '',
}

export const TERMS_PLACEHOLDER = [
  'VD: Báo giá có hiệu lực trong … ngày kể từ ngày lập.',
  'VD: Đặt cọc …% giá trị đơn hàng trước khi sản xuất.',
  'VD: Thời gian sản xuất dự kiến … ngày làm việc.',
].join('\n')
