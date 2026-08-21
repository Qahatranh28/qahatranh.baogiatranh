import { formatVND } from '../utils/format.js'
import { PALLET_PACKAGING_TIERS } from '../services/palletPackagingService.js'

export default function PalletPackagingOption({
  enabled,
  onToggle,
  tierId,
  onTierChange,
  fee,
  disabled,
}) {
  return (
    <section className="bg-white rounded-2xl border border-line shadow-sm p-5 sm:p-6 mt-4 transition-all duration-300">
      {/* HEADER TOGGLE CARD */}
      <div
        onClick={() => !disabled && onToggle && onToggle(!enabled)}
        style={{
          borderColor: enabled ? '#ff4f25' : undefined,
          boxShadow: enabled ? '0 4px 20px -4px rgba(255, 79, 37, 0.15)' : undefined,
        }}
        className={`relative flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 ease-in-out group ${
          enabled
            ? 'bg-white border-2'
            : 'bg-paper/40 hover:bg-paper/80 border border-line'
        }`}
      >
        {/* ICON CONTAINER */}
        <div 
          style={{
            backgroundColor: enabled ? 'rgba(255, 79, 37, 0.1)' : undefined,
            color: enabled ? '#ff4f25' : undefined,
          }}
          className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-colors duration-300 ${
            enabled ? '' : 'bg-line/40 text-blueprint/50'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
        </div>

        {/* TITLE & SUBTITLE */}
        <div className="flex-1 min-w-0 flex flex-col items-start justify-center">
          <span className={`font-mono text-xs uppercase tracking-widest font-bold transition-colors duration-300 ${
            enabled ? 'text-blueprint' : 'text-blueprint/80'
          }`}>
            Đóng gói Pallet cho đơn hàng
          </span>
          <span className="text-[11px] text-blueprint/50 mt-0.5">
            {enabled ? 'Đã kích hoạt bảo vệ an toàn vận chuyển xa.' : 'Bảo vệ tuyệt đối rủi ro móp méo khi vận chuyển.'}
          </span>
        </div>

        {/* PRICE DISPLAY */}
        {enabled && fee > 0 && (
          <div style={{ color: '#ff4f25' }} className="text-right font-mono text-sm font-bold transition-all duration-300 animate-fade-in">
            +{formatVND(fee)}
          </div>
        )}

        {/* SWITCH BUTTON */}
        <div className="shrink-0 pl-2">
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(enabled)}
            disabled={disabled}
            style={{
              backgroundColor: enabled ? '#ff4f25' : undefined,
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
              enabled ? '' : 'bg-line group-hover:bg-line/80'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-300 ease-in-out ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* TIER SELECTION BUTTONS VỚI HIỆU ỨNG MƯỢT MÀ */}
      <div className={`grid grid-cols-3 gap-3 transition-all duration-300 ease-in-out overflow-hidden ${
        enabled ? 'opacity-100 max-h-40 mt-4' : 'opacity-0 max-h-0 mt-0'
      }`}>
        {PALLET_PACKAGING_TIERS.map((tier) => {
          const isSelected = tierId === tier.id;
          return (
            <button
              key={tier.id}
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation()
                onTierChange && onTierChange(tier.id)
              }}
              style={{
                borderColor: isSelected ? '#ff4f25' : undefined,
                backgroundColor: isSelected ? 'rgba(255, 79, 37, 0.08)' : undefined,
                boxShadow: isSelected ? '0 2px 10px rgba(255, 79, 37, 0.1)' : undefined,
              }}
              className={`rounded-xl border px-3 py-3 text-center transition-all duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer ${
                isSelected
                  ? 'text-blueprint font-bold scale-[1.02]'
                  : 'border-line bg-paper/40 text-blueprint/70 hover:border-[#ff4f25]/50 hover:bg-paper/80'
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wider">{tier.label}</div>
              <div style={{ color: isSelected ? '#ff4f25' : undefined }} className="text-[11px] font-mono font-bold mt-1 transition-colors duration-300">
                {formatVND(tier.price)}
              </div>
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-[11px] text-blueprint/50 italic pl-1">
        * Mức giá tạm thời theo kích thước lớn nhất của khung. Sẽ cập nhật công thức chính xác sau.
      </p>
    </section>
  )
}