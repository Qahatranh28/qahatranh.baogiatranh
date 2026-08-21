import React, { useEffect } from 'react'
import { formatVND } from '../utils/format.js'
import LuxurySelect from './LuxurySelect.jsx' // 🌟 Đã import LuxurySelect vào đây!

const TIER_OPTIONS = [
  { id: 'basic', label: '1 mặt cơ bản' },
  { id: 'premium', label: '1 mặt cao cấp' },
]

const CATEGORY_OPTIONS = [
  { value: 'nhom', label: 'Khung Nhôm' },
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

  // Logic lọc khung theo Loại khung
  const filteredFrames = frameTypes.filter((f) => {
    // 1. Quét tìm category hợp lệ
    const cat = f.category || f.category_id || f.frame_category;
    const matchCat = cat === selectedCategory;
    
    // 2. Nhận diện các loại khung mỏng (dựa vào tên, slug chứa chữ "mỏng" hoặc "mong")
    const isThinFrame = f.name?.toLowerCase().includes('mỏng') 
                     || f.slug?.toLowerCase().includes('mong') 
                     || f.frame_type?.toLowerCase().includes('mong');

    // Chỉ lấy khung đúng danh mục VÀ tuyệt đối không được là khung mỏng
    return matchCat && !isThinFrame;
  })

  useEffect(() => {
    if (filteredFrames.length > 0) {
      const isExist = filteredFrames.find(f => f.frame_id === selectedFrameId)
      if (!isExist) {
        onFrameChange?.(filteredFrames[0].frame_id)
      }
    } else {
      onFrameChange?.('') 
    }
  }, [selectedCategory, frameTypes.length]) 

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* TÊN SẢN PHẨM */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1">
          Tên sản phẩm
        </label>
        <input
          type="text"
          id="productName_random" // Đặt ID lạ để tránh bị nhận diện
          name="productName_random" // Đặt Name lạ
          autoComplete="new-password" /* 🌟 TUYỆT CHIÊU TRỊ CHROME CỨNG ĐẦU */
          spellCheck="false" /* Tắt luôn gạch chân đỏ kiểm tra chính tả */
          value={productName || ''}
          onChange={(e) => onProductNameChange?.(e.target.value)}
          placeholder="Nhập tên sản phẩm (VD: Khung áo đấu Real Madrid...)"
          className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#ff4f25] focus:ring-4 focus:ring-[#ff4f25]/15 bg-white font-medium text-gray-800 shadow-sm transition-all"
        />
      </div>

      {/* LOẠI ÁO ĐẤU (Thanh trượt Segmented Control) */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1">
          Loại áo đấu
        </label>
        <div className="flex p-1.5 bg-gray-100 rounded-xl border border-gray-200/80 shadow-inner">
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

      {/* 🌟 SỬ DỤNG LUXURY SELECT CHO LOẠI KHUNG */}
      <LuxurySelect
        id="khungCategory"
        label="Loại khung"
        value={selectedCategory}
        onChange={onFrameCategoryChange}
        options={CATEGORY_OPTIONS}
      />

      {/* 🌟 SỬ DỤNG LUXURY SELECT CHO TÊN KHUNG */}
      <div>
        <div className="flex gap-4 items-start">
          <div className="flex-1">
            {filteredFrames.length > 0 ? (
              <LuxurySelect
                id="tenKhung"
                label="Tên khung"
                value={selectedFrameId}
                onChange={(val) => onFrameChange?.(Number(val) || val)}
                options={filteredFrames} // Tự động nhận frame_id và name
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1">Chiều rộng (cm)</label>
          <input
            type="number"
            value={width ?? ''}
            onChange={(e) => onWidthChange?.(e.target.value)}
            placeholder="Rộng"
            className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#ff4f25] focus:ring-4 focus:ring-[#ff4f25]/15 bg-white font-mono shadow-sm transition-all text-center"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1">Chiều dài (cm)</label>
          <input
            type="number"
            value={height ?? ''}
            onChange={(e) => onHeightChange?.(e.target.value)}
            placeholder="Dài"
            className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#ff4f25] focus:ring-4 focus:ring-[#ff4f25]/15 bg-white font-mono shadow-sm transition-all text-center"
          />
        </div>
      </div>

      {/* 🌟 SỬ DỤNG LUXURY SELECT CHO SIZE ÁO ĐẤU */}
      <div>
        <LuxurySelect
          id="sizeAoDau"
          label="Size áo đấu"
          value={selectedJerseySizeId}
          onChange={(val) => onJerseySizeChange?.(Number(val) || val)}
          options={jerseyPrices} // Tự động nhận id và sizeLabel
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

      {/* NÚT GẠT ĐÓNG GÓI CAO CẤP */}
      <div className="pt-6 border-t border-gray-200">
        <div
          onClick={() => onToggleChange?.('dongGoi', !toggles.dongGoi)}
          className={`relative flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300 group ${
            toggles.dongGoi
              ? 'bg-white border border-gray-200 shadow-sm' 
              : 'bg-[#ff4f25]/5 border border-[#ff4f25]/30 shadow-md hover:border-[#ff4f25]/50' 
          }`}
        >
          {!toggles.dongGoi && (
            <div className="absolute -top-3 left-4 px-2.5 py-0.5 bg-[#ff4f25] text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              Khuyên dùng
            </div>
          )}

          <div className="flex items-center gap-3.5">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors ${
              toggles.dongGoi ? 'bg-gray-100 text-gray-400' : 'bg-[#ff4f25]/10 text-[#ff4f25]'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
            </div>
            
            <div className="flex flex-col">
              <span className={`font-bold text-sm uppercase tracking-widest transition-colors ${
                toggles.dongGoi ? 'text-gray-800' : 'text-[#ff4f25]'
              }`}>
                Bao gồm đóng gói
              </span>
              <span className="text-xs text-gray-500 mt-0.5">
                {toggles.dongGoi 
                  ? 'Sản phẩm sẽ được bọc chống sốc an toàn tuyệt đối.' 
                  : 'Khách mua lẻ ưu tiên chọn đóng gói.'}
              </span>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={Boolean(toggles.dongGoi)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              toggles.dongGoi ? 'bg-[#ff4f25]' : 'bg-gray-300 group-hover:bg-gray-400'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                toggles.dongGoi ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}