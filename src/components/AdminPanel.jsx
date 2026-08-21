import { formatVND, formatPercent } from '../utils/format.js'

export default function AdminPanel({ itemsCost, itemsTotal }) {
  const profit = itemsTotal - itemsCost
  const margin = itemsTotal > 0 ? (profit / itemsTotal) * 100 : 0
  const isLowMargin = margin < 55 && itemsTotal > 0

  return (
    <section
      aria-labelledby="admin-heading"
      className="bg-white rounded-2xl border border-amber/30 shadow-sm p-6 sm:p-8 mt-6"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-[10px] uppercase tracking-widest bg-[#ff4f25] text-white px-2 py-0.5 rounded">
          Admin
        </span>
        <h2 id="admin-heading" className="font-display font-semibold text-lg text-blueprint">
          Chi tiết lợi nhuận (đơn đang tạo)
        </h2>
      </div>
      <p className="text-sm text-blueprint-light mb-6">
        Tính theo chiết khấu chung đã áp dụng cho cả đơn ở mục "Danh sách báo giá".
      </p>

      <dl className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-paper rounded-lg p-4">
          <dt className="text-xs text-blueprint-light mb-1">Tổng giá vốn</dt>
          <dd className="font-mono text-lg text-blueprint">{formatVND(itemsCost)}</dd>
        </div>
        <div className="bg-paper rounded-lg p-4">
          <dt className="text-xs text-blueprint-light mb-1">Tổng tiền (sau chiết khấu)</dt>
          <dd className="font-mono text-lg text-blueprint">{formatVND(itemsTotal)}</dd>
        </div>
      </dl>

      <div
        className={`rounded-lg p-4 ${
          isLowMargin ? 'bg-red-50 border border-red-200' : 'bg-blueprint'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={`text-xs uppercase tracking-widest ${
              isLowMargin ? 'text-red-700' : 'text-paper/60'
            }`}
          >
            Lợi nhuận
          </span>
          <span
            className={`font-mono text-sm font-medium ${
              isLowMargin ? 'text-red-700' : 'text-amber'
            }`}
          >
            Biên {formatPercent(margin)}
          </span>
        </div>
        <p
          className={`font-mono text-2xl font-bold ${
            isLowMargin ? 'text-red-700' : 'text-amber'
          }`}
        >
          {formatVND(profit)}
        </p>
        {isLowMargin && (
          <p className="text-xs text-red-700 mt-2">
            Biên lợi nhuận dưới 55% — cân nhắc giảm mức chiết khấu.
          </p>
        )}
      </div>
    </section>
  )
}
