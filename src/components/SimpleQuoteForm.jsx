import { useState, useEffect } from 'react';
import OptionSelect from './OptionSelect.jsx';
import LuxurySelect from './LuxurySelect.jsx';

export default function SimpleQuoteForm({
  selections,
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
  onWidthChange,
  onHeightChange,
  isOddSize,
  oddWidth,
  oddHeight,
  oddSizeMatchLabel,
  onToggleOddSize,
  onOddWidthChange,
  onOddHeightChange,
  tranhInOn = true,
  onToggleTranhIn,
}) {
  const selectWrapClass =
    'w-full border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber bg-white font-medium text-blueprint shadow-sm'

  // Trạng thái mở/tắt bảng lưới chọn size dạng Popover
  const [isSizeOpen, setIsSizeOpen] = useState(false);

  const handleSizeSelect = (selectedSize) => {
    onSizeChange(selectedSize);
    setIsSizeOpen(false); // Chọn xong tự động đóng danh sách lại

    if (selectedSize) {
      const nums = selectedSize.match(/\d+/g);
      if (nums && nums.length >= 2) {
        if (onWidthChange) onWidthChange(Number(nums[0]));
        if (onHeightChange) onHeightChange(Number(nums[1]));
      }
    } else {
      if (onWidthChange) onWidthChange(0);
      if (onHeightChange) onHeightChange(0);
    }
  };

  const activeKhungType = selections?.khungType || khungType;

  // 1. NHẬN DIỆN CÁC LOẠI KHUNG ĐẶC BIỆT
  const isKhungKhan = typeof khungCategory === 'string' && khungCategory.toLowerCase().includes('khăn');
  const isKhungGoDo = typeof activeKhungType === 'string' && activeKhungType.toLowerCase().includes('gỗ đỏ');

  // 2. TỰ ĐỘNG BẬT "IN TRANH" KHI CHỌN GỖ ĐỎ (Nếu nó đang tắt)
  useEffect(() => {
    if (isKhungGoDo && !tranhInOn && typeof onToggleTranhIn === 'function') {
      onToggleTranhIn(true);
    }
  }, [isKhungGoDo, tranhInOn, onToggleTranhIn]);

  // 3. ĐIỀU KIỆN ẨN CÔNG TẮC: Khung Khăn HOẶC Khung Gỗ Đỏ
  const hideTranhInToggle = isKhungKhan || isKhungGoDo;

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="khungCategory"
          className="block font-mono text-xs uppercase tracking-widest text-blueprint-light mb-2"
        >
          Loại khung
        </label>
        <div className={selectWrapClass}>
          <LuxurySelect
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
          Tên khung
        </label>
        <div className={selectWrapClass}>
          <LuxurySelect
            id="khungType"
            value={activeKhungType}
            onChange={onKhungTypeChange}
            options={typeOptions}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            className="block font-mono text-xs uppercase tracking-widest text-blueprint-light"
          >
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
                className="w-full border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber bg-white font-mono text-blueprint shadow-sm"
              />
              <input
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="Cao (cm)"
                value={oddHeight}
                onChange={(e) => onOddHeightChange?.(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber bg-white font-mono text-blueprint shadow-sm"
              />
            </div>
            {oddWidth > 0 && oddHeight > 0 && (
              Number(oddWidth) > 100 || Number(oddHeight) > 100 ? (
                <p className="text-xs text-amber mt-2">
                  Chiều dài hoặc chiều rộng vượt 100cm — hệ thống sẽ tự chuyển sang tab "Custom".
                </p>
              ) : oddSizeMatchLabel ? (
                <p className="text-xs text-blueprint-light mt-2">
                  Áp giá theo size chuẩn: <span className="font-medium text-blueprint">{oddSizeMatchLabel}</span>
                </p>
              ) : (
                <p className="text-xs text-blueprint-light mt-2">
                  Chưa có size chuẩn nào phù hợp — vui lòng kiểm tra lại bảng giá size chuẩn.
                </p>
              )
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Nút bấm hiển thị size đang chọn để mở/đóng danh sách */}
            <button
              type="button"
              onClick={() => setIsSizeOpen(!isSizeOpen)}
              className={`${selectWrapClass} flex items-center justify-between text-left cursor-pointer`}
            >
              <span className="font-bold text-blueprint">{sizeLabel || 'Chọn kích thước'}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isSizeOpen ? 'rotate-180' : ''}`}
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Bảng danh sách kích thước dạng lưới 3 cột, rộng rãi để thấy đầy đủ chữ */}
            {/* Bảng danh sách kích thước dạng lưới 3 cột, sắp xếp tăng dần */}
            {isSizeOpen && (
              <div className="absolute z-30 mt-1.5 w-full min-w-[320px] bg-white border border-line rounded-xl shadow-xl p-3 max-h-72 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2">
                  {[...sizeOptions]
                    .sort((a, b) => {
                      const strA = typeof a === 'object' ? (a.label || a.name || '') : String(a);
                      const strB = typeof b === 'object' ? (b.label || b.name || '') : String(b);
                      const numsA = strA.match(/\d+/g)?.map(Number) || [0, 0];
                      const numsB = strB.match(/\d+/g)?.map(Number) || [0, 0];
                      // Tính diện tích tương đối để sắp xếp tăng dần
                      const areaA = (numsA[0] || 0) * (numsA[1] || numsA[0] || 0);
                      const areaB = (numsB[0] || 0) * (numsB[1] || numsB[0] || 0);
                      return areaA - areaB;
                    })
                    .map((o) => {
                      const lbl = typeof o === 'object' ? (o.label || o.name || o) : o;
                      const isSelected = lbl === sizeLabel;
                      return (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => handleSizeSelect(lbl)}
                          className={`px-3 py-2 text-xs font-mono font-bold rounded-lg border text-center transition-all ${
                            isSelected
                              ? 'bg-[#ff4f25] text-white border-transparent shadow-sm'
                              : 'bg-gray-50/80 text-blueprint border-line hover:border-[#ff4f25] hover:bg-orange-50/30'
                          }`}
                        >
                          {lbl}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. GẮN ĐIỀU KIỆN ẨN VÀO KHỐI NÀY */}
      {!hideTranhInToggle && (
        <div
          className="flex items-center justify-between p-3 rounded-lg border border-line bg-white shadow-sm cursor-pointer group transition-colors hover:bg-paper"
          onClick={() => onToggleTranhIn?.(!tranhInOn)}
        >
          <div>
            <span className="font-bold text-xs uppercase tracking-widest text-blueprint group-hover:text-[#ff4f25]/80 transition-colors select-none">
              In tranh
            </span>
            <p className="text-[11px] text-blueprint-light mt-0.5">
              {tranhInOn ? 'Vật tư: tranh in 5 ly mờ' : 'Vật tư: ván lót 4 ly'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(tranhInOn)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              tranhInOn ? 'bg-[#ff4f25]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                tranhInOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}

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