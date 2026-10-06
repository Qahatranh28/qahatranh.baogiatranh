import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Card, CardTitle, Field, Btn, StatusBadge, MoneyInput, inputCls } from '../components/ui.jsx'
import { calcQuote, newItem } from '../lib/calc.js'
import { fmtMoney, fmtPct, fmtNum, fmtDate } from '../lib/format.js'
import { STATUS, TAX_OPTIONS, LOST_REASONS } from '../lib/defaults.js'
import { canEditQuote } from '../lib/permissions.js'
import { useDialog } from '../components/Dialogs.jsx'
import { buildCustomers } from '../lib/customers.js'

const Num = ({ n }) => (
  <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-[#1a1f2c] text-white text-[10px] font-bold mr-1.5">{n}</span>
)

const withCentimeterUnit = (value) => {
  const size = String(value || '').trim()
  if (!size || /cm$/i.test(size)) return size
  return `${size} cm`
}

function ProductNameInput({ value, onChange, disabled }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const input = ref.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${input.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      list="q2-product-names"
      rows={1}
      className={`${inputCls} h-10 resize-none overflow-hidden min-h-[40px] py-2 min-w-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere]`}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Nhập tên sản phẩm..."
    />
  )
}

function CustomerPicker({ quote, set, allQuotes, disabled }) {
  const [open, setOpen] = useState(false)
  const customers = useMemo(() => buildCustomers(allQuotes), [allQuotes])
  const matches = (field) => {
    const q = String(quote[field] || '').trim().toLowerCase()
    if (q.length < 1) return []
    return customers.filter((c) => (field === 'customerName' ? c.name : c.phone).toLowerCase().includes(q)).slice(0, 6)
  }
  const box = (field, placeholder, label) => (
    <Field label={label} className="relative">
      <input
        className={inputCls}
        disabled={disabled}
        placeholder={placeholder}
        value={quote[field]}
        onChange={(e) => { set({ [field]: e.target.value }); setOpen(field) }}
        onFocus={() => setOpen(field)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open === field && matches(field).length > 0 && quote.id == null && (
        <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-[#dfe3e8] rounded-lg shadow-lg max-h-56 overflow-auto">
          {matches(field).map((c) => (
            <li key={c.key}>
              <button type="button" onMouseDown={() => set({ customerName: c.name, customerPhone: c.phone })}
                className="w-full text-left px-3 py-2 hover:bg-[#f3f4f6] text-sm">
                <span className="font-medium">{c.name || '(chưa có tên)'}</span>
                <span className="text-xs text-[#6b7280] ml-2">{c.phone || 'chưa có SĐT'} · {c.total} BG</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  )
  return (
    <>
      {box('customerName', 'Nhập tên khách hàng', 'Khách hàng')}
      {box('customerPhone', 'Nhập số điện thoại', 'Số điện thoại')}
    </>
  )
}

export default function QuoteEditor({
  quote, setQuote, dirty, saving, user, perms, allQuotes,
  onSave, onBack, onNew, onClone, onPreview, onDelete, orderExists, onOpenOrder,
}) {
  const calc = useMemo(() => calcQuote(quote), [quote])
  const editable = canEditQuote(user, quote)
  const cost = perms.canSeeCost
  const [statusMsg, setStatusMsg] = useState('')
  const names = useMemo(() => [...new Set(allQuotes.flatMap((q) => q.items.map((i) => i.name)).filter(Boolean))].slice(0, 200), [allQuotes])

  const set = (patch) => setQuote((q) => ({ ...q, ...patch }))
  const setItem = (id, patch) => setQuote((q) => ({ ...q, items: q.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }))
  const addRow = () => setQuote((q) => ({ ...q, items: [...q.items, newItem(q.items.length)] }))
  const delRow = (id) => setQuote((q) => ({ ...q, items: q.items.length > 1 ? q.items.filter((i) => i.id !== id) : q.items }))

  const dialog = useDialog()
  const changeStatus = async (next) => {
    setStatusMsg('')
    if (next === quote.status) return
    if (next === 'won') {
      if (!perms.canApprove) return setStatusMsg('Chỉ quản lý được duyệt/chốt báo giá.')
      if (!calc.passes) {
        const ok = await dialog.confirm({
          tone: 'warning', icon: 'warning', title: 'Biên lợi nhuận chưa đạt mức tối thiểu',
          message: calc.hasCost
            ? `Biên lợi nhuận sau chiết khấu hiện là ${fmtPct(calc.marginAfter)}, thấp hơn mức tối thiểu ${quote.minMargin}%. Bạn vẫn muốn chốt báo giá này?`
            : `Chưa nhập giá vốn nên chưa thể kiểm tra biên lợi nhuận (mức tối thiểu ${quote.minMargin}%). Bạn vẫn muốn chốt báo giá này?`,
          confirmText: 'Vẫn chốt đơn', cancelText: 'Xem lại',
        })
        if (!ok) return
      }
    }
    set({ status: next, lostReason: next === 'lost' ? quote.lostReason : '' })
  }

  const lostReasonIsPreset = LOST_REASONS.includes(quote.lostReason)

  return (
    <div className="q2-quote-editor space-y-4 [&_label>span]:text-[11px]">
      {/* Thanh tiêu đề */}
      <Card className="!py-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={onBack} className="text-sm text-[#6b7280] hover:text-[#1a1f2c]">← Danh sách</button>
            <h2 className="font-bold text-lg text-[#1a1f2c]">Báo giá {quote.code}</h2>
            <StatusBadge status={quote.status} />
            <span className="text-xs text-[#6b7280]">
              Sale phụ trách: <b className="text-[#1a1f2c]">{quote.ownerName || '—'}</b>
              {quote.id ? ` · ${fmtDate(quote.createdAt)}` : ' · chưa lưu'}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {quote.id && perms.canDeleteQuote && <Btn variant="danger" onClick={onDelete}>Xoá</Btn>}
            <Btn onClick={onClone} disabled={!quote.id}>Nhân bản</Btn>
            <Btn onClick={onNew}>Báo giá mới</Btn>
            <Btn onClick={onPreview}>Xem trước báo giá</Btn>
            <Btn onClick={onOpenOrder}>{orderExists ? 'Mở phiếu' : 'Tạo phiếu'}</Btn>
            <Btn variant="primary" onClick={onSave} disabled={!editable || saving || (!dirty && !!quote.id)}>
              {saving ? 'Đang lưu…' : dirty || !quote.id ? 'Lưu báo giá' : 'Đã lưu ✓'}
            </Btn>
          </div>
        </div>
        {!editable && <p className="text-xs text-red-600 mt-2">Bạn chỉ có quyền xem báo giá này (thuộc sale khác).</p>}
      </Card>

      {/* Thông tin chung */}
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CustomerPicker quote={quote} set={set} allQuotes={allQuotes} disabled={!editable} />
          <Field label="Chiết khấu (%)">
            <input type="number" min="0" max="100" step="0.5" className={inputCls} disabled={!editable}
              value={quote.discountPercent} onChange={(e) => set({ discountPercent: e.target.value === '' ? 0 : Number(e.target.value) })} />
          </Field>
          <Field label="Thuế">
            <select className={inputCls} disabled={!editable} value={quote.taxRate} onChange={(e) => set({ taxRate: Number(e.target.value) })}>
              {TAX_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          {cost && (
            <Field label="Biên tối thiểu sau CK (%)">
              <input type="number" min="0" max="99" className={inputCls} value={quote.minMargin}
                onChange={(e) => set({ minMargin: e.target.value === '' ? 0 : Number(e.target.value) })} />
            </Field>
          )}
        </div>

        <div className="border-t border-[#e3e7ec] mt-4 pt-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-[#1a1f2c]">Trạng thái</span>
          <div className="inline-flex border border-[#dfe3e8] rounded-lg overflow-hidden">
            {Object.entries(STATUS).map(([k, s]) => (
              <button key={k} type="button" disabled={!editable}
                onClick={() => changeStatus(k)}
                className={`px-3 py-1.5 text-sm font-medium border-r last:border-r-0 border-[#dfe3e8] disabled:opacity-60 ${
                  quote.status === k ? (k === 'pending' ? 'bg-amber-100 text-amber-800' : k === 'won' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700') : 'bg-white hover:bg-[#f3f4f6]'}`}>
                {s.label}
              </button>
            ))}
          </div>
          {statusMsg && <span className="text-xs text-red-600">{statusMsg}</span>}
        </div>

        {quote.status === 'lost' && (
          <div className="mt-3 grid sm:grid-cols-2 gap-3 max-w-2xl">
            <Field label="Lý do thất bại">
              <select className={inputCls} disabled={!editable} value={lostReasonIsPreset ? quote.lostReason : quote.lostReason ? '__other' : ''}
                onChange={(e) => set({ lostReason: e.target.value === '__other' ? ' ' : e.target.value })}>
                <option value="">— Chọn lý do —</option>
                {LOST_REASONS.map((r) => <option key={r}>{r}</option>)}
                <option value="__other">Lý do khác…</option>
              </select>
            </Field>
            {!lostReasonIsPreset && quote.lostReason !== '' && (
              <Field label="Ghi rõ lý do">
                <input className={inputCls} disabled={!editable} value={quote.lostReason.trim() === '' ? '' : quote.lostReason}
                  onChange={(e) => set({ lostReason: e.target.value || ' ' })} autoFocus />
              </Field>
            )}
          </div>
        )}
      </Card>

      {/* Sản phẩm */}
      <Card>
        <CardTitle sub={cost ? 'Nhập theo thứ tự cột 1 → 5.' : 'Nhập theo thứ tự cột 1 → 4. Giá vốn do quản lý điền khi duyệt.'}>
          Sản phẩm{cost ? ' và lợi nhuận' : ''}
        </CardTitle>
        <datalist id="q2-product-names">{names.map((n) => <option key={n} value={n} />)}</datalist>
        <div className="space-y-3">
          {calc.lines.map((l, idx) => (
            <section key={l.id} className="min-w-0 rounded-lg border border-[#e3e7ec] bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#4b5563]">Sản phẩm {idx + 1}</span>
                {editable && calc.lines.length > 1 && (
                  <button type="button" onClick={() => delRow(l.id)} className="text-xs text-gray-400 hover:text-red-600" aria-label="Xoá dòng">Xoá</button>
                )}
              </div>
              <div className={`grid min-w-0 grid-cols-2 items-start gap-2 ${cost
                ? 'min-[560px]:grid-cols-[minmax(0,2fr)_minmax(0,.9fr)_minmax(0,.65fr)_minmax(0,1fr)_minmax(0,1fr)]'
                : 'min-[560px]:grid-cols-[minmax(0,2fr)_minmax(0,.9fr)_minmax(0,.65fr)_minmax(0,1fr)]'}`}>
                <label className="block min-w-0">
                  <span className="mb-1 block h-7 text-[10px] leading-3 text-[#6b7280]">Tên sản phẩm</span>
                <ProductNameInput
                  disabled={!editable}
                  value={l.name}
                  onChange={(value) => setItem(l.id, { name: value })}
                />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block h-7 text-[10px] leading-3 text-[#6b7280]">Kích thước</span>
                  <input className={`${inputCls} h-10 min-w-0 px-2 text-xs`} disabled={!editable} value={l.size} placeholder="55x80" onChange={(e) => setItem(l.id, { size: e.target.value })} onBlur={(e) => setItem(l.id, { size: withCentimeterUnit(e.target.value) })} />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block h-7 text-[10px] leading-3 text-[#6b7280]">Số lượng</span>
                  <input type="number" min="0" className={`${inputCls} h-10 min-w-0 px-2 text-right text-xs`} disabled={!editable} value={l.quantity} onChange={(e) => setItem(l.id, { quantity: e.target.value === '' ? 0 : Number(e.target.value) })} />
                </label>
                {cost && (
                  <label className="block min-w-0">
                    <span className="mb-1 block h-7 text-[10px] leading-3 text-[#6b7280]">Giá vốn (1sp)</span>
                    <MoneyInput className="h-10 min-w-0 px-2 text-xs" value={l.unitCost} disabled={!editable} onChange={(v) => setItem(l.id, { unitCost: v })} />
                  </label>
                )}
                <label className="block min-w-0">
                  <span className="mb-1 block h-7 text-[10px] leading-3 text-[#6b7280]">Đơn giá (1sp)</span>
                  <MoneyInput className="h-10 min-w-0 px-2 text-xs" value={l.unitPrice} disabled={!editable} onChange={(v) => setItem(l.id, { unitPrice: v })}
                    onKeyDown={(e) => { if (e.key === 'Enter' && idx === calc.lines.length - 1) { e.preventDefault(); addRow() } }} />
                </label>
              </div>
              <div className={`mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-[#eef0f3] pt-2 text-[11px] text-[#6b7280] ${cost ? 'sm:grid-cols-4' : 'sm:grid-cols-2'}`}>
                <div>Thành tiền: <b className="text-[#1a1f2c]">{fmtMoney(l.revenue)}</b></div>
                {cost && <>
                  <div>Tiền lời (1sp): <b className={l.profitUnit < 0 ? 'text-red-600' : 'text-emerald-700'}>{fmtMoney(l.profitUnit)}</b></div>
                  <div>Tổng giá vốn: <b className="text-[#1a1f2c]">{fmtMoney(l.cost)}</b></div>
                  <div className="flex flex-wrap items-center gap-1">Tổng tiền lời: <b className={l.profit < 0 ? 'text-red-600' : 'text-emerald-700'}>{fmtMoney(l.profit)}</b>
                    <span className={`font-semibold ${l.unitCost > 0 && l.revenue > 0 ? (l.marginAfter >= quote.minMargin ? 'text-emerald-700' : 'text-red-600') : 'text-[#9ca3af]'}`}>
                      {l.unitCost > 0 && l.revenue > 0 ? `(${fmtPct(l.marginAfter, 1)})` : '(—)'}
                    </span>
                  </div>
                </>}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {editable && <Btn variant="sm" onClick={addRow}>+ Thêm sản phẩm</Btn>}
          <div className="ml-auto text-sm font-bold">Tổng tiền: {fmtMoney(calc.subtotal)}</div>
        </div>
        <div className="mt-4 max-w-xl">
          <Field label="Ghi chú hiển thị trên bản gửi khách (không bắt buộc)">
            <textarea rows={2} className={inputCls} disabled={!editable} value={quote.note} onChange={(e) => set({ note: e.target.value })} />
          </Field>
        </div>
      </Card>

      {/* Tổng hợp */}
      <Card>
        <CardTitle>{cost ? 'Tổng hợp cho quản lý duyệt' : 'Tổng hợp đơn hàng'}</CardTitle>
        <div className={`grid gap-5 ${cost ? 'lg:grid-cols-[1.1fr_1fr]' : ''}`}>
          {cost && (
            <div className={`rounded-xl p-5 ${calc.passes ? 'bg-[#e3f4ea] text-emerald-800' : 'bg-red-50 text-red-800'}`}>
              {!calc.hasCost ? (
                <>
                  <p className="font-bold">Chưa nhập giá vốn</p>
                  <p className="text-sm mt-1">Nhập giá vốn (cột 4) để tính biên lợi nhuận và duyệt báo giá.</p>
                </>
              ) : (
                <>
                  <p className="font-bold">{calc.passes ? 'Đạt biên lợi nhuận, có thể duyệt' : `Chưa đạt biên tối thiểu ${quote.minMargin}%`}</p>
                  <p className="text-5xl font-extrabold my-1.5">{fmtPct(calc.marginAfter)}</p>
                  <p className="text-sm">Biên lợi nhuận đơn hàng sau chiết khấu</p>
                  <p className="text-xs mt-1 opacity-90">
                    Tiền lời sau CK {fmtMoney(calc.profitAfter)} · mức tối thiểu ${quote.minMargin}% · thuế thu hộ không tính vào lời
                  </p>
                  {!calc.passes && calc.afterDiscount > 0 && (
                    <p className="text-xs mt-2 font-medium">
                      Để đạt: tăng doanh thu sau CK thêm {fmtMoney(calc.shortfall)}
                      {calc.discountPercent > 0 && calc.reachableByDiscount
                        ? <> — hoặc giảm chiết khấu xuống tối đa {fmtPct(calc.maxDiscount, 1)}</>
                        : calc.discountPercent > 0 ? <> (giảm chiết khấu không đủ, cần nâng đơn giá)</> : null}.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
          <dl className="text-sm">
            {[
              ['Tổng tiền (trước CK)', fmtMoney(calc.subtotal), false, true],
              ...(cost ? [
                ['Giá vốn (theo số lượng)', fmtMoney(calc.totalCost), false, true],
                ['Tiền lời (theo số lượng)', fmtMoney(calc.profitBefore), false, true],
                ['Biên lợi nhuận đơn hàng', fmtPct(calc.marginBefore), false, true],
              ] : []),
              [`Chiết khấu (${fmtNum(calc.discountPercent)}%)`, `− ${fmtMoney(calc.discountAmount)}`, false, true],
              ['Tổng tiền sau CK', fmtMoney(calc.afterDiscount), false, true],
              [quote.taxRate ? `VAT ${quote.taxRate}% (thu hộ)` : 'Thuế', fmtMoney(calc.taxAmount), false, true],
              ...(cost ? [
                ['Tiền lời (sau CK)', fmtMoney(calc.profitAfter), true, true],
                ['Biên lợi nhuận (sau CK)', fmtPct(calc.marginAfter), true, true],
              ] : []),
              ['Tổng thanh toán', fmtMoney(calc.grandTotal), true, true],
            ].map(([k, v, bold]) => (
              <div key={k} className="flex justify-between py-2 border-b border-[#eef0f3]">
                <dt className={bold ? 'font-bold' : ''}>{k}</dt>
                <dd className={bold ? 'font-bold' : 'font-medium'}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>
    </div>
  )
}