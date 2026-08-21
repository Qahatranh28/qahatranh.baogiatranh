import OptionSelect from './OptionSelect.jsx'
import LuxurySelect from './LuxurySelect.jsx';

export default function SimpleQuoteForm({
  selections, // 🌟 1. THÊM selections VÀO ĐÂY
  khungCategory,
  khungType, // Vẫn giữ nguyên phòng trường hợp các form khác truyền trực tiếp
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

  const handleSizeSelect = (selectedSize) => {
    onSizeChange(selectedSize);

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

  // 🌟 2. LẤY GIÁ TRỊ TỪ SELECTIONS NẾU CÓ, NẾU KHÔNG THÌ LẤY KHUNGTYPE
  const activeKhungType = selections?.khungType || khungType;

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
            value={activeKhungType} // 🌟 3. SỬ DỤNG BIẾN MỚI TẠO Ở TRÊN ĐỂ KHÔNG BỊ TRỐNG
            onChange={onKhungTypeChange}
            options={typeOptions}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="khungSize"
            className="block font-mono text-xs uppercase tracking-widest text-blueprint-light"
          >
            Kích thước
          </label>
          <button
            type="button"
            onClick={() => onToggleOddSize?.(!isOddSize)}
            className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-colors ${
              isOddSize
                ? 'bg-[#ff4f25] text-white shadow-sm font-bold'
                : 'border-line text-blueprint-light hover:border-amber hover:text-blueprint'
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
          <div className={selectWrapClass}>
            <LuxurySelect
              id="khungSize"
              value={sizeLabel}
              onChange={handleSizeSelect}
              options={sizeOptions.map((o) => o.label)}
            />
          </div>
        )}
      </div>

      {/* IN TRANH */}
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