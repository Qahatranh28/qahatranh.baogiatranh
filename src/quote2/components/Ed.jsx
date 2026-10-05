import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { fmtNum, parseMoney } from '../lib/format.js'
import { toYmd, fromYmd, fmtYmd } from '../lib/docs.js'
import { resizeImage } from '../lib/image.js'
import '../sheet.css'

// Ô sửa TRỰC TIẾP trên tờ phiếu. Nhìn như chữ thường (gạch chân đứt nhạt khi đang ở chế độ sửa);
// khi in / xuất ảnh thì viền biến mất (xem CSS trong PreviewShell).

// Chữ tự giãn dòng (textarea 1 dòng, tự cao thêm khi xuống dòng). multiline=false: Enter không xuống dòng.
export function Ed({ value, onChange, placeholder, className = '', multiline = false, optional = false }) {
  const ref = useRef(null)
  const fit = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  useLayoutEffect(fit, [value])
  useEffect(() => {
    window.addEventListener('resize', fit)
    document.fonts?.ready?.then(fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return (
    <textarea
      ref={ref} rows={1} spellCheck={false} style={{ resize: 'none' }}
      className={`q2-ed w-full ${optional && !value ? 'q2-empty' : ''} ${className}`}
      value={value ?? ''} placeholder={placeholder}
      onChange={(e) => onChange(multiline ? e.target.value : e.target.value.replace(/\n/g, ' '))}
      onKeyDown={(e) => { if (!multiline && e.key === 'Enter') e.preventDefault() }}
    />
  )
}

// Số (SL, %): giữ chuỗi đang gõ để gõ được "1." hoặc "2,5"
export function NumEd({ value, onChange, className = '' }) {
  const [t, setT] = useState(String(value ?? ''))
  useEffect(() => { if (Number(String(t).replace(',', '.')) !== Number(value)) setT(String(value ?? '')) }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <input
      className={`q2-ed ${className}`} inputMode="decimal" value={t}
      onChange={(e) => { setT(e.target.value); const n = Number(e.target.value.replace(',', '.')); onChange(Number.isFinite(n) ? n : 0) }}
    />
  )
}

// Tiền: hiện 1.234.567, lưu số thuần. Dùng bên trong ô có chiều rộng cố định.
export function MoneyEd({ value, onChange, className = '' }) {
  return (
    <input
      className={`q2-ed ${className}`} inputMode="numeric" value={value || value === 0 ? fmtNum(value) : ''}
      onChange={(e) => onChange(parseMoney(e.target.value))}
    />
  )
}

// Ngày dd/mm/yyyy. mode 'iso': giá trị là chuỗi ISO; mode 'ymd': giá trị là yyyy-mm-dd
export function DateEd({ value, onChange, mode = 'iso', className = '', optional = false }) {
  const toText = (v) => { const y = mode === 'iso' ? toYmd(v) : v; return y ? fmtYmd(y) : '' }
  const [t, setT] = useState(toText(value))
  useEffect(() => { setT(toText(value)) }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  const commit = () => {
    if (!t.trim()) { onChange(''); return }
    const m = t.trim().match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/)
    if (!m) { setT(toText(value)); return }
    const ymd = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
    onChange(mode === 'iso' ? fromYmd(ymd) : ymd)
  }
  return (
    <input
      className={`q2-ed ${optional && !t ? 'q2-empty' : ''} ${className}`} value={t} placeholder="dd/mm/yyyy"
      onChange={(e) => setT(e.target.value)} onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
    />
  )
}

// Ảnh (logo, QR): bấm vào ảnh để đổi
export function ImgEd({ value, onChange, edit, label, max = 600, className = '', imgClassName = '' }) {
  const inp = useRef(null)
  const pick = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try { onChange(await resizeImage(f, max)) } catch { /* bỏ qua */ }
    e.target.value = ''
  }
  if (!edit) return value ? <img src={value} alt="" className={imgClassName} /> : null
  return (
    <div className={`relative group ${value ? '' : 'q2-empty'} ${className}`}>
      {value
        ? <img src={value} alt="" className={imgClassName} />
        : <div className="q2-noprint w-full h-full min-h-[72px] border-2 border-dashed border-[#ffc7b6] rounded-lg flex items-center justify-center text-xs text-[#c2410c] text-center p-2">+ {label}</div>}
      <button type="button" onClick={() => inp.current?.click()}
        className="q2-noprint absolute inset-0 rounded-lg bg-black/50 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 flex items-center justify-center">
        {value ? 'Đổi ảnh' : 'Chọn ảnh'}
      </button>
      {value && (
        <button type="button" onClick={() => onChange('')} title="Xoá ảnh"
          className="q2-noprint absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-[#dfe3e8] text-red-600 text-xs leading-none opacity-0 group-hover:opacity-100">×</button>
      )}
      <input ref={inp} type="file" accept="image/*" className="hidden" onChange={pick} />
    </div>
  )
}
