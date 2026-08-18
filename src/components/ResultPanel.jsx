import { formatVND } from '../utils/format.js'
import { DEFAULT_KHUNG_IMAGE } from '../data/khungCatalog.js'

const COMPONENT_LABELS = {
  khung: 'Khung',
  tranhIn: 'In tranh',
  micaKinh: 'Mica/Kính',
  van: 'Ván lót',
  giayBo: 'Giấy bo',
  satXi: 'Sắt xi',
  son: 'Sơn',
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
  canOrder = true, // 🌟 true nếu đã đăng nhập; false = khách vãng lai (chỉ xem giá, không thêm được)
  imageSrc,
  costDisplay,
  costDisplayLabel = 'Giá vốn',
  isAdmin,
  matchedStandardSizeLabel,
  hideArea = false,
  mode = 'simple',
}) {
  const hasDimensions = width > 0 && height > 0
  const selectedComponents = Object.entries(toggles)
    .filter(([, v]) => v)
    .map(([k]) => COMPONENT_LABELS[k])
    .filter(Boolean)

  return (
    <section
      aria-labelledby="result-heading"
      className="bg-blueprint text-paper rounded-2xl shadow-lg p-6 sm:p-8 flex flex-col h-full"
    >
      {imageSrc && (
        <div className="mb-6 rounded-x1 overflow-hidden bg-paper/5 border border-paper/10">
          <img
            src={imageSrc}
            alt="Hình minh hoạ khung" 
            className={mode === 'jersey' ? 'w-full aspect-auto object-contain' : 'w-full aspect-[6/6] object-cover'}
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
          <p className="mt-3 font-mono text-3xl font-medium text-orange-500">
            {area.toFixed(2)} <span className="text-lg text-white/50">m²</span>
          </p>
        )}
        {matchedStandardSizeLabel && (
          <p className="mt-2 text-xs font-mono text-amber">
            Size lẻ ≤ 1m — tự động tính theo giá khung tiêu chuẩn {matchedStandardSizeLabel}
          </p>
        )}
      </div>

      {selectedComponents.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {selectedComponents.map((label) => (
            <span
              key={label}
              className="text-xs font-mono px-2 py-1 rounded-full bg-paper/10 text-paper/70"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <dl className="space-y-3 border-t border-paper/15 pt-6 mb-6">
        <div className="flex justify-between text-sm">
          <dt className="text-paper/60">Đơn giá (1 sản phẩm)</dt>
          <dd className="font-mono">{formatVND(unitPrice)}</dd>
        </div>
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

      <div className="mt-auto pt-6 border-t border-paper/15">
        <p className="font-mono text-xs uppercase tracking-widest text-paper/50 mb-1">
          Thành tiền
        </p>
        <p className="font-mono text-4xl sm:text-5xl font-bold text-orange-500 break-all mb-5">
          {formatVND(lineTotal)}
        </p>
        <button
          onClick={onAdd}
          disabled={!canAdd}
          className="w-full bg-amber hover:bg-amber-light disabled:bg-paper/15 disabled:cursor-not-allowed disabled:text-paper/40 text-blueprint font-medium rounded-md py-3 transition-colors"
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
