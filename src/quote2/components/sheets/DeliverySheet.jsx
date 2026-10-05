import { forwardRef, useMemo } from 'react'
import CompanyHeader from '../CompanyHeader.jsx'
import FitWidth from '../FitWidth.jsx'
import { Ed, NumEd, MoneyEd, DateEd } from '../Ed.jsx'
import { fmtMoney, fmtNum, moneyToWords } from '../../lib/format.js'
import { fmtYmd, newDocItem } from '../../lib/docs.js'

const blank = '……………………………'

// Phiếu giao hàng. editor: nếu có -> sửa trực tiếp trên tờ phiếu. { setData(updater) }
// data: { title, code, date, refCode, customerName, customerPhone, deliveryAddress, deliveryDate(yyyy-mm-dd),
//   receiver, shipper, items[{name,size,quantity,unitPrice,note}], showPrices, collectAmount, note, confirmText }
const DeliverySheet = forwardRef(function DeliverySheet({ data, company, editor }, ref) {
  const edit = !!editor
  const items = useMemo(() => (edit ? data.items || [] : (data.items || []).filter((i) => (i.name || '').trim())), [data.items, edit])
  const total = items.reduce((t, i) => t + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0)
  const cod = Number(data.collectAmount) || 0
  const showPrices = !!data.showPrices
  const cols = showPrices ? 7 : 5
  const th = 'px-3 py-3 font-semibold'

  const set = (patch) => editor.setData((d) => ({ ...d, ...patch }))
  const setItem = (id, p) => editor.setData((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...p } : i)) }))
  const addItem = () => editor.setData((d) => ({ ...d, items: [...d.items, newDocItem('delivery')] }))
  const delItem = (id) => editor.setData((d) => ({ ...d, items: d.items.length > 1 ? d.items.filter((i) => i.id !== id) : d.items }))
  const setCompany = (k, v) => editor.setData((d) => ({ ...d, company: { ...d.company, [k]: v } }))

  // ô thông tin: sửa được, để trống thì in ra đường chấm để viết tay
  const fill = (k, ph, multiline) => edit
    ? <Ed value={data[k]} onChange={(v) => set({ [k]: v })} placeholder={ph} multiline={multiline} className="q2-line font-semibold" />
    : <b>{data[k] || blank}</b>

  return (
    <div className="max-w-[960px] mx-auto">
      <FitWidth width={960}>
        <article ref={ref} className={`q2-sheet ${edit ? 'q2-edit' : ''} w-[960px] bg-white shadow-xl px-10 py-9 text-[13px] text-[#1a1f2c] leading-relaxed space-y-5`}>
          <CompanyHeader
            company={company} code={data.code} date={data.date} title={data.title || 'PHIẾU GIAO HÀNG'} numberLabel="Số phiếu"
            edit={edit} onCompany={setCompany} onTitle={(v) => set({ title: v })} onCode={(v) => set({ code: v })} onDate={(v) => set({ date: v })}
          />

          <section className="rounded-2xl bg-[#fdf1ed] px-6 py-4 grid grid-cols-[1.25fr_1fr] gap-6">
            <div className="flex gap-4 min-w-0">
              <span className="w-12 h-12 rounded-full bg-[#ffd9cf] flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#ff4f25"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" /></svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-[#6b7280] leading-none mb-1">Khách hàng / Người nhận</p>
                <div className="text-[22px] font-extrabold leading-tight">{edit ? <Ed value={data.customerName} onChange={(v) => set({ customerName: v })} placeholder="Tên khách hàng" /> : (data.customerName || '—')}</div>
                <div className="mt-1.5 flex gap-1.5"><span className="text-[#6b7280] shrink-0">Điện thoại:</span>{fill('customerPhone', 'số điện thoại')}</div>
                <div className="flex gap-1.5"><span className="text-[#6b7280] shrink-0">Địa chỉ giao:</span>{fill('deliveryAddress', 'địa chỉ giao hàng', true)}</div>
              </div>
            </div>
            <dl className="space-y-1.5 text-[13.5px] self-center">
              <div className="flex gap-2"><dt className="w-36 text-[#6b7280] shrink-0">Ngày giao:</dt><dd className="font-semibold flex-1">{edit ? <DateEd value={data.deliveryDate} onChange={(v) => set({ deliveryDate: v })} mode="ymd" className="q2-line font-semibold" /> : (data.deliveryDate ? fmtYmd(data.deliveryDate) : blank)}</dd></div>
              <div className="flex gap-2"><dt className="w-36 text-[#6b7280] shrink-0">Người giao hàng:</dt><dd className="flex-1">{fill('shipper', 'người giao hàng')}</dd></div>
              <div className="flex gap-2"><dt className="w-36 text-[#6b7280] shrink-0">Người nhận hàng:</dt><dd className="flex-1">{fill('receiver', 'người nhận hàng')}</dd></div>
              <div className="flex gap-2"><dt className="w-36 text-[#6b7280] shrink-0">Theo báo giá số:</dt><dd className="font-semibold flex-1">{edit ? <Ed value={data.refCode} onChange={(v) => set({ refCode: v })} placeholder="mã báo giá" /> : (data.refCode || '—')}</dd></div>
            </dl>
          </section>

          {edit && (
            <label className="q2-noprint flex items-center gap-2 text-xs text-[#6b7280] -mb-2">
              <input type="checkbox" checked={showPrices} onChange={(e) => set({ showPrices: e.target.checked })} /> Hiện đơn giá & thành tiền trên phiếu
            </label>
          )}

          <div className="rounded-xl overflow-hidden border border-[#f0d9d2]">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#ff4f25] text-white text-[12.5px]">
                  <th className={`${th} w-12 text-left`}>STT</th>
                  <th className={`${th} text-left`}>Tên sản phẩm</th>
                  <th className={`${th} w-32 text-center`}>Kích thước (cm)</th>
                  <th className={`${th} w-24 text-center`}>Số lượng</th>
                  {showPrices && <th className={`${th} w-36 text-right`}>Đơn giá</th>}
                  {showPrices && <th className={`${th} w-36 text-right`}>Thành tiền</th>}
                  <th className={`${th} w-48 text-left`}>Ghi chú</th>
                  {edit && <th className="q2-noprint w-6" />}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={cols} className="px-3 py-6 text-center text-[#9ca3af]">Chưa có sản phẩm</td></tr>
                ) : items.map((l, i) => (
                  <tr key={l.id || i} className="border-t border-[#f3e4df]">
                    <td className="px-3 py-2.5 text-[#6b7280]">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium">{edit ? <Ed value={l.name} onChange={(v) => setItem(l.id, { name: v })} multiline placeholder="Tên sản phẩm" /> : l.name}</td>
                    <td className="px-3 py-2.5 text-center">{edit ? <Ed value={l.size} onChange={(v) => setItem(l.id, { size: v })} className="text-center" placeholder="55x80" /> : l.size}</td>
                    <td className="px-3 py-2.5 text-center font-bold">{edit ? <NumEd value={l.quantity} onChange={(v) => setItem(l.id, { quantity: v })} className="text-center font-bold" /> : fmtNum(l.quantity)}</td>
                    {showPrices && <td className="px-3 py-2.5 text-right">{edit ? <span className="flex items-baseline justify-end gap-1"><MoneyEd value={l.unitPrice} onChange={(v) => setItem(l.id, { unitPrice: v })} className="text-right w-24" /><span>đ</span></span> : fmtMoney(l.unitPrice)}</td>}
                    {showPrices && <td className="px-3 py-2.5 text-right font-bold">{fmtMoney((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0))}</td>}
                    <td className="px-3 py-2.5">{edit ? <Ed value={l.note} onChange={(v) => setItem(l.id, { note: v })} multiline placeholder="ghi chú" /> : l.note}</td>
                    {edit && <td className="q2-noprint pr-2 text-right">{items.length > 1 && <button type="button" onClick={() => delItem(l.id)} className="text-gray-300 hover:text-red-600 text-lg leading-none" title="Xoá dòng">×</button>}</td>}
                  </tr>
                ))}
                <tr className="border-t border-[#f3e4df] bg-[#fdf6f3]">
                  <td colSpan={3} className="px-3 py-2.5 font-bold text-right">Tổng số lượng</td>
                  <td className="px-3 py-2.5 text-center font-extrabold">{fmtNum(items.reduce((t, i) => t + (Number(i.quantity) || 0), 0))}</td>
                  {showPrices ? <><td className="px-3 py-2.5 text-right font-bold">Tổng giá trị</td><td className="px-3 py-2.5 text-right font-extrabold">{fmtMoney(total)}</td><td /></> : <td />}
                  {edit && <td className="q2-noprint" />}
                </tr>
              </tbody>
            </table>
          </div>
          {edit && <div className="q2-noprint -mt-2"><button type="button" onClick={addItem} className="text-xs font-semibold text-[#c2410c] border border-dashed border-[#ffc7b6] rounded-lg px-3 py-1.5 hover:bg-[#fff4ef]">+ Thêm sản phẩm</button></div>}

          {(edit || data.note?.trim()) && (
            <div className={`flex gap-2 ${edit && !data.note?.trim() ? 'q2-empty' : ''}`}>
              <b className="shrink-0">Ghi chú giao hàng:</b>
              {edit ? <Ed value={data.note} onChange={(v) => set({ note: v })} multiline placeholder="Ghi chú giao hàng" /> : <span className="whitespace-pre-line">{data.note.trim()}</span>}
            </div>
          )}

          {(cod > 0 || edit) && (
            <div className={`rounded-2xl bg-[#ff4f25] text-white px-6 py-4 flex items-center justify-between gap-4 ${cod > 0 ? '' : 'q2-empty'}`}>
              <div>
                <p className="font-bold text-[15px]">Số tiền cần thu khi giao hàng</p>
                <p className="italic text-[12.5px] opacity-90">{cod > 0 ? moneyToWords(cod) : 'Nhập số tiền thu hộ (để 0 nếu không thu)'}</p>
              </div>
              {edit
                ? <span className="flex items-center gap-1"><MoneyEd value={cod} onChange={(v) => set({ collectAmount: v })} className="text-right w-[220px] text-[28px] font-extrabold" /><span className="text-[28px] font-extrabold leading-none">đ</span></span>
                : <span className="text-[28px] font-extrabold leading-none whitespace-nowrap">{fmtMoney(cod)}</span>}
            </div>
          )}

          {(edit || data.confirmText?.trim()) && (
            <div className={`italic text-[#4b5563] ${edit && !data.confirmText?.trim() ? 'q2-empty' : ''}`}>
              {edit ? <Ed value={data.confirmText} onChange={(v) => set({ confirmText: v })} multiline placeholder="Lời nhắc dưới bảng" /> : data.confirmText.trim()}
            </div>
          )}

          <footer className="grid grid-cols-3 text-center pt-2">
            {[['Người lập phiếu', ''], ['Người giao hàng', data.shipper], ['Người nhận hàng', data.receiver]].map(([tt, name]) => (
              <div key={tt}>
                <p className="font-semibold">{tt}</p>
                <p className="text-[11px] text-[#6b7280]">(Ký, ghi rõ họ tên)</p>
                <div className="h-16" />
                {name && <p className="font-semibold">{name}</p>}
              </div>
            ))}
          </footer>
        </article>
      </FitWidth>
    </div>
  )
})
export default DeliverySheet
