// Một dòng "Nhãn — giá trị" giống cấu trúc bảng trong file mẫu (cột B / cột C).
// Dùng cho các dòng chọn Có/Không, chọn loại vật tư, hoặc hiển thị giá trị
// tính toán (readOnly).
export default function FormRow({ label, children, highlight, readOnly }) {
  return (
    <div className="flex items-stretch border-b border-line last:border-b-0">
      <div className="w-[46%] shrink-0 flex items-center px-3 py-2 text-sm text-blueprint font-medium bg-paper/60">
        {label}
      </div>
      <div
        className={`flex-1 min-w-0 flex items-center ${
          highlight
            ? 'bg-orange-500'
            : readOnly
            ? 'bg-paper/40'
            : 'bg-white'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
