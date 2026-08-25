import { useState } from 'react'
import { formatVND } from '../utils/format.js'
import { DEFAULT_KHUNG_IMAGE } from '../data/khungCatalog.js'
import MaterialBreakdownTable from './MaterialBreakdownTable.jsx'

const COMPONENT_LABELS = {
  khung: 'Khung',
  tranhIn: 'In tranh',
  micaKinh: 'Mica/Kính',
  van: 'Ván lót',
  giayBo: 'Giấy bo',
  satXi: 'Sắt xi',
  son: 'Sơn',
  hoanThien: 'Hoàn thiện',
}

export default function ResultPanel({
  width,
  height,
  quantity,
  area,
  toggles,
  unitPrice,
  lineTotal,
  onAdd,
  canAdd,
  canOrder = true,
  imageSrc,
  costDisplay,
  costDisplayLabel = 'Giá vốn',
  isAdmin,
  matchedStandardSizeLabel,
  hideArea = false,
  mode = 'simple',
  costResult,
  khungType,
  isAdminRole = false,
}) {
  const hasDimensions = width > 0 && height > 0

  // 🌟 Định nghĩa các cấu phần hiển thị riêng theo từng loại form/mode
  let selectedComponents = []

  if (mode === 'moebe') {
    selectedComponents = ['Khung', 'Mica/Kính x2', toggles?.tranhIn ? 'In tranh' : null].filter(Boolean)
  } else if (mode === 'jersey') {
    // 🌟 Cấu tạo cho form Áo đấu theo đúng yêu cầu
    selectedComponents = ['Khung', 'Kính/Mica', 'In tranh', 'Ván lót', 'Áo đấu']
  } else {
    selectedComponents = Object.entries(toggles || {})
      .filter(([, v]) => v)
      .map(([k]) => COMPONENT_LABELS[k])
      .filter(Boolean)
  }

  const [materialsOpen, setMaterialsOpen] = useState(false)
  const showImage = Boolean(imageSrc) && !(isAdminRole && materialsOpen)

  const phuThuHoanThien = toggles?.hoanThien ? unitPrice - Math.round(unitPrice / 1.3) : 0

  return (
    <section
      aria-labelledby="result-heading"
      className="bg-blueprint text-paper rounded-2xl shadow-lg p-6 sm:p-8 flex flex-col h-full"
    >
      {showImage && (
        <div className="mb-6 rounded-xl overflow-hidden bg-paper/5 border border-paper/10 h-56 sm:h-64 flex items-center justify-center">
          <img
            src={imageSrc}
            alt="Hình minh hoạ khung"
            className="w-full h-full object-contain"
            onError={(e) => {
              if (e.currentTarget.src.indexOf(DEFAULT_KHUNG_IMAGE) === -1) {
                e.currentTarget.src = DEFAULT_KHUNG_IMAGE
              }
            }}
          />
        </div>
      )}

      {/* Dimension line annotation */}
      <div className="mb-6">
        <div className="flex items-center gap-2 font-mono text-sm text-paper/70">
          <span>{hasDimensions ? width.toFixed(1) : '0'} cm</span>
          <span className="flex-1 border-t border-dashed border-paper/30 relative">
            <span className="absolute -left-1 -top-[5px] text-paper/40">◂</span>
            <span className="absolute -right-1 -top-[5px] text-paper/40">▸</span>
          </span>
          <span>×</span>
          <span className="flex-1 border-t border-dashed border-paper/30" />
          <span>{hasDimensions ? height.toFixed(1) : '0'} cm</span>
        </div>
        {!hideArea && (
          <p className="mt-3 font-mono text-3xl font-medium text-[#ff4f25]">
            {area.toFixed(2)} <span className="text-lg text-white/50">m²</span>
          </p>
        )}
        {matchedStandardSizeLabel && (
          <p className="mt-2 text-xs font-mono text-amber">
            Size lẻ ≤ 1m — tự động tính theo giá khung tiêu chuẩn {matchedStandardSizeLabel}
          </p>
        )}
      </div>

      {/* 🌟 Khối hiển thị tiêu đề chung "Cấu tạo sản phẩm" và các thẻ */}
      {selectedComponents.length > 0 && (
        <div className="mb-6 border-t border-paper/15 pt-4">
          <p className="font-mono text-xs uppercase tracking-widest text-white mb-2">
            Cấu tạo sản phẩm
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedComponents.map((label) => (
              <span
                key={label}
                className="text-xs font-mono px-2.5 py-1 rounded-full bg-paper/10 text-paper/80 font-medium"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      <dl className="space-y-3 border-t border-paper/15 pt-6 mb-6">
        <div className="flex justify-between text-sm">
          <dt className="text-paper/60">Đơn giá (1 sản phẩm)</dt>
          <dd className="font-mono">{formatVND(unitPrice)}</dd>
        </div>
        
        {toggles?.hoanThien && (
          <div className="flex justify-between text-sm text-[#ff4f25]">
            <dt className="text-paper/80 font-medium">↳ Phụ thu hoàn thiện (30%)</dt>
            <dd className="font-mono">+{formatVND(phuThuHoanThien)}</dd>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <dt className="text-paper/60">Số lượng</dt>
          <dd className="font-mono">{quantity}</dd>
        </div>
        {costDisplay != null && (
          <div className="flex justify-between text-sm">
            <dt className="text-paper/60">
              {costDisplayLabel}
              {!isAdmin && <span className="text-paper/40"> (tham khảo)</span>}
            </dt>
            <dd className="font-mono">{formatVND(costDisplay)}</dd>
          </div>
        )}
      </dl>

      {isAdminRole && (
        <div className="mb-6 space-y-2">
          <MaterialBreakdownTable
            costResult={costResult}
            mode={mode}
            khungType={khungType}
            open={materialsOpen}
            onToggle={setMaterialsOpen}
          />
          {materialsOpen && toggles?.hoanThien && (
            <div className="bg-[#ff4f25]/10 border border-[#ff4f25]/20 rounded-md p-3 flex justify-between items-center text-[#ff4f25]">
              <span className="text-[11px] font-bold uppercase tracking-widest">Phụ thu hoàn thiện (Tính trên giá bán)</span>
              <span className="font-mono font-bold text-sm">+{formatVND(phuThuHoanThien)} / sp</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-6 border-t border-paper/15">
        <p className="font-mono text-xs uppercase tracking-widest text-paper/50 mb-1">
          Thành tiền
        </p>
        <p className="font-mono text-4xl sm:text-5xl font-bold text-[#ff4f25] break-all mb-5">
          {formatVND(lineTotal)}
        </p>
        <button
          onClick={onAdd}
          disabled={!canAdd}
          className="w-full bg-[#ff4f25] hover:bg-[#e0441e] disabled:bg-paper/15 disabled:cursor-not-allowed disabled:text-paper/40 text-white font-medium rounded-md py-3 transition-colors"
        >
          {canOrder ? '+ Thêm vào danh sách' : 'Đăng nhập để tạo báo giá'}
        </button>
        {!canOrder && (
          <p className="text-xs text-paper/50 mt-2 text-center">
            Bạn đang xem giá tham khảo. Vui lòng đăng nhập để thêm sản phẩm và tạo báo giá.
          </p>
        )}
      </div>
    </section>
  )
}