import { createContext, forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import '../dialogs.css'

// Hệ thống cửa sổ thông báo thay cho hộp thoại mặc định của trình duyệt ("localhost says…").
//   const dialog = useDialog()
//   if (await dialog.confirm({ title, message, tone: 'danger', confirmText: 'Xoá' })) { … }
//   await dialog.alert({ title, message, tone: 'error', detail: err.message })
//   dialog.toast.success('Đã lưu') / .error / .warning / .info
//   const p = dialog.progress({ title, subtitle, steps: ['Bước 1', 'Bước 2'] })   // cửa sổ tiến trình
//   p.set(1)  →  await p.done('Hoàn tất')   hoặc   (await p.fail('Lỗi', chiTiet)) === 'retry'

const Ctx = createContext(null)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const TONES = {
  default: { soft: 'bg-[#fff0eb]', fg: 'text-[#ff4f25]', btn: 'bg-[#ff4f25] hover:bg-[#e8431c] focus-visible:ring-[#ff4f25]/40', bar: 'bg-[#ff4f25]', toast: 'border-l-[#ff4f25]' },
  danger: { soft: 'bg-red-50', fg: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-300', bar: 'bg-red-500', toast: 'border-l-red-500' },
  warning: { soft: 'bg-amber-50', fg: 'text-amber-600', btn: 'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-300', bar: 'bg-amber-500', toast: 'border-l-amber-500' },
  success: { soft: 'bg-emerald-50', fg: 'text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-300', bar: 'bg-emerald-500', toast: 'border-l-emerald-500' },
  info: { soft: 'bg-sky-50', fg: 'text-sky-600', btn: 'bg-sky-600 hover:bg-sky-700 focus-visible:ring-sky-300', bar: 'bg-sky-500', toast: 'border-l-sky-500' },
}
TONES.error = TONES.danger

const ICONS = {
  question: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.2 1-1.2 1.8M12 17h.01" /></>,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />,
  warning: <><path d="M12 4 2.5 20h19z" /><path d="M12 10v4M12 17h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  success: <><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16 10" /></>,
  error: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>,
  refresh: <path d="M20 11a8 8 0 0 0-14.5-4M4 4v4h4M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4" />,
  key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M16 7l3 3" /></>,
  doc: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v5h4M10 13h5M10 17h5" /></>,
}
const DEFAULT_ICON = { default: 'question', danger: 'trash', error: 'error', warning: 'warning', success: 'success', info: 'info' }

function Icon({ name, className = '', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {ICONS[name] || ICONS.info}
    </svg>
  )
}
const IconBadge = ({ tone = 'default', icon, size = 'w-11 h-11' }) => {
  const t = TONES[tone] || TONES.default
  return <span className={`${size} rounded-full ${t.soft} ${t.fg} flex items-center justify-center shrink-0`}><Icon name={icon || DEFAULT_ICON[tone] || 'info'} /></span>
}

/* ---------- khung chung: nền mờ, phím Esc / Tab, trả lại focus ---------- */
function Frame({ labelId, onEscape, onBackdrop, children, wide = false, role = 'dialog' }) {
  const box = useRef(null)
  useEffect(() => {
    const prev = document.activeElement
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onEscape?.() }
      if (e.key === 'Tab' && box.current) { // giữ focus trong cửa sổ
        const f = [...box.current.querySelectorAll('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])')]
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus() }
  }, [onEscape])
  return (
    <div data-q2-modal data-q2-dialog className="q2-fade fixed inset-0 z-[90] bg-slate-900/55 backdrop-blur-[2px] flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onBackdrop?.()}>
      <div ref={box} role={role} aria-modal="true" aria-labelledby={labelId}
        className={`q2-pop w-full ${wide ? 'max-w-[460px]' : 'max-w-[430px]'} bg-white rounded-2xl shadow-[0_24px_60px_-12px_rgba(15,23,42,.45)] overflow-hidden`}>
        {children}
      </div>
    </div>
  )
}

const Detail = ({ text }) => text ? (
  <details className="mt-3 group">
    <summary className="text-xs text-[#6b7280] cursor-pointer select-none hover:text-[#1a1f2c]">Chi tiết kỹ thuật</summary>
    <pre className="mt-1.5 text-[11.5px] leading-snug text-[#4b5563] bg-[#f3f4f6] rounded-lg p-2.5 whitespace-pre-wrap break-words max-h-28 overflow-auto">{String(text)}</pre>
  </details>
) : null

const PrimaryBtn = forwardRef(function PrimaryBtn({ tone = 'default', className = '', ...p }, ref) {
  return <button ref={ref} type="button" className={`${TONES[tone]?.btn || TONES.default.btn} text-white text-sm font-semibold rounded-lg px-4 py-2 outline-none focus-visible:ring-4 transition ${className}`} {...p} />
})
const GhostBtn = forwardRef(function GhostBtn({ className = '', ...p }, ref) {
  return (
  <button ref={ref} type="button" className={`bg-white border border-[#dfe3e8] text-[#1a1f2c] hover:bg-[#f3f4f6] text-sm font-semibold rounded-lg px-4 py-2 outline-none focus-visible:ring-4 focus-visible:ring-slate-200 transition ${className}`} {...p} />
  )
})

/* ---------- Xác nhận / Thông báo ---------- */
function MessageView({ d }) {
  const isConfirm = d.kind === 'confirm'
  const tone = d.tone || (isConfirm ? 'default' : 'info')
  const id = `q2d-${d.id}`
  const focusCancel = isConfirm && (tone === 'danger' || tone === 'error') // hành động xoá: mặc định focus "Huỷ" cho an toàn
  const okRef = useRef(null), noRef = useRef(null)
  useEffect(() => { (focusCancel ? noRef : okRef).current?.focus() }, [focusCancel])
  const cancel = () => d.resolve(isConfirm ? false : undefined)
  return (
    <Frame labelId={id} onEscape={cancel} onBackdrop={isConfirm ? undefined : cancel}>
      <div className="flex gap-4 px-6 pt-6 pb-5">
        <IconBadge tone={tone} icon={d.icon} />
        <div className="min-w-0 flex-1">
          <h3 id={id} className="text-[17px] font-bold leading-snug text-[#1a1f2c]">{d.title}</h3>
          {d.message && <div className="mt-1.5 text-sm leading-relaxed text-[#4b5563] whitespace-pre-line">{d.message}</div>}
          <Detail text={d.detail} />
        </div>
      </div>
      <div className="flex justify-end gap-2 px-6 py-3.5 bg-[#f7f8fa] border-t border-[#eceef1]">
        {isConfirm && <GhostBtn ref={noRef} onClick={() => d.resolve(false)}>{d.cancelText || 'Huỷ'}</GhostBtn>}
        <PrimaryBtn ref={okRef} tone={tone} onClick={() => d.resolve(isConfirm ? true : undefined)}>{d.confirmText || d.okText || (isConfirm ? 'Đồng ý' : 'Đã hiểu')}</PrimaryBtn>
      </div>
    </Frame>
  )
}

/* ---------- Tiến trình ---------- */
function StepRow({ state, label }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-5 h-5 shrink-0 flex items-center justify-center">
        {state === 'done' && (
          <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span>
        )}
        {state === 'active' && <svg className="q2-spin" width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#ffd9cf" strokeWidth="3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="#ff4f25" strokeWidth="3" strokeLinecap="round" /></svg>}
        {state === 'todo' && <span className="w-[18px] h-[18px] rounded-full border-2 border-[#d9dde3]" />}
      </span>
      <span className={state === 'active' ? 'font-semibold text-[#1a1f2c]' : state === 'done' ? 'text-[#4b5563]' : 'text-[#9ca3af]'}>{label}</span>
    </li>
  )
}

function ProgressView({ d }) {
  const { phase = 'running', steps = [], step = 0 } = d
  const id = `q2d-${d.id}`
  const total = Math.max(1, steps.length)
  const pct = phase === 'success' ? 100 : Math.min(94, Math.round(((step + 0.5) / total) * 100))
  const retryRef = useRef(null), closeRef = useRef(null)
  useEffect(() => { if (phase === 'error') (retryRef.current || closeRef.current)?.focus() }, [phase])

  if (phase === 'success') {
    return (
      <Frame labelId={id} wide role="alertdialog">
        <div className="px-6 py-8 text-center">
          <span className="q2-scale-in mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path className="q2-draw" d="m5 12.5 4.5 4.5L19 7.5" /></svg>
          </span>
          <h3 id={id} className="mt-4 text-lg font-bold text-[#1a1f2c]">{d.successTitle || 'Hoàn tất'}</h3>
          {d.message && <p className="mt-1 text-sm text-[#4b5563]">{d.message}</p>}
        </div>
      </Frame>
    )
  }
  if (phase === 'error') {
    return (
      <Frame labelId={id} wide onEscape={() => d.resolve('close')} role="alertdialog">
        <div className="flex gap-4 px-6 pt-6 pb-5">
          <IconBadge tone="error" icon="error" />
          <div className="min-w-0 flex-1">
            <h3 id={id} className="text-[17px] font-bold text-[#1a1f2c]">{d.errorTitle || 'Không thể hoàn tất'}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#4b5563]">{d.message}</p>
            <Detail text={d.detail} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-3.5 bg-[#f7f8fa] border-t border-[#eceef1]">
          <GhostBtn ref={closeRef} onClick={() => d.resolve('close')}>Đóng</GhostBtn>
          {d.retry !== false && <PrimaryBtn ref={retryRef} onClick={() => { d.onRetry(); d.resolve('retry') }}>Thử lại</PrimaryBtn>}
        </div>
      </Frame>
    )
  }
  return (
    <Frame labelId={id} wide role="alertdialog">
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-[#fff0eb] text-[#ff4f25] flex items-center justify-center shrink-0 relative">
            <Icon name={d.icon || 'doc'} size={24} />
            <svg className="q2-spin absolute -inset-1" width="56" height="56" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="26" stroke="#ff4f25" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="30 134" opacity=".9" /></svg>
          </span>
          <div className="min-w-0">
            <h3 id={id} className="text-[17px] font-bold leading-snug text-[#1a1f2c]">{d.title}</h3>
            {d.subtitle && <p className="text-sm text-[#6b7280] truncate">{d.subtitle}</p>}
          </div>
        </div>

        <ul className="mt-5 space-y-2.5" aria-live="polite">
          {steps.map((s, i) => <StepRow key={i} label={s} state={i < step ? 'done' : i === step ? 'active' : 'todo'} />)}
        </ul>

        <div className="mt-5">
          <div className="h-2 rounded-full bg-[#eef0f3] overflow-hidden">
            <div className="q2-shimmer h-full rounded-full bg-[#ff4f25] transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-[#6b7280]">
            <span>{d.hint || 'Vui lòng không đóng hoặc tải lại trang.'}</span><span className="font-semibold text-[#4b5563]">{pct}%</span>
          </div>
        </div>
      </div>
    </Frame>
  )
}

/* ---------- Toast ---------- */
function Toast({ t, onClose }) {
  const tone = TONES[t.tone] || TONES.success
  const icon = { success: 'success', error: 'error', warning: 'warning', info: 'info' }[t.tone] || 'success'
  return (
    <div role="status" className={`q2-toast-in relative overflow-hidden bg-white rounded-xl border border-[#e3e7ec] border-l-4 ${tone.toast} shadow-[0_10px_30px_-8px_rgba(15,23,42,.3)] flex items-start gap-3 pl-3.5 pr-2.5 py-3`}>
      <span className={`${tone.fg} mt-px shrink-0`}><Icon name={icon} size={20} /></span>
      <p className="text-sm text-[#1a1f2c] leading-snug flex-1 pt-px">{t.message}</p>
      <button onClick={onClose} aria-label="Đóng" className="text-[#9ca3af] hover:text-[#1a1f2c] text-lg leading-none px-1">&times;</button>
      <span className={`q2-countdown absolute left-0 bottom-0 h-[3px] w-full ${tone.bar} opacity-60`} style={{ animationDuration: `${t.ms}ms` }} />
    </div>
  )
}

/* ---------- Provider ---------- */
export function DialogProvider({ children }) {
  const [stack, setStack] = useState([])
  const [toasts, setToasts] = useState([])
  const seq = useRef(0)

  const api = useMemo(() => {
    const push = (item) => setStack((s) => [...s, item])
    const remove = (id) => setStack((s) => s.filter((d) => d.id !== id))
    const patch = (id, p) => setStack((s) => s.map((d) => (d.id === id ? { ...d, ...p } : d)))

    const ask = (kind, opts) => new Promise((resolve) => {
      const id = ++seq.current
      push({ id, kind, ...opts, resolve: (v) => { remove(id); resolve(v) } })
    })

    const addToast = (message, tone = 'success', ms) => {
      const id = ++seq.current
      const life = ms || (tone === 'error' ? 6000 : 3200)
      setToasts((t) => [...t.slice(-3), { id, message, tone, ms: life }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), life)
    }
    const toast = Object.assign((m, tone) => addToast(m, tone), {
      success: (m, ms) => addToast(m, 'success', ms),
      error: (m, ms) => addToast(m, 'error', ms),
      warning: (m, ms) => addToast(m, 'warning', ms),
      info: (m, ms) => addToast(m, 'info', ms),
    })

    const progress = (opts) => {
      const id = ++seq.current
      const openedAt = Date.now()
      push({ id, kind: 'progress', phase: 'running', step: 0, ...opts, resolve: () => {} })
      return {
        set: (step, hint) => patch(id, { step, ...(hint ? { hint } : {}) }),
        // thành công: hiện dấu tích rồi tự đóng (tối thiểu ~0,7s kể từ lúc mở để không bị nháy)
        done: async (message, successTitle) => {
          const wait = 700 - (Date.now() - openedAt)
          if (wait > 0) await sleep(wait)
          patch(id, { phase: 'success', message, successTitle })
          await sleep(1000)
          remove(id)
        },
        // lỗi: trả 'retry' hoặc 'close'
        fail: (message, detail, { retry = true, title } = {}) => new Promise((resolve) => {
          patch(id, {
            phase: 'error', message, detail, retry, errorTitle: title,
            onRetry: () => patch(id, { phase: 'running' }),
            resolve: (v) => { if (v === 'close') remove(id); resolve(v) },
          })
        }),
        close: () => remove(id),
      }
    }

    return { confirm: (o) => ask('confirm', o), alert: (o) => ask('alert', o), progress, toast }
  }, [])

  const top = stack[stack.length - 1]
  const closeToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  return (
    <Ctx.Provider value={api}>
      {children}
      {top && (top.kind === 'progress' ? <ProgressView key={top.id} d={top} /> : <MessageView key={top.id} d={top} />)}
      <div className="fixed top-4 right-4 z-[95] flex flex-col gap-2 w-[min(92vw,380px)] pointer-events-none">
        {toasts.map((t) => <div key={t.id} className="pointer-events-auto"><Toast t={t} onClose={() => closeToast(t.id)} /></div>)}
      </div>
    </Ctx.Provider>
  )
}

// Dự phòng nếu quên bọc Provider: dùng hộp thoại mặc định để không bị lỗi
const fallback = {
  confirm: async (o) => window.confirm(`${o.title}\n${o.message || ''}`),
  alert: async (o) => window.alert(`${o.title}\n${o.message || ''}`),
  progress: () => ({ set() {}, done: async () => {}, fail: async () => 'close', close() {} }),
  toast: Object.assign(() => {}, { success() {}, error() {}, warning() {}, info() {} }),
}
export const useDialog = () => useContext(Ctx) || fallback
