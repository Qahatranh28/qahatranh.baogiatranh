import { useMemo, useState } from 'react'
import { Card, CardTitle, Field, Btn, StatusBadge, MoneyInput, inputCls } from '../components/ui.jsx'
import { calcQuote, newItem } from '../lib/calc.js'
import { fmtMoney, fmtPct, fmtNum, fmtDate } from '../lib/format.js'
import { STATUS, TAX_OPTIONS, LOST_REASONS } from '../lib/defaults.js'
import { canEditQuote } from '../lib/permissions.js'
import { buildCustomers } from '../lib/customers.js'

const Num = ({ n }) => (
  <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-[#1a1f2c] text-white text-[10px] font-bold mr-1.5">{n}</span>
)

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
      {box('customerName', 'Gõ tên để tìm khách cũ', 'Khách hàng')}
      {box('customerPhone', 'Gõ SĐT để tìm khách cũ', 'Số điện thoại')}
    </>
  )
}

export default function QuoteEditor({
  quote, setQuote, dirty, saving, user, perms, allQuotes,
  onSave, onBack, onNew, onClone, onPreview, onDelete,
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

  const changeStatus = (next) => {
    setStatusMsg('')
    if (next === quote.status) return
    if (next === 'won') {
      if (!perms.canApprove) return setStatusMsg('Chỉ quản lý được duyệt/chốt báo giá.')
      if (!calc.passes && !window.confirm(`Biên lợi nhuận sau CK (${fmtPct(calc.marginAfter)}) chưa đạt mức tối thiểu ${quote.minMargin}%${calc.hasCost ? '' : ' (chưa nhập giá vốn)'}. Vẫn chốt?`)) return
    }
    set({ status: next, lostReason: next === 'lost' ? quote.lostReason : '' })
  }

  const lostReasonIsPreset = LOST_REASONS.includes(quote.lostReason)

  return (
    <div className="space-y-4">
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
            <Btn variant="primary" onClick={onSave} disabled={!editable || saving || (!dirty && !!quote.id)}>
              {saving ? 'Đang lưu…' : dirty || !quote.id ? 'Lưu báo giá' : 'Đã lưu ✓'}
            </Btn>
          </div>
        </div>
        {!editable && <p className="text-xs text-red-600 mt-2">Bạn chỉ có quyền xem báo giá này (thuộc sale khác).</p>}
      </Card>

      {/* Thông tin chung */}
      <Card>
        <div className={`grid gap-3 sm:grid-cols-2 ${cost ? 'lg:grid-cols-[1.3fr_1fr_.7fr_.9fr_1fr]' : 'lg:grid-cols-[1.3fr_1fr_.7fr_.9fr]'}`}>
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
        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${cost ? 'min-w-[1180px]' : 'min-w-[760px]'}`}>
            <thead>
              <tr className="text-xs text-[#4b5563] border-b border-[#e3e7ec]">
                <th className="text-left font-semibold py-2 w-8">STT</th>
                <th className="text-left font-semibold py-2 px-1 min-w-[200px]"><Num n={1} />Tên sản phẩm</th>
                <th className="text-left font-semibold py-2 px-1 w-32"><Num n={2} />Kích thước</th>
                <th className="text-right font-semibold py-2 px-1 w-20"><Num n={3} />SL</th>
                {cost && <th className="text-right font-semibold py-2 px-1 w-32"><Num n={4} />Giá vốn (1sp)</th>}
                <th className="text-right font-semibold py-2 px-1 w-32"><Num n={cost ? 5 : 4} />Đơn giá (1sp)</th>
                <th className="text-right font-semibold py-2 px-2 w-28">Thành tiền</th>
                {cost && (
                  <>
                    <th className="text-right font-semibold py-2 px-2 w-24">Tiền lời (1sp)</th>
                    <th className="text-right font-semibold py-2 px-2 w-28">Tổng giá vốn</th>
                    <th className="text-right font-semibold py-2 px-2 w-28">Tổng tiền lời</th>
                    <th className="text-center font-semibold py-2 px-2 w-20">Biên LN</th>
                  </>
                )}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {calc.lines.map((l, idx) => (
                <tr key={l.id} className="border-b border-[#eef0f3] align-middle">
                  <td className="py-2 text-[#6b7280]">{idx + 1}</td>
                  <td className="py-1.5 px-1"><input list="q2-product-names" className={inputCls} disabled={!editable} value={l.name} onChange={(e) => setItem(l.id, { name: e.target.value })} /></td>
                  <td className="py-1.5 px-1"><input className={inputCls} disabled={!editable} value={l.size} placeholder="55x80" onChange={(e) => setItem(l.id, { size: e.target.value })} /></td>
                  <td className="py-1.5 px-1"><input type="number" min="0" className={`${inputCls} text-right`} disabled={!editable} value={l.quantity} onChange={(e) => setItem(l.id, { quantity: e.target.value === '' ? 0 : Number(e.target.value) })} /></td>
                  {cost && <td className="py-1.5 px-1"><MoneyInput value={l.unitCost} disabled={!editable} onChange={(v) => setItem(l.id, { unitCost: v })} /></td>}
                  <td className="py-1.5 px-1">
                    <MoneyInput value={l.unitPrice} disabled={!editable} onChange={(v) => setItem(l.id, { unitPrice: v })}
                      onKeyDown={(e) => { if (e.key === 'Enter' && idx === calc.lines.length - 1) { e.preventDefault(); addRow() } }} />
                  </td>
                  <td className="py-2 px-2 text-right font-medium">{fmtMoney(l.revenue)}</td>
                  {cost && (
                    <>
                      <td className={`py-2 px-2 text-right font-semibold ${l.profitUnit < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{fmtMoney(l.profitUnit)}</td>
                      <td className="py-2 px-2 text-right">{fmtMoney(l.cost)}</td>
                      <td className={`py-2 px-2 text-right font-semibold ${l.profit < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{fmtMoney(l.profit)}</td>
                      <td className="py-2 px-2 text-center">
                        {l.unitCost > 0 && l.revenue > 0 ? (
                          <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${l.marginAfter >= quote.minMargin ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {fmtPct(l.marginAfter, 1)}
                          </span>
                        ) : <span className="text-[#9ca3af]">—</span>}
                      </td>
                    </>
                  )}
                  <td className="py-2 text-right">
                    {editable && calc.lines.length > 1 && <button onClick={() => delRow(l.id)} className="text-gray-400 hover:text-red-600 text-lg leading-none" aria-label="Xoá dòng">&times;</button>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5 + (cost ? 1 : 0)} className="pt-3">
                  {editable && <Btn variant="sm" onClick={addRow}>+ Thêm sản phẩm</Btn>}
                </td>
                <td className="pt-3 px-2 text-right font-bold">{fmtMoney(calc.subtotal)}</td>
                <td colSpan={cost ? 5 : 1} />
              </tr>
            </tfoot>
          </table>
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
                    Tiền lời sau CK {fmtMoney(calc.profitAfter)} · mức tối thiểu {quote.minMargin}% · thuế thu hộ không tính vào lời
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
