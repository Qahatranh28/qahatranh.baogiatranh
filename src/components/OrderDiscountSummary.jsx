import { formatVND } from '../utils/format.js'

// Chiết khấu áp dụng cho cả đơn (dưới mục "Danh sách báo giá") — nhập % vào
// đây sẽ tính lại ngay Tổng tiền cuối cùng, thay vì chiết khấu theo từng
// dòng sản phẩm như trước.
export default function OrderDiscountSummary({
  itemsSubtotal,
  discountPercent,
  onDiscountChange,
  itemsTotal,
  palletPackagingFee = 0,
  palletPackagingEnabled = false,
  disabled,
  warning,
}) {
  return (
    <section className="bg-blueprint text-paper rounded-2xl shadow-sm p-6 sm:p-8 mt-4">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex-1 min-w-[180px]">
          <label
            htmlFor="orderDiscountPercent"
            className="block font-mono text-xs uppercase tracking-widest text-paper/50 mb-2"
          >
            Chiết khấu cho cả đơn (%)
          </label>
          <input
            id="orderDiscountPercent"
            type="number"
            inputMode="decimal"
            min="0"
            max="100"
            step="1"
            placeholder="0"
            value={discountPercent}
            disabled={disabled}
            onChange={(e) => onDiscountChange(e.target.value)}
            className="w-full bg-paper/10 border-2 border-paper/20 focus:border-amber rounded-md py-2.5 px-3 outline-none transition-colors text-paper placeholder:text-paper/40 font-mono disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>

        <dl className="text-right">
          <div className="flex items-center justify-end gap-3 text-sm mb-1">
            <dt className="text-paper/60">Tạm tính</dt>
            <dd className="font-mono">{formatVND(itemsSubtotal)}</dd>
          </div>
          {Number(discountPercent) > 0 && (
            <div className="flex items-center justify-end gap-3 text-sm mb-1">
              <dt className="text-paper/60">Chiết khấu</dt>
              <dd className="font-mono text-amber">-{discountPercent}%</dd>
            </div>
          )}
          {palletPackagingEnabled && (
            <div className="flex items-center justify-end gap-3 text-sm mb-1">
              <dt className="text-paper/60">Đóng gói pallet</dt>
              <dd className="font-mono text-amber">
                {palletPackagingFee > 0 ? `+${formatVND(palletPackagingFee)}` : '—'}
              </dd>
            </div>
          )}
          <div className="flex items-baseline justify-end gap-3 mt-2">
            <dt className="text-xs uppercase tracking-widest text-paper/50">Tổng tiền</dt>
            <dd className="font-mono text-3xl font-bold text-amber">{formatVND(itemsTotal)}</dd>
          </div>
        </dl>
      </div>
      {warning && (
        <p className="mt-4 text-sm text-red-300 bg-red-950/40 border border-red-400/30 rounded-md px-3 py-2">
          ⚠ {warning}
        </p>
      )}
    </section>
  )
}
