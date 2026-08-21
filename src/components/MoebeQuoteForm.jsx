import React from 'react'
import LuxurySelect from './LuxurySelect.jsx';

export default function MoebeQuoteForm({
  productName,
  onProductNameChange,
  frameTypes = [],
  selectedFrameId,
  onFrameChange,
  sizeOptions = [],
  selectedSizeId,
  onSizeChange,
  selectedSize,
  printWidth,
  printHeight,
  onPrintWidthChange,
  onPrintHeightChange,
  tranhInLabel = 'Tranh in giấy mỹ thuật',
  quantity,
  onQuantityChange,
  toggles = {},
  onToggleChange,
  // 🌟 Size lẻ
  isOddSize,
  oddWidth,
  oddHeight,
  oddSizeMatch,
  onToggleOddSize,
  onOddWidthChange,
  onOddHeightChange,
}) {
  const selectedFrame = frameTypes.find((f) => String(f.frame_id) === String(selectedFrameId)) || frameTypes[0] || null
  const frameImageUrl = selectedFrame?.image_url || '/images/placeholder.svg'

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* TÊN SẢN PHẨM */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1">
          Tên sản phẩm
        </label>
        <input
          type="text"
          value={productName || ''}
          onChange={(e) => onProductNameChange?.(e.target.value)}
          placeholder="Nhập tên sản phẩm (VD: Khung Moebe nhôm...)"
          className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#ff4f25] focus:ring-4 focus:ring-[#ff4f25]/15 bg-white font-medium text-gray-800 shadow-sm transition-all"
        />
      </div>

      {/* TÊN KHUNG (Sử dụng LuxurySelect) */}
      <LuxurySelect
        id="tenKhung"
        label="Tên khung"
        value={selectedFrameId}
        onChange={(val) => onFrameChange?.(Number(val) || val)}
        options={frameTypes} 
      />

      {/* KÍCH THƯỚC (Sử dụng LuxurySelect, hoặc nhập Size lẻ) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 pl-1">
            Kích thước
          </label>
          <button
            type="button"
            onClick={() => onToggleOddSize?.(!isOddSize)}
            className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-colors ${
              isOddSize
                ? 'bg-[#ff4f25] text-white shadow-sm font-bold border-transparent'
                : 'border-gray-200 text-gray-500 hover:border-[#ff4f25] hover:text-gray-800'
            }`}
          >
            {isOddSize ? '✕ Size lẻ' : 'Size lẻ'}
          </button>
        </div>

        {isOddSize ? (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="Rộng (cm)"
                value={oddWidth}
                onChange={(e) => onOddWidthChange?.(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#ff4f25] focus:ring-4 focus:ring-[#ff4f25]/15 bg-white font-mono text-center shadow-sm transition-all"
              />
              <input
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="Cao (cm)"
                value={oddHeight}
                onChange={(e) => onOddHeightChange?.(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#ff4f25] focus:ring-4 focus:ring-[#ff4f25]/15 bg-white font-mono text-center shadow-sm transition-all"
              />
            </div>
            {oddWidth > 0 && oddHeight > 0 && (
              oddSizeMatch ? (
                <p className="text-xs text-gray-500 mt-2">
                  Áp giá theo size chuẩn: <span className="font-medium text-gray-800">{oddSizeMatch.label}</span>
                </p>
              ) : (
                <p className="text-xs text-amber-600 mt-2">
                  Chưa có size chuẩn nào của khung này đủ lớn — tạm tính theo giá vốn + markup.
                </p>
              )
            )}
          </div>
        ) : (
          <>
            <LuxurySelect
              id="kichThuoc"
              value={selectedSizeId}
              onChange={(val) => onSizeChange?.(val)}
              options={sizeOptions}
            />

            {/* Khối hiển thị thông số Phủ bì / Ruột được thiết kế lại đẹp hơn */}
            {selectedSize && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono text-gray-600 shadow-inner">
                Phủ bì: <span className="font-bold text-gray-800">{selectedSize.width} × {selectedSize.height} cm</span>
                <br className="sm:hidden" />
                <span className="hidden sm:inline"> · </span>
                Ruột: <span className="font-bold text-gray-800">{selectedSize.innerWidth} × {selectedSize.innerHeight} cm</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* TRANH IN */}
      <div className="p-1 bg-white rounded-xl border border-gray-200 shadow-sm space-y-2">
        <div 
          className="flex items-center justify-between p-3 rounded-lg cursor-pointer group transition-colors hover:bg-gray-50"
          onClick={() => onToggleChange?.('tranhIn', !toggles.tranhIn)}
        >
          <span className="font-bold text-xs uppercase tracking-widest text-gray-800 group-hover:text-[#ff4f25] transition-colors select-none">
            Khách thêm in tranh
          </span>
          
          {/* Nút Toggle chuẩn iOS */}
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(toggles.tranhIn)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              toggles.tranhIn ? 'bg-[#ff4f25]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                toggles.tranhIn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        
        {toggles.tranhIn && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            {selectedSize && (
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#ff4f25] mb-3">
                Tối đa theo khung: {selectedSize.width} × {selectedSize.height} cm
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1">
                  Rộng tranh in (cm)
                </label>
                <input
                  type="number"
                  value={printWidth ?? ''}
                  max={selectedSize?.width || undefined}
                  onChange={(e) => onPrintWidthChange?.(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#ff4f25] focus:ring-4 focus:ring-[#ff4f25]/15 font-mono text-center shadow-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1">
                  Dài tranh in (cm)
                </label>
                <input
                  type="number"
                  value={printHeight ?? ''}
                  max={selectedSize?.height || undefined}
                  onChange={(e) => onPrintHeightChange?.(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#ff4f25] focus:ring-4 focus:ring-[#ff4f25]/15 font-mono text-center shadow-sm transition-all"
                />
              </div>
            </div>
          </div>
        )}
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

      {/* ĐÓNG GÓI CAO CẤP */}
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
                  : 'Khách hàng mua lẻ sản phẩm ưu tiên chọn đóng gói.'}
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