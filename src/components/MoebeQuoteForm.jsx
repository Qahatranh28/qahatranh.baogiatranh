import React, { useState } from 'react'
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

  // Trạng thái mở/tảng bảng lưới chọn size dạng Popover cho Moebe
  const [isSizeOpen, setIsSizeOpen] = useState(false);

  const handleSizeSelect = (sizeId) => {
    onSizeChange?.(sizeId);
    setIsSizeOpen(false); // Chọn xong tự động đóng danh sách lại
  };

  // Tìm label của size đang chọn để hiển thị lên nút bấm
  const currentSizeObj = sizeOptions.find((o) => String(o.id ?? o.value ?? o) === String(selectedSizeId));
  const currentSizeLabel = currentSizeObj ? (currentSizeObj.label || currentSizeObj.name || currentSizeObj) : 'Chọn kích thước';

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

      {/* KÍCH THƯỚC (Dạng Grid Popover 3 cột, sắp xếp tăng dần, hoặc nhập Size lẻ) */}
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
                ? 'border-line text-blueprint-light hover:border-amber hover:text-blueprint bg-white text-blueprint'
                : 'bg-[#ff4f25] text-white shadow-sm font-bold border-transparent'
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
          <div className="relative">
            {/* Nút bấm hiển thị size đang chọn để bật/đóng danh sách */}
            <button
              type="button"
              onClick={() => setIsSizeOpen(!isSizeOpen)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm bg-white font-medium text-gray-800 shadow-sm flex items-center justify-between text-left cursor-pointer hover:border-[#ff4f25] transition-all"
            >
              <span className="font-bold text-gray-800">{currentSizeLabel}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isSizeOpen ? 'rotate-180' : ''}`}
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Bảng danh sách kích thước dạng lưới 3 cột, sắp xếp tăng dần */}
            {isSizeOpen && (
              <div className="absolute z-30 mt-1.5 w-full min-w-[320px] bg-white border border-gray-200 rounded-xl shadow-2xl p-3 max-h-72 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2">
                  {[...sizeOptions]
                    .sort((a, b) => {
                      const strA = typeof a === 'object' ? (a.label || a.name || '') : String(a);
                      const strB = typeof b === 'object' ? (b.label || b.name || '') : String(b);
                      const numsA = strA.match(/\d+/g)?.map(Number) || [0, 0];
                      const numsB = strB.match(/\d+/g)?.map(Number) || [0, 0];
                      const areaA = (numsA[0] || 0) * (numsA[1] || numsA[0] || 0);
                      const areaB = (numsB[0] || 0) * (numsB[1] || numsB[0] || 0);
                      return areaA - areaB;
                    })
                    .map((o) => {
                      const id = o.id ?? o.value ?? o;
                      const lbl = typeof o === 'object' ? (o.label || o.name || o) : o;
                      const isSelected = String(id) === String(selectedSizeId);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleSizeSelect(id)}
                          className={`px-3 py-2 text-xs font-mono font-bold rounded-lg border text-center transition-all ${
                            isSelected
                              ? 'bg-[#ff4f25] text-white border-transparent shadow-sm'
                              : 'bg-gray-50/80 text-gray-700 border-gray-200 hover:border-[#ff4f25] hover:bg-orange-50/30'
                          }`}
                        >
                          {lbl}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Khối hiển thị thông số Phủ bì / Ruột */}
            {selectedSize && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono text-gray-600 shadow-inner">
                Phủ bì: <span className="font-bold text-gray-800">{selectedSize.width} × {selectedSize.height} cm</span>
                <br className="sm:hidden" />
                <span className="hidden sm:inline"> · </span>
                Ruột: <span className="font-bold text-gray-800">{selectedSize.innerWidth} × {selectedSize.innerHeight} cm</span>
              </div>
            )}
          </div>
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
    </div>
  )
}