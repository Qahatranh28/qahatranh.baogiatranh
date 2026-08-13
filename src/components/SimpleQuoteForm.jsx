import OptionSelect from './OptionSelect.jsx'

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
  onWidthChange,   // 👈 Thêm props cập nhật chiều rộng từ cha (nếu có)
  onHeightChange,  // 👈 Thêm props cập nhật chiều dài từ cha (nếu có)
  // 🌟 Size lẻ
  isOddSize,
  oddWidth,
  oddHeight,
  oddSizeMatchLabel,
  onToggleOddSize,
  onOddWidthChange,
  onOddHeightChange,
}) {
  const selectWrapClass =
    'w-full border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber bg-white font-medium text-blueprint shadow-sm'

  // 🌟 Hàm xử lý khi chọn kích thước tiêu chuẩn: Vừa cập nhật size, vừa tự bóc tách số điền vào width và height
  const handleSizeSelect = (selectedSize) => {
    onSizeChange(selectedSize);

    if (selectedSize) {
      // Chỉ lấy các con số đứng trước chữ "cm" hoặc 2 số đầu tiên để tránh bị dính chữ A5
      const nums = selectedSize.match(/\d+/g);
      if (nums && nums.length >= 2) {
        // Lấy đúng số thứ 1 làm rộng, số thứ 2 làm dài
        if (onWidthChange) onWidthChange(Number(nums[0]));   // -> 15
        if (onHeightChange) onHeightChange(Number(nums[1]));  // -> 21
      }
    } else {
      if (onWidthChange) onWidthChange(0);
      if (onHeightChange) onHeightChange(0);
    }
  };

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
          Tên khung
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
                ? 'bg-amber text-blueprint border-amber font-bold'
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
            <OptionSelect
              id="khungSize"
              value={sizeLabel}
              onChange={handleSizeSelect} // 👈 Dùng hàm bóc tách thông minh vừa viết
              options={sizeOptions.map((o) => o.label)}
            />
          </div>
        )}
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