import OptionSelect from './OptionSelect.jsx'

// Chế độ mặc định: dùng cho sản phẩm khung tranh tiêu chuẩn. Luồng chọn giờ
// chia làm 3 bước:
// 1) "Tên khung" — chọn nhóm/danh mục khung (ví dụ "Khung Composite").
// 2) "Loại khung" — chỉ hiển thị các loại khung THUỘC đúng nhóm vừa chọn ở
//    bước 1 (danh sách lọc theo categoryOptions/typeOptions truyền từ App).
// 3) "Kích thước" — chọn kích thước có sẵn. Ứng với mỗi (Loại khung + Kích
//    thước) admin đã gán sẵn 1 giá bán mặc định (xem data/khungCatalog.js +
//    Admin > Công cụ tính giá thành > "Giá bán mặc định – Khung tiêu chuẩn").
//    Khi cặp này đã có giá gán sẵn, hệ thống lấy đúng giá đó — không tính lại
//    theo công thức chiều dài/chiều rộng.
// Các sản phẩm bán lẻ khác loại (không phải khung tranh tiêu chuẩn) thì dùng
// nút "Custom" ở trên để báo giá chi tiết hơn — Custom vẫn tính theo kích
// thước x đơn giá khung như cũ.
export default function SimpleQuoteForm({
  khungCategory,
  khungType,
  sizeLabel,
  categoryOptions,
  typeOptions,
  sizeOptions,
  quantity,
  onKhungCategoryChange,
  onKhungTypeChange,
  onSizeChange,
  onQuantityChange,
}) {
  const selectWrapClass =
    'rounded-lg border-2 border-line focus-within:border-amber overflow-hidden bg-white transition-colors'

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="khungCategory"
          className="block font-mono text-xs uppercase tracking-widest text-blueprint-light mb-2"
        >
          Tên khung
        </label>
        <div className={selectWrapClass}>
          <OptionSelect
            id="khungCategory"
            value={khungCategory}
            onChange={onKhungCategoryChange}
            options={categoryOptions}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="khungType"
          className="block font-mono text-xs uppercase tracking-widest text-blueprint-light mb-2"
        >
          Loại khung
        </label>
        <div className={selectWrapClass}>
          <OptionSelect
            id="khungType"
            value={khungType}
            onChange={onKhungTypeChange}
            options={typeOptions}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="khungSize"
          className="block font-mono text-xs uppercase tracking-widest text-blueprint-light mb-2"
        >
          Kích thước
        </label>
        <div className={selectWrapClass}>
          <OptionSelect
            id="khungSize"
            value={sizeLabel}
            onChange={onSizeChange}
            options={sizeOptions.map((o) => o.label)}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="simpleQuantity"
          className="block font-mono text-xs uppercase tracking-widest text-blueprint-light mb-2"
        >
          Số lượng
        </label>
        <input
          id="simpleQuantity"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          className="w-full bg-white border-2 border-line focus:border-amber rounded-md py-2.5 px-3 outline-none transition-colors text-blueprint font-mono"
        />
      </div>
    </div>
  )
}
