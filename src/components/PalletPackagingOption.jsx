import { formatVND } from '../utils/format.js'
import { PALLET_PACKAGING_TIERS } from '../services/palletPackagingService.js'

// 🌟 Nút "Đóng gói Pallet" cho cả đơn — đặt ngay trên ô chiết khấu.
// Sale bật công tắc rồi chọn 1 trong 3 mốc kích thước, phí sẽ tự cộng thẳng
// vào Tổng tiền (không bị trừ chiết khấu vì đây là phí dịch vụ đóng gói riêng).
export default function PalletPackagingOption({
  enabled,
  onToggle,
  tierId,
  onTierChange,
  fee,
  disabled,
}) {
  return (
    <section className="bg-white rounded-2xl border border-line shadow-sm p-5 sm:p-6 mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="palletPackagingToggle"
            checked={Boolean(enabled)}
            disabled={disabled}
            onChange={(e) => onToggle && onToggle(e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-amber disabled:cursor-not-allowed"
          />
          <label
            htmlFor="palletPackagingToggle"
            className="font-mono text-xs uppercase tracking-widest text-blueprint cursor-pointer select-none"
          >
            Đóng gói Pallet cho đơn hàng
          </label>
        </div>
        {enabled && fee > 0 && (
          <span className="font-mono text-sm font-bold text-amber">+{formatVND(fee)}</span>
        )}
      </div>

      {enabled && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {PALLET_PACKAGING_TIERS.map((tier) => (
            <button
              key={tier.id}
              type="button"
              disabled={disabled}
              onClick={() => onTierChange && onTierChange(tier.id)}
              className={`rounded-lg border px-3 py-2.5 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                tierId === tier.id
                  ? 'border-amber bg-amber/10 text-blueprint'
                  : 'border-line bg-paper/40 text-blueprint/70 hover:border-amber/50'
              }`}
            >
              <div className="text-xs font-semibold">{tier.label}</div>
              <div className="text-[11px] font-mono mt-0.5">{formatVND(tier.price)}</div>
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] text-blueprint/50">
        * Mức giá tạm thời theo kích thước lớn nhất của khung. Sẽ cập nhật công thức chính xác sau.
      </p>
    </section>
  )
}
