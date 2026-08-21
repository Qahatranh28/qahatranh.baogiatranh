import React from 'react'

export default function ProductNameCombobox({ value, onChange }) {
  // Đã xóa bỏ toàn bộ logic useState, useMemo và list <ul> xổ xuống
  
  return (
    <input
      id="productName"
      type="text"
      autoComplete="off"
      spellCheck="false"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Nhập tên sản phẩm..."
      className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#ff4f25] focus:ring-4 focus:ring-[#ff4f25]/15 bg-white font-medium text-gray-800 shadow-sm transition-all"
    />
  )
}