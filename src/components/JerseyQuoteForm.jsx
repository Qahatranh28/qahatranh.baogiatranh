import React, { useEffect } from 'react'
import { formatVND } from '../utils/format.js'
import LuxurySelect from './LuxurySelect.jsx'

const TIER_OPTIONS = [
  { id: 'basic', label: '1 mặt cơ bản' },
  { id: 'premium', label: '1 mặt cao cấp' },
  { id: '2_faces_premium', label: '2 mặt cao cấp' },
]

const CATEGORY_OPTIONS = [
  { value: 'nhom', label: 'Khung Nhôm' },
  { value: 'nhom_day', label: 'Khung Nhôm Dày 3,5' },
  { value: 'composite_2x3', label: 'Khung Composite 2x3' }
]

export default function JerseyQuoteForm({
  productName,
  onProductNameChange,
  tier,
  onTierChange,
  frameTypes = [],
  selectedCategory,
  onFrameCategoryChange,
  selectedFrameId,
  onFrameChange,
  selectedFrame,
  width,
  height,
  onWidthChange,
  onHeightChange,
  jerseyPrices = [],
  selectedJerseySizeId,
  onJerseySizeChange,
  selectedJerseySize,
  quantity,
  onQuantityChange,
  toggles = {},
  onToggleChange,
  unitPrice,
}) {
  const frameImageUrl = selectedFrame?.image_url || '/images/placeholder.svg'

  // 🌟 Tự động chuyển loại khung về "nhom_day" khi chọn "2 mặt cao cấp"
  useEffect(() => {
    if (tier === '2_faces_premium' && onFrameCategoryChange) {
      onFrameCategoryChange('nhom_day')
    }
  }, [tier, onFrameCategoryChange])

  // 🌟 Logic lọc khung chuẩn hóa (so sánh an toàn giữa các trường category trong DB)
  const filteredFrames = frameTypes.filter((f) => {
    const rawCat = f.category || f.category_id || f.frame_category || '';
    const cat = String(rawCat).trim().toLowerCase();
    const targetCat = String(selectedCategory || '').trim().toLowerCase();
    
    const matchCat = cat === targetCat;
    
    // Tạm thời cho phép hiện toàn bộ khung thuộc danh mục, bỏ qua bộ lọc khung mỏng nếu gây kẹt
    return matchCat;
  })

  useEffect(() => {
    if (filteredFrames.length > 0) {
      const isExist = filteredFrames.find(f => String(f.frame_id) === String(selectedFrameId))
      if (!isExist) {
        onFrameChange?.(filteredFrames[0].frame_id)
      }
    } else {
      onFrameChange?.('') 
    }
  }, [selectedCategory, frameTypes, selectedFrameId, onFrameChange]) 

  // ========================================================
  // 🌟 TÍNH TOÁN GIỚI HẠN KÍCH THƯỚC ÁO ĐẤU THEO PHÂN LOẠI
  // ========================================================
  const w = Number(width || 0);
  const h = Number(height || 0);
  const minEdge = Math.min(w, h);
  const maxEdge = Math.max(w, h);

  // Mặc định cho "1 mặt cơ bản"
  let maxShortEdge = 90;
  let maxLongEdge = 100;

  // Nếu là cao cấp thì bóp giới hạn lại
  const isPremium = tier === 'premium' || tier === '2_faces_premium';
  if (isPremium) {
    maxShortEdge = 70;
    maxLongEdge = 90;
  }

  // Kiểm tra xem có đang bị vượt quá khổ không (chỉ kiểm tra khi user đã nhập số > 0)
  const isOversized = (w > 0 || h > 0) && (minEdge > maxShortEdge || maxEdge > maxLongEdge);
  // ========================================================

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* TÊN SẢN PHẨM */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1">
          Tên sản phẩm
        </label>
        <input
          type="text"
          id="productName_random"
          name="productName_random"
          autoComplete="new-password"
          spellCheck="false"
          value={productName || ''}
          onChange={(e) => onProductNameChange?.(e.target.value)}
          placeholder="Nhập tên sản phẩm (VD: Khung áo đấu Real Madrid...)"
          className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#ff4f25] focus:ring-4 focus:ring-[#ff4f25]/15 bg-white font-medium text-gray-800 shadow-sm transition-all"
        />
      </div>

      {/* LOẠI ÁO ĐẤU (Thanh trượt Segmented Control - 3 nút) */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1">
          Loại áo đấu
        </label>
        <div className="flex p-1.5 bg-gray-100 rounded-xl border border-gray-200/80 shadow-inner gap-1">
          {TIER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onTierChange?.(opt.id)}
              className={`flex-1 py-3 px-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ease-out ${
                tier === opt.id
                  ? 'bg-[#ff4f25] text-white shadow-md shadow-[#ff4f25]/30 scale-100'
                  : 'text-gray-500 bg-transparent hover:text-gray-900 hover:bg-gray-200/50 scale-95'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* LOẠI KHUNG: Nếu chọn 2 mặt cao cấp thì khóa cứng Khung Nhôm Dày, các tier khác hiển thị đủ 3 loại */}
      <LuxurySelect
        id="khungCategory"
        label="Loại khung"
        value={selectedCategory}
        onChange={onFrameCategoryChange}
        options={
          tier === '2_faces_premium'
            ? [{ value: 'nhom_day', label: 'Khung Nhôm Dày 3,5' }]
            : CATEGORY_OPTIONS
        }
      />

      {/* TÊN KHUNG */}
      <div>
        <div className="flex gap-4 items-start">
          <div className="flex-1">
            {filteredFrames.length > 0 ? (
              <LuxurySelect
                id="tenKhung"
                label="Tên khung"
                value={selectedFrameId}
                onChange={(val) => onFrameChange?.(Number(val) || val)}
                options={filteredFrames} 
              />
            ) : (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1">Tên khung</label>
                <p className="text-xs text-[#ff4f25] bg-[#ff4f25]/10 border border-[#ff4f25]/30 rounded-xl px-4 py-3.5 font-medium">
                  Chưa có khung nào thuộc danh mục này trong Database.
                </p>
              </div>
            )}
          </div>

          {selectedFrame && (
            <div className="shrink-0 flex h-[72px] w-[72px] mt-[26px] items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
              <img
                src={frameImageUrl}
                alt={selectedFrame.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = '/images/placeholder.svg'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* KÍCH THƯỚC */}
      <div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1">Chiều rộng (cm)</label>
            <input
              type="number"
              value={width ?? ''}
              onChange={(e) => onWidthChange?.(e.target.value)}
              placeholder="Rộng"
              className={`w-full border rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-4 bg-white font-mono shadow-sm transition-all text-center ${
                isOversized 
                  ? 'border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500/15' 
                  : 'border-gray-200 focus:border-[#ff4f25] focus:ring-[#ff4f25]/15'
              }`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1">Chiều dài (cm)</label>
            <input
              type="number"
              value={height ?? ''}
              onChange={(e) => onHeightChange?.(e.target.value)}
              placeholder="Dài"
              className={`w-full border rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-4 bg-white font-mono shadow-sm transition-all text-center ${
                isOversized 
                  ? 'border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500/15' 
                  : 'border-gray-200 focus:border-[#ff4f25] focus:ring-[#ff4f25]/15'
              }`}
            />
          </div>
        </div>
        
        {/* HIỂN THỊ CẢNH BÁO QUÁ KHỔ */}
        {isOversized && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500 shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            <p className="text-[11.5px] text-red-600 font-medium leading-relaxed">
              Kích thước vượt quá giới hạn sản xuất của phân loại <strong>"{TIER_OPTIONS.find(t => t.id === tier)?.label}"</strong>. 
              Kích thước tối đa cho phép là <strong>{maxShortEdge}x{maxLongEdge} cm</strong>. Vui lòng nhập lại!
            </p>
          </div>
        )}
      </div>

      {/* SIZE ÁO ĐẤU */}
      <div>
        <LuxurySelect
          id="sizeAoDau"
          label="Size áo đấu"
          value={selectedJerseySizeId}
          onChange={(val) => onJerseySizeChange?.(Number(val) || val)}
          options={jerseyPrices} 
        />
      </div>

      {/* SỐ LƯỢNG */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1">
          Số lượng
        </label>
        <input
          type="number"
          min="1"
          value={quantity || '1'}
          onChange={(e) => onQuantityChange?.(e.target.value)}
          className="w-32 border border-gray-200 rounded-xl px-4 py-3.5 text-base outline-none focus:border-[#ff4f25] focus:ring-4 focus:ring-[#ff4f25]/15 bg-white font-mono font-bold text-gray-800 shadow-sm transition-all text-center"
        />
      </div>
    </div>
  )
}