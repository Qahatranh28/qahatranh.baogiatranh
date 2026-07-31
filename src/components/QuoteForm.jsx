import SimpleQuoteForm from './SimpleQuoteForm.jsx'
import CustomQuoteForm from './CustomQuoteForm.jsx'

// Mặc định hiển thị form "khung tiêu chuẩn" gọn (tên khung, loại khung,
// chiều dài, chiều rộng + hình minh hoạ). Khi có sản phẩm bán lẻ khác loại
// (không theo mẫu khung tranh thông thường), bấm nút "Custom" để mở form chi
// tiết đầy đủ các thành phần (khung, in tranh, mica/kính, ván, giấy bo, sắt
// xi, sơn...).
export default function QuoteForm({ mode, onModeChange, ...formProps }) {
  return (
    <section
      aria-labelledby="form-heading"
      className="bg-paper rounded-2xl border border-line shadow-sm p-6 sm:p-8"
    >
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h2
            id="form-heading"
            className="font-display font-semibold text-xl text-blueprint"
          >
            Thêm sản phẩm
          </h2>
          <p className="text-sm text-blueprint-light mt-1">
            {mode === 'custom'
              ? 'Khai báo chi tiết cho sản phẩm bán lẻ khác loại.'
              : 'Chọn tên khung, loại khung và nhập kích thước.'}
          </p>
        </div>

        <div className="shrink-0 flex rounded-full border border-line bg-white p-1">
          <button
            type="button"
            onClick={() => onModeChange('simple')}
            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest transition-colors ${
              mode === 'simple'
                ? 'bg-orange-500 text-white' // Khi đang ở trang Báo giá: Nền cam, chữ trắng
                : 'text-gray-600 hover:bg-orange-50 hover:text-orange-500' // Khi ở trang khác: Di chuột vào sẽ sáng màu cam
            }`}
          >
            Khung tiêu chuẩn
          </button>
          <button
            type="button"
            onClick={() => onModeChange('custom')}
            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest transition-colors ${
              mode === 'custom'
                ? 'bg-amber text-blueprint'
                : 'text-blueprint-light hover:text-blueprint'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      <div className="mt-6">
        {mode === 'custom' ? (
          <CustomQuoteForm {...formProps} />
        ) : (
          <SimpleQuoteForm {...formProps} />
        )}
      </div>
    </section>
  )
}
