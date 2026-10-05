import { forwardRef, useMemo } from 'react'
import CompanyHeader from '../CompanyHeader.jsx'
import TermsBlock from '../TermsBlock.jsx'
import PaymentBlock from '../PaymentBlock.jsx'
import FitWidth from '../FitWidth.jsx'
import { Ed, NumEd, MoneyEd } from '../Ed.jsx'
import { parseTerms } from '../../lib/richText.js'
import { docTotals, newDocItem } from '../../lib/docs.js'
import { fmtMoney, fmtNum, moneyToWords } from '../../lib/format.js'

// Tờ báo giá (dùng chung cho "Xem trước báo giá" và "Phiếu báo giá"). Bề rộng cố định 960px, tự thu nhỏ vừa màn hình.
// data: { code, date, customerName, items, discountPercent, taxRate, note, title?, overrides?, transferNote? }
// editor: nếu có -> chế độ SỬA TRỰC TIẾP trên tờ phiếu. { setData(updater), onEditTerms() }
const QuoteSheet = forwardRef(function QuoteSheet({ data, company, terms, editor }, ref) {
  const edit = !!editor
  const t = useMemo(() => docTotals(data), [data])
  const calc = t.calc
  const rows = edit ? calc.lines : calc.lines.filter((l) => l.name || l.unitPrice)
  const hasTerms = parseTerms(terms?.body).length > 0

  const set = (patch) => editor.setData((d) => ({ ...d, ...patch }))
  const setItem = (id, p) => editor.setData((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...p } : i)) }))
  const addItem = () => editor.setData((d) => ({ ...d, items: [...d.items, newDocItem('quote')] }))
  const delItem = (id) => editor.setData((d) => ({ ...d, items: d.items.length > 1 ? d.items.filter((i) => i.id !== id) : d.items }))
  const setCompany = (k, v) => editor.setData((d) => ({ ...d, company: { ...d.company, [k]: v } }))
  const setOv = (k, v) => editor.setData((d) => ({ ...d, overrides: { ...(d.overrides || {}), [k]: v } }))
  const clrOv = (k) => editor.setData((d) => { const o = { ...(d.overrides || {}) }; delete o[k]; return { ...d, overrides: o } })

  const reset = (k, light) => t.overridden[k] && edit
    ? <button type="button" onClick={() => clrOv(k)} title="Tính lại theo sản phẩm" className={`q2-noprint text-[11px] font-semibold underline ${light ? 'text-white/90' : 'text-[#c2410c]'}`}>↺ tính lại</button>
    : null
  // ô tiền có thể ghi đè
  const money = (k, value, big) => edit ? (
    <span className="flex items-center justify-end gap-1.5">
      {reset(k, big)}
      <MoneyEd value={value} onChange={(v) => setOv(k, v)} className={`text-right font-bold ${big ? 'w-[150px] text-[26px] font-extrabold' : 'w-32'} ${t.overridden[k] ? 'q2-overridden' : ''}`} />
      <span className={big ? 'text-[26px] font-extrabold leading-none' : 'font-bold'}>đ</span>
    </span>
  ) : <span className={big ? 'text-[26px] font-extrabold leading-none whitespace-nowrap' : 'font-bold'}>{fmtMoney(value)}</span>

  return (
    <div className="max-w-[960px] mx-auto">
      <FitWidth width={960}>
        <article ref={ref} className={`q2-sheet ${edit ? 'q2-edit' : ''} w-[960px] bg-white shadow-xl px-10 py-9 text-[13px] text-[#1a1f2c] leading-relaxed space-y-5`}>
          <CompanyHeader
            company={company} code={data.code} date={data.date} title={data.title}
            edit={edit} onCompany={setCompany} onTitle={(v) => set({ title: v })} onCode={(v) => set({ code: v })} onDate={(v) => set({ date: v })}
          />

          <section className="rounded-2xl bg-[#fdf1ed] px-6 py-4 flex items-center gap-4">
            <span className="w-12 h-12 rounded-full bg-[#ffd9cf] flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ff4f25"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" /></svg>
            </span>
            <div className="flex-1">
              <p className="text-[12px] text-[#6b7280] leading-none mb-1">Khách hàng</p>
              <div className="text-[22px] font-extrabold leading-tight text-[#1a1f2c]">
                {edit ? <Ed value={data.customerName} onChange={(v) => set({ customerName: v })} placeholder="Tên khách hàng" /> : (data.customerName || '—')}
              </div>
            </div>
          </section>

          <div className="rounded-xl overflow-hidden border border-[#f0d9d2]">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#ff4f25] text-white text-[12.5px]">
                  <th className="w-12 px-3 py-3 text-left font-semibold">STT</th>
                  <th className="px-3 py-3 text-left font-semibold">Tên sản phẩm</th>
                  <th className="w-32 px-3 py-3 text-center font-semibold">Kích thước (cm)</th>
                  <th className="w-24 px-3 py-3 text-center font-semibold">Số lượng</th>
                  <th className="w-36 px-3 py-3 text-right font-semibold">Đơn giá (1sp)</th>
                  <th className="w-40 px-3 py-3 text-right font-semibold leading-tight">Thành tiền<br /><span className="font-normal opacity-90">(theo số lượng)</span></th>
                  {edit && <th className="q2-noprint w-6" />}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-[#9ca3af]">Chưa có sản phẩm</td></tr>
                ) : rows.map((l, i) => (
                  <tr key={l.id} className="border-t border-[#f3e4df]">
                    <td className="px-3 py-2.5 text-[#6b7280]">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium">{edit ? <Ed value={l.name} onChange={(v) => setItem(l.id, { name: v })} multiline placeholder="Tên sản phẩm" /> : l.name}</td>
                    <td className="px-3 py-2.5 text-center">{edit ? <Ed value={l.size} onChange={(v) => setItem(l.id, { size: v })} className="text-center" placeholder="55x80" /> : l.size}</td>
                    <td className="px-3 py-2.5 text-center">{edit ? <NumEd value={l.quantity} onChange={(v) => setItem(l.id, { quantity: v })} className="text-center" /> : fmtNum(l.quantity)}</td>
                    <td className="px-3 py-2.5 text-right">
                      {edit
                        ? <span className="flex items-baseline justify-end gap-1"><MoneyEd value={l.unitPrice} onChange={(v) => setItem(l.id, { unitPrice: v })} className="text-right w-24" /><span>đ</span></span>
                        : fmtMoney(l.unitPrice)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold">{fmtMoney(l.revenue)}</td>
                    {edit && <td className="q2-noprint pr-2 text-right">{rows.length > 1 && <button type="button" onClick={() => delItem(l.id)} className="text-gray-300 hover:text-red-600 text-lg leading-none" title="Xoá dòng">×</button>}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {edit && <div className="q2-noprint -mt-2"><button type="button" onClick={addItem} className="text-xs font-semibold text-[#c2410c] border border-dashed border-[#ffc7b6] rounded-lg px-3 py-1.5 hover:bg-[#fff4ef]">+ Thêm sản phẩm</button></div>}

          {(edit || data.note?.trim()) && (
            <div className={`flex gap-2 ${edit && !data.note?.trim() ? 'q2-empty' : ''}`}>
              <b className="shrink-0">Ghi chú:</b>
              {edit ? <Ed value={data.note} onChange={(v) => set({ note: v })} multiline placeholder="Ghi chú (không bắt buộc)" /> : <span className="whitespace-pre-line">{data.note.trim()}</span>}
            </div>
          )}

          <div className={`grid gap-5 items-start ${hasTerms ? 'grid-cols-[1.2fr_1fr]' : 'grid-cols-[1fr_1fr]'}`}>
            {hasTerms ? (
              <div className="relative">
                <TermsBlock terms={terms} compact />
                {edit && <button type="button" onClick={editor.onEditTerms} className="q2-noprint absolute top-3 right-3 text-xs font-semibold bg-white border border-[#ffc7b6] text-[#c2410c] rounded-lg px-2.5 py-1 hover:bg-[#fff4ef]">✎ Sửa điều khoản</button>}
              </div>
            ) : (
              <div className="q2-noprint border border-dashed border-[#cfd4da] rounded-2xl p-4 text-center text-xs text-[#6b7280]">
                Chưa có điều khoản. {edit && <button type="button" onClick={editor.onEditTerms} className="text-[#c2410c] font-semibold hover:underline">+ Thêm điều khoản</button>}
              </div>
            )}

            <div className="px-1">
              <dl className="text-[14px]">
                <div className="flex justify-between items-center py-3 border-b border-[#eceef1]"><dt className="text-[#374151]">Tổng tiền:</dt><dd>{money('subtotal', t.subtotal)}</dd></div>
                <div className="flex justify-between items-center py-3 border-b border-[#eceef1]">
                  <dt className="text-[#374151]">Chiết khấu:</dt>
                  <dd className="font-bold">{edit ? <span className="flex items-center gap-1"><NumEd value={data.discountPercent} onChange={(v) => set({ discountPercent: v })} className="text-right w-14 font-bold" />%</span> : `${fmtNum(calc.discountPercent)}%`}</dd>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#eceef1]"><dt className="text-[#374151]">Tổng tiền sau chiết khấu:</dt><dd>{money('afterDiscount', t.afterDiscount)}</dd></div>
                <div className="flex justify-between items-center py-3 border-b border-[#eceef1]">
                  <dt className="text-[#374151] flex items-center">VAT (
                    {edit ? <NumEd value={data.taxRate} onChange={(v) => set({ taxRate: v })} className="text-center w-7" /> : calc.taxRate}
                    %):</dt>
                  <dd>{money('tax', t.tax)}</dd>
                </div>
              </dl>
              <div className="mt-3 rounded-2xl bg-[#ff4f25] text-white px-5 py-4 flex items-center justify-between gap-3">
                <span className="font-bold text-[14px] leading-tight shrink-0 whitespace-nowrap">Tổng số tiền<br />thanh toán:</span>
                {money('grand', t.grand, true)}
              </div>
              <p className="italic text-[12.5px] mt-2 text-[#4b5563]"><span className="text-[#6b7280]">Bằng chữ:</span> {moneyToWords(t.grand)}</p>
            </div>
          </div>

          <PaymentBlock company={company} code={data.code} edit={edit} onCompany={setCompany} transferNote={data.transferNote} onNote={(v) => set({ transferNote: v })} />

          <footer className="grid grid-cols-2 text-center pt-2">
            <div><p className="font-semibold">Khách hàng xác nhận</p><p className="text-[11px] text-[#6b7280]">(Ký, ghi rõ họ tên)</p><div className="h-16" /></div>
            <div><p className="font-semibold">Đại diện {company.brandName || company.name}</p><p className="text-[11px] text-[#6b7280]">(Ký, ghi rõ họ tên)</p><div className="h-16" /></div>
          </footer>
        </article>
      </FitWidth>
    </div>
  )
})
export default QuoteSheet
