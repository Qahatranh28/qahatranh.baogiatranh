import { useEffect } from 'react'
import { STATUS } from '../lib/defaults.js'
import { fmtNum, parseMoney } from '../lib/format.js'

export const BRAND = '#ff4f25'
export const INK = '#1a1f2c'

export const inputCls =
  'w-full border border-[#dfe3e8] rounded-lg px-3 py-2 text-sm bg-[#f7f8fa] outline-none focus:border-[#ff4f25] focus:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed'

export function Card({ children, className = '' }) {
  return <section className={`bg-white border border-[#e3e7ec] rounded-xl p-5 ${className}`}>{children}</section>
}

export function CardTitle({ children, sub, right }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <h2 className="font-bold text-[15px] text-[#1a1f2c]">{children}</h2>
        {sub && <p className="text-xs text-[#6b7280] mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs text-[#6b7280] mb-1">{label}</span>
      {children}
    </label>
  )
}

export function Btn({ variant = 'ghost', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold px-3.5 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'
  const v = {
    primary: 'bg-[#ff4f25] text-white hover:bg-[#e8431c]',
    dark: 'bg-[#1a1f2c] text-white hover:bg-black',
    ghost: 'bg-white border border-[#dfe3e8] text-[#1a1f2c] hover:bg-[#f3f4f6]',
    danger: 'bg-white border border-red-200 text-red-600 hover:bg-red-50',
    sm: 'bg-white border border-[#dfe3e8] text-[#1a1f2c] hover:bg-[#f3f4f6] !px-2.5 !py-1 !text-xs',
  }[variant]
  return <button type="button" className={`${base} ${v} ${className}`} {...props} />
}

export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {s.short}
    </span>
  )
}

// Ô nhập tiền: hiển thị 329.000, lưu số thuần
export function MoneyInput({ value, onChange, className = '', ...rest }) {
  return (
    <input
      inputMode="numeric"
      value={value ? fmtNum(value) : ''}
      placeholder="0"
      onChange={(e) => onChange(parseMoney(e.target.value))}
      className={`${inputCls} text-right ${className}`}
      {...rest}
    />
  )
}

export function Modal({ title, onClose, children, wide = false, footer }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && !document.querySelector('[data-q2-dialog]') && onClose?.()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div data-q2-modal className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[92vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e3e7ec]">
          <h3 className="font-bold text-[#1a1f2c]">{title}</h3>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-700" aria-label="Đóng">&times;</button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-[#e3e7ec] flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function StatBox({ label, value, sub }) {
  return (
    <div className="bg-[#f4f6f8] rounded-lg px-4 py-3">
      <div className="text-xs text-[#6b7280]">{label}</div>
      <div className="text-xl font-bold text-[#1a1f2c] mt-0.5">{value}</div>
      {sub && <div className="text-[11px] text-[#6b7280] mt-0.5">{sub}</div>}
    </div>
  )
}

export function Empty({ children }) {
  return <div className="text-sm text-[#6b7280] py-8 text-center">{children}</div>
}
