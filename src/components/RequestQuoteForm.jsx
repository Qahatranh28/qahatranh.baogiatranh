import React from 'react'

export default function RequestQuoteForm({
  width, height, onWidthChange, onHeightChange,
  // ... các props
}) {
  return (
    <div className="animate-fade-in">
       {/* 1. Hiển thị ô nhập Rộng / Dài bình thường 
          2. Hiển thị phần chọn vật tư
          3. Thêm vùng TextArea để ghi chú (Yêu cầu đặc biệt của khách)
       */}
       <div className="mb-4">
         <label className="block text-sm font-semibold text-blueprint mb-2">Yêu cầu đặc biệt</label>
         <textarea 
           rows="3" 
           className="w-full border border-line rounded px-3 py-2 focus:border-amber outline-none"
           placeholder="Nhập ghi chú hoặc yêu cầu kết cấu đặc biệt của khách..."
         />
       </div>
    </div>
  )
}