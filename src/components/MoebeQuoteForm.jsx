import React from 'react'

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
}) {
  const selectedFrame = frameTypes.find((f) => String(f.frame_id) === String(selectedFrameId)) || frameTypes[0] || null
  const frameImageUrl = selectedFrame?.image_url || '/images/placeholder.svg'

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <label className="block text-xs uppercase tracking-widest text-blueprint/70 font-semibold mb-1">
          Tên sản phẩm
        </label>
        <input
          type="text"
          value={productName || ''}
          onChange={(e) => onProductNameChange?.(e.target.value)}
          placeholder="Nhập tên sản phẩm (VD: Khung Moebe nhôm...)"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-amber bg-white font-medium text-blueprint shadow-sm"
        />
      </div>

      <div className="mb-4">
  {/* LABEL ĐƯỢC ĐƯA RA NGOÀI */}
  <label className="block text-xs uppercase tracking-widest text-blueprint/70 font-semibold mb-2">
    Tên khung
  </label>
  
  {/* THẺ SELECT TRỰC TIẾP */}
  <select
    value={selectedFrameId || ''}
    onChange={(e) => onFrameChange?.(e.target.value)}
    className="w-full max-w-full truncate border border-line rounded-lg py-2.5 pl-3 pr-8 text-sm outline-none focus:border-amber bg-white font-medium text-blueprint shadow-sm"
  >
    {frameTypes.map((f) => (
      <option key={f.frame_id} value={f.frame_id}>
        {f.name}
      </option>
    ))}
  </select>
</div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-blueprint/70 font-semibold mb-1">
          Kích thước
        </label>
        <select
          value={selectedSizeId || ''}
          onChange={(e) => onSizeChange?.(e.target.value)}
          className="w-full border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber bg-white font-medium text-blueprint"
        >
          {sizeOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {selectedSize && (
        <div className="p-3 bg-paper/60 rounded-lg border border-line text-xs font-mono text-blueprint/70">
          Phủ bì: {selectedSize.width} × {selectedSize.height} cm · Ruột: {selectedSize.innerWidth} ×{' '}
          {selectedSize.innerHeight} cm
        </div>
      )}

      <div className="p-4 bg-white rounded-xl border border-line shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs uppercase text-blueprint">Tranh in</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(toggles.tranhIn)}
              onChange={(e) => onToggleChange?.('tranhIn', e.target.checked)}
              className="w-4 h-4 accent-amber"
            />
            <span className="text-xs font-mono text-blueprint/70">Bật in tranh</span>
          </label>
        </div>
        
        {toggles.tranhIn && (
          <div className="pt-2 border-t border-line/50">
            {selectedSize && (
              <p className="text-[11px] text-blueprint/50 mb-2">
                Tối đa theo khung đã chọn: {selectedSize.width} × {selectedSize.height} cm
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-blueprint/60 mb-1">
                  Rộng tranh in (cm) — chỉ tính giá vốn
                </label>
                <input
                  type="number"
                  value={printWidth ?? ''}
                  max={selectedSize?.width || undefined}
                  onChange={(e) => onPrintWidthChange?.(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-amber font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-blueprint/60 mb-1">
                  Dài tranh in (cm) — chỉ tính giá vốn
                </label>
                <input
                  type="number"
                  value={printHeight ?? ''}
                  max={selectedSize?.height || undefined}
                  onChange={(e) => onPrintHeightChange?.(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-amber font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-blueprint/70 font-semibold mb-1">
          Số lượng
        </label>
        <input
          type="number"
          min="1"
          value={quantity || '1'}
          onChange={(e) => onQuantityChange?.(e.target.value)}
          className="w-28 border border-line rounded-lg px-3 py-2.5 text-base outline-none focus:border-amber font-mono bg-white font-bold text-blueprint"
        />
      </div>

      <div className="pt-4 border-t border-line">
        <div className="flex items-center gap-3 bg-blueprint/5 border border-line rounded-lg p-3">
          <input
            type="checkbox"
            id="moebeDongGoiToggle"
            checked={Boolean(toggles.dongGoi)}
            onChange={(e) => onToggleChange?.('dongGoi', e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-amber"
          />
          <label
            htmlFor="moebeDongGoiToggle"
            className="font-mono text-xs uppercase tracking-widest text-blueprint cursor-pointer select-none"
          >
            Bao gồm Đóng gói sản phẩm
          </label>
        </div>
      </div>
    </div>
  )
}
