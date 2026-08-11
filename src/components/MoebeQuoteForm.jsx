import React from 'react'

// 🌟 DANH SÁCH ID VẬT TƯ KÍNH / MICA TRONG DATABASE
const KINH_MICA_DB_OPTIONS = [
  { id: 'kinh', label: 'Kính 2mm trong' },
  { id: 'mica_1_5ly', label: 'Mica 1.5 ly' },
  { id: 'mica_2ly', label: 'Mica 2 ly' },
  { id: 'mica_3ly', label: 'Mica 3 ly' },
  { id: 'mica_4ly', label: 'Mica 4 ly' },
]

// 🌟 DANH SÁCH ID VẬT TƯ RUỘT TRONG DATABASE
const RUOT_DB_OPTIONS = [
  { id: '', label: '-- Không kèm theo --' },
  { id: 'tranh_in_giay_my_thuat', label: 'Tranh in giấy mỹ thuật' },
  { id: 'van_4ly', label: 'Ván 4 ly' },
]

export default function MoebeQuoteForm({
  productName,
  onProductNameChange,
  productNameOptions = [],
  toggles = {},
  width,
  height,
  onWidthChange,
  onHeightChange,
  innerWidth,
  innerHeight,
  onInnerWidthChange,
  onInnerHeightChange,
  quantity,
  onQuantityChange,
  selections = {},
  onSelectionChange,
  khungTypeOptions = [],
  glassMicaOptions = [],
  tranhInTypeOptions = [],
  vanTypeOptions = [],
  getMaterialImage,
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Ô NHẬP TÊN SẢN PHẨM */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-blueprint/70 font-semibold mb-1">
          Tên sản phẩm
        </label>
        <div className="relative">
          <input
            type="text"
            value={productName || ''}
            onChange={(e) => onProductNameChange && onProductNameChange(e.target.value)}
            list="moebe-product-name-list"
            placeholder="Nhập tên sản phẩm (VD: Khung Moebe gỗ sồi...)"
            className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-amber bg-white font-medium text-blueprint shadow-sm"
          />
          {productNameOptions && productNameOptions.length > 0 && (
            <datalist id="moebe-product-name-list">
              {productNameOptions.map((opt, idx) => (
                <option key={idx} value={opt} />
              ))}
            </datalist>
          )}
        </div>
      </div>

      {/* 2. KHU VỰC NHẬP KÍCH THƯỚC */}
      <div className="p-4 bg-paper/60 rounded-xl border border-line space-y-5 shadow-sm">
        {/* KÍCH THƯỚC PHỦ BÌ */}
        <div>
          <h3 className="text-xs uppercase tracking-widest font-bold text-blueprint mb-3">
            1. Kích thước Phủ Bì (Khung & 2 Tấm Kính/Mica)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-blueprint/60 mb-1">Chiều rộng (cm)</label>
              <input
                type="number"
                value={width ?? ''}
                onChange={(e) => onWidthChange && onWidthChange(e.target.value)}
                placeholder="Rộng"
                className="w-full border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber font-mono bg-white font-medium text-blueprint"
              />
            </div>
            <div>
              <label className="block text-xs text-blueprint/60 mb-1">Chiều dài (cm)</label>
              <input
                type="number"
                value={height ?? ''}
                onChange={(e) => onHeightChange && onHeightChange(e.target.value)}
                placeholder="Dài"
                className="w-full border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber font-mono bg-white font-medium text-blueprint"
              />
            </div>
          </div>
        </div>

        <div className="w-full h-[1px] bg-line/60" />

        {/* KÍCH THƯỚC RUỘT */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-amber">
              2. Kích thước Phần Ruột (Tranh/Ván)
            </h3>
            <span className="text-[11px] bg-amber/10 text-amber px-2 py-0.5 rounded font-medium">
              Nhỏ hơn phủ bì
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-blueprint/60 mb-1">Rộng ruột (cm)</label>
              <input
                type="number"
                value={innerWidth ?? ''}
                onChange={(e) => onInnerWidthChange && onInnerWidthChange(e.target.value)}
                placeholder="Rộng ruột"
                className="w-full border-2 border-amber/40 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber font-mono bg-white font-medium text-blueprint"
              />
            </div>
            <div>
              <label className="block text-xs text-blueprint/60 mb-1">Dài ruột (cm)</label>
              <input
                type="number"
                value={innerHeight ?? ''}
                onChange={(e) => onInnerHeightChange && onInnerHeightChange(e.target.value)}
                placeholder="Dài ruột"
                className="w-full border-2 border-amber/40 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber font-mono bg-white font-medium text-blueprint"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. TÙY CHỌN CẤU HÌNH VẬT TƯ (MÓC TỪ DATABASE) */}
      <div className="space-y-4">
        <h3 className="font-display font-semibold text-sm text-blueprint uppercase tracking-wider">
          Cấu hình vật tư Moebe
        </h3>

        {/* VIỀN KHUNG */}
        <div className="p-4 bg-white rounded-xl border border-line shadow-sm">
          <div className="mb-3">
            <span className="font-bold text-xs uppercase text-blueprint">1. Viền Khung Moebe</span>
          </div>
          <div>
            <label className="block text-xs text-blueprint/60 mb-1.5">Chọn loại khung</label>
            <select
              value={selections.khungType || ''}
              onChange={(e) => onSelectionChange && onSelectionChange('khungType', e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber bg-paper/30 font-medium text-blueprint"
            >
              {khungTypeOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KÍNH / MICA (KẸP 2 TẤM) */}
        <div className="p-4 bg-white rounded-xl border border-line shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-xs uppercase text-blueprint">2. Mặt Kính / Mica</span>
            <span className="text-[10px] bg-amber text-white font-mono font-bold px-2 py-0.5 rounded shadow-sm">
              KẸP 2 TẤM
            </span>
          </div>
          <div>
            <label className="block text-xs text-blueprint/60 mb-1.5">Chọn vật liệu kính/mica (Material ID)</label>
            <select
              value={selections.micaKinhId || KINH_MICA_DB_OPTIONS[0].id}
              onChange={(e) => onSelectionChange && onSelectionChange('micaKinhId', e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber bg-paper/30 font-medium text-blueprint"
            >
              {KINH_MICA_DB_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} ({opt.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PHẦN RUỘT */}
        <div className="p-4 bg-white rounded-xl border border-line shadow-sm">
          <div className="mb-3">
            <span className="font-bold text-xs uppercase text-blueprint">
              3. Vật liệu phần Ruột
            </span>
          </div>
          <div>
            <label className="block text-xs text-blueprint/60 mb-1.5 font-medium">
              Chọn loại vật liệu ruột (Tính theo kích thước ruột)
            </label>
            <select
              value={selections.ruotMaterialId || ''}
              onChange={(e) => onSelectionChange && onSelectionChange('ruotMaterialId', e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber bg-paper/30 font-medium text-blueprint"
            >
              {RUOT_DB_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} {opt.id ? `(${opt.id})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. SỐ LƯỢNG */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-blueprint/70 font-semibold mb-1">
          Số lượng
        </label>
        <input
          type="number"
          min="1"
          value={quantity || '1'}
          onChange={(e) => onQuantityChange && onQuantityChange(e.target.value)}
          className="w-28 border border-line rounded-lg px-3 py-2.5 text-base outline-none focus:border-amber font-mono bg-white font-bold text-blueprint"
        />
      </div>
   {/* Mục Đóng gói dành riêng cho form Moebe */}
<div className="mt-4 pt-4 border-t border-line">
  <div className="flex items-center justify-between bg-blueprint/5 border border-line rounded-lg p-3">
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        id="moebeDongGoiToggle"
        checked={Boolean(toggles?.dongGoi)}
        onChange={(e) => {
          if (typeof onToggleChange === 'function') {
            onToggleChange('dongGoi', e.target.checked)
          }
        }}
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
    </div>
  )
}