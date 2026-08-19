import React from 'react'
import { formatVND } from '../utils/format.js'

const TIER_OPTIONS = [
  { id: 'basic', label: '1 mặt cơ bản' },
  { id: 'premium', label: '1 mặt cao cấp' },
]

export default function JerseyQuoteForm({
  productName,
  onProductNameChange,
  tier,
  onTierChange,
  frameTypes = [],
  filteredFrameTypes = [],
  selectedCategory,
  onFrameCategoryChange,
  categoryOptions = [],
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
          placeholder="Nhập tên sản phẩm (VD: Khung áo đấu Real Madrid...)"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-amber bg-white font-medium text-blueprint shadow-sm"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-blueprint/70 font-semibold mb-2">
          Loại áo đấu
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TIER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onTierChange?.(opt.id)}
              className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                tier === opt.id
                  ? 'border-amber bg-amber/10 text-blueprint'
                  : 'border-line bg-white text-blueprint/60 hover:border-amber/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative rounded-xl border border-line bg-white/80 p-3 pr-24 shadow-sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-widest text-blueprint/70 font-semibold mb-1">
              Loại khung
            </label>
            <select
              value={selectedCategory || ''}
              onChange={(e) => onFrameCategoryChange?.(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber bg-white font-medium text-blueprint"
            >
              {categoryOptions.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                  {cat.hasFrames === false ? ' (chưa có khung trong DB)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-blueprint/70 font-semibold mb-1">
              Tên khung
            </label>
            {filteredFrameTypes.length > 0 ? (
              <select
                value={selectedFrameId || ''}
                onChange={(e) => onFrameChange?.(Number(e.target.value) || e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber bg-white font-medium text-blueprint"
              >
                {filteredFrameTypes.map((f) => (
                  <option key={f.frame_id} value={f.frame_id}>
                    {f.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-amber bg-amber/10 border border-amber/30 rounded-lg px-3 py-2.5">
                Chưa có khung nào thuộc danh mục này trong DB. Vào "Quản lý sản phẩm" để gán danh mục{' '}
                <span className="font-mono">
                  {selectedCategory === 'nhom' ? 'nhom' : 'composite_2x3'}
                </span>{' '}
                cho khung tương ứng.
              </p>
            )}
          </div>
        </div>

        {selectedFrame && (
          <div className="absolute right-3 top-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-line bg-paper shadow-sm">
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-blueprint/60 mb-1">Chiều rộng khung (cm)</label>
          <input
            type="number"
            value={width ?? ''}
            onChange={(e) => onWidthChange?.(e.target.value)}
            placeholder="Rộng"
            className="w-full border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber font-mono bg-white"
          />
        </div>
        <div>
          <label className="block text-xs text-blueprint/60 mb-1">Chiều dài khung (cm)</label>
          <input
            type="number"
            value={height ?? ''}
            onChange={(e) => onHeightChange?.(e.target.value)}
            placeholder="Dài"
            className="w-full border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber font-mono bg-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-blueprint/70 font-semibold mb-1">
          Size áo đấu
        </label>
        <select
          value={selectedJerseySizeId || ''}
          onChange={(e) => onJerseySizeChange?.(Number(e.target.value) || e.target.value)}
          className="w-full border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber bg-white font-medium text-blueprint"
        >
          {jerseyPrices.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sizeLabel}
            </option>
          ))}
        </select>
        
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
            id="jerseyDongGoiToggle"
            checked={Boolean(toggles.dongGoi)}
            onChange={(e) => onToggleChange?.('dongGoi', e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-amber"
          />
          <label
            htmlFor="jerseyDongGoiToggle"
            className="font-mono text-xs uppercase tracking-widest text-blueprint cursor-pointer select-none"
          >
            Bao gồm Đóng gói sản phẩm
          </label>
        </div>
      </div>
    </div>
  )
}
