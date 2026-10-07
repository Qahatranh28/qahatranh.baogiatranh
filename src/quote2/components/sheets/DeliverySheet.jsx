import { forwardRef, useMemo } from 'react'
import DocumentSheet from '../DocumentSheet.jsx'
import { Ed, NumEd, MoneyEd, DateEd, InlineAddress } from '../Ed.jsx'
import { fmtMoney, fmtNum, moneyToWords } from '../../lib/format.js'
import { DEFAULT_DELIVERY_INTRO, deliveryNotesOrDefault, fmtYmd, newDocItem } from '../../lib/docs.js'

const blank = '—'

// Phiếu giao hàng. editor: nếu có -> sửa trực tiếp trên tờ phiếu. { setData(updater) }
// data: { title, code, date, refCode, customerName, customerPhone, deliveryAddress, deliveryDate(yyyy-mm-dd),
//   receiver, items[{name,unit,quantity,unitPrice}], taxRate, collectAmount, note, confirmText }
const DeliverySheet = forwardRef(function DeliverySheet({ data, company, editor }, ref) {
  const edit = !!editor
  const items = useMemo(() => (edit ? data.items || [] : (data.items || []).filter((i) => (i.name || '').trim())), [data.items, edit])
  const total = items.reduce((t, i) => t + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0)
  const cols = 6 + (edit ? 1 : 0)
  const th = 'px-3 py-3 font-semibold'
  const taxRate = Math.max(0, Number(data.taxRate) || 0)
  const tax = Math.round(total * taxRate / 100)
  const grandTotal = total + tax
  const introText = data.introText ?? DEFAULT_DELIVERY_INTRO
  const deliveryNotes = deliveryNotesOrDefault(data.confirmText)

  const set = (patch) => editor.setData((d) => ({ ...d, ...patch }))
  const setItem = (id, p) => editor.setData((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...p } : i)) }))
  const addItem = () => editor.setData((d) => ({ ...d, items: [...d.items, newDocItem('delivery')] }))
  const delItem = (id) => editor.setData((d) => ({ ...d, items: d.items.length > 1 ? d.items.filter((i) => i.id !== id) : d.items }))

  // Ô thông tin chỉnh sửa trực tiếp trên phiếu.
  const fill = (k, ph, multiline) => edit
    ? <Ed value={data[k]} onChange={(v) => set({ [k]: v })} placeholder={ph} multiline={multiline} className="font-normal" />
    : <span>{data[k] || blank}</span>

  return (
    <DocumentSheet
      ref={ref}
      data={data}
      company={company}
      editor={editor}
      dateKey="deliveryDate"
      dateMode="ymd"
      title={data.title || 'PHIẾU GIAO HÀNG'}
      numberLabel="Số phiếu"
      showNumber={false}
      className="q2-delivery-sheet"
    >

          <section className="rounded-2xl bg-[#fdf3ef] px-5 py-4 grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-[12px] uppercase font-bold tracking-wide text-[#6b7280] mb-1">Bên mua</h2>
              <div className="text-[19px] font-extrabold leading-tight text-[#ff4f25]">{edit ? <Ed value={data.customerName} onChange={(v) => set({ customerName: v })} placeholder="Tên khách hàng" /> : (data.customerName || '—')}</div>
              {(edit || data.customerTaxCode) && <div className="mt-1 flex gap-1"><span className="shrink-0 font-bold">Mã số thuế:</span>{fill('customerTaxCode', 'mã số thuế')}</div>}
            </div>
            <div className="text-[13.5px]">
              <h2 className="text-[12px] uppercase font-bold tracking-wide text-[#6b7280] mb-1">Thông tin giao hàng</h2>
              <div className="min-w-0"><InlineAddress label="Địa chỉ giao:" value={data.deliveryAddress} onChange={(v) => set({ deliveryAddress: v })} edit={edit} /></div>
              <div className="flex gap-1"><span className="shrink-0 font-bold">Người nhận:</span>{fill('receiver', 'người nhận hàng')}</div>
              <div className="flex gap-1"><span className="shrink-0 font-bold">Số điện thoại:</span>{fill('customerPhone', 'số điện thoại')}</div>
              <div className="flex gap-1"><span className="shrink-0 font-bold">Ngày giao:</span><span>{edit
                ? <DateEd value={data.deliveryDate} onChange={(v) => set({ deliveryDate: v })} mode="ymd" className="font-normal" />
                : (data.deliveryDate ? fmtYmd(data.deliveryDate) : blank)}</span></div>
            </div>
          </section>

          {(edit || introText.trim()) && (
            <p className="italic text-[13px] text-[#4b5563]">
              {edit ? <Ed value={introText} onChange={(v) => set({ introText: v })} multiline placeholder="Câu xác nhận giao hàng" /> : introText}
            </p>
          )}

          <div className="rounded-xl overflow-hidden border border-[#f0d9d2]">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#ff4f25] text-white text-[12.5px]">
                  <th className={`${th} w-12 text-left`}>STT</th>
                  <th className={`${th} text-left`}>Sản phẩm</th>
                  <th className={`${th} w-20 text-center`}>ĐVT</th>
                  <th className={`${th} w-24 text-center`}>Số lượng</th>
                  <th className={`${th} w-36 text-right`}>Đơn giá<br />(VND)</th>
                  <th className={`${th} w-36 text-right`}>Thành tiền<br />(VND)</th>
                  {edit && <th className="q2-noprint w-6" />}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={cols} className="px-3 py-6 text-center text-[#9ca3af]">Chưa có sản phẩm</td></tr>
                ) : items.map((l, i) => (
                  <tr key={l.id || i} className={`border-t border-[#f3e4df] ${i % 2 ? 'bg-[#f4f4f4]' : 'bg-white'}`}>
                    <td className="px-3 py-2.5 text-[#6b7280]">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium">
                      {edit
                        ? <Ed value={l.name} onChange={(v) => setItem(l.id, { name: v })} className="break-words [overflow-wrap:anywhere]" multiline wrapText placeholder="Tên sản phẩm" />
                        : <div className="break-words [overflow-wrap:anywhere]">{l.name}</div>}
                      {edit
                        ? <Ed value={l.size || ''} onChange={(v) => setItem(l.id, { size: v })} className="text-xs text-gray-500" placeholder="Kích thước" />
                        : l.size && <div className="mt-0.5 text-xs font-normal text-gray-500">{l.size}</div>}
                    </td>
                    <td className="px-2 py-2.5 text-center">{edit
                      ? <Ed value={l.unit || 'Tấm'} onChange={(v) => setItem(l.id, { unit: v })} className="text-center" placeholder="ĐVT" />
                      : (l.unit || 'Tấm')}</td>
                    <td className="px-3 py-2.5 text-center font-bold">{edit ? <NumEd value={l.quantity} onChange={(v) => setItem(l.id, { quantity: v })} className="text-center font-bold" /> : fmtNum(l.quantity)}</td>
                    <td className="px-3 py-2.5 text-right">{edit ? <MoneyEd value={l.unitPrice} onChange={(v) => setItem(l.id, { unitPrice: v })} className="text-right w-24" /> : fmtMoney(l.unitPrice)}</td>
                    <td className="px-3 py-2.5 text-right font-bold">{fmtMoney((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0))}</td>
                    {edit && <td className="q2-noprint pr-2 text-right">{items.length > 1 && <button type="button" onClick={() => delItem(l.id)} className="text-gray-300 hover:text-red-600 text-lg leading-none" title="Xoá dòng">×</button>}</td>}
                  </tr>
                ))}
                <tr className="border-t border-[#f3e4df] bg-[#fdf6f3]">
                  <td colSpan={3} className="px-3 py-2.5 font-bold text-right">Tổng số lượng</td>
                  <td className="px-3 py-2.5 text-center font-extrabold">{fmtNum(items.reduce((t, i) => t + (Number(i.quantity) || 0), 0))}</td>
                  <td className="px-3 py-2.5 text-right font-bold">Tổng giá trị</td>
                  <td className="px-3 py-2.5 text-right font-extrabold">{fmtMoney(total)}</td>
                  {edit && <td className="q2-noprint" />}
                </tr>
              </tbody>
            </table>
          </div>
          {edit && <div className="q2-noprint -mt-2"><button type="button" onClick={addItem} className="text-xs font-semibold text-[#c2410c] border border-dashed border-[#ffc7b6] rounded-lg px-3 py-1.5 hover:bg-[#fff4ef]">+ Thêm sản phẩm</button></div>}

          <section className="q2-delivery-summary grid grid-cols-[.9fr_1.1fr] gap-5 items-start">
            <div className="space-y-4">
              <div className="rounded-xl bg-[#fdf3ef] px-4 py-3">
                <h2 className="text-[11px] uppercase tracking-wide text-[#6b7280] font-bold">Tổng tiền bằng chữ</h2>
                <p className="font-bold text-[14px]">{moneyToWords(grandTotal)}.</p>
              </div>
              {(edit || data.note?.trim() || deliveryNotes.trim()) && (
                <div className="text-[13px] leading-relaxed">
                  <h2 className="font-bold text-[15px] mb-1">Lưu ý</h2>
                  {(edit || data.note?.trim()) && <div className="whitespace-pre-line">{edit ? <Ed value={data.note} onChange={(v) => set({ note: v })} multiline placeholder="Ghi chú giao hàng" /> : data.note.trim()}</div>}
                  {(edit || deliveryNotes.trim()) && <div className="whitespace-pre-line">{edit ? <Ed value={deliveryNotes} onChange={(v) => set({ confirmText: v })} multiline placeholder="Lưu ý khi bàn giao" /> : deliveryNotes.trim()}</div>}
                </div>
              )}
            </div>
            <section className="rounded-2xl bg-[#fafafa] px-6 py-4 space-y-1.5">
              <div className="flex justify-between items-center gap-3 py-1.5 text-[14px]">
                <span className="text-[#4b5563]">Cộng tiền hàng (chưa bao gồm thuế):</span>
                <b className="whitespace-nowrap">{fmtMoney(total)}</b>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-[14px]">
                <span className="text-[#4b5563]">Thuế bán hàng: {edit
                  ? <span className="inline-flex items-center whitespace-nowrap"><NumEd value={taxRate} onChange={(v) => set({ taxRate: Math.max(0, v) })} className="q2-line w-10 text-right" />%</span>
                  : `${fmtNum(taxRate)}%`}</span>
                <b className="whitespace-nowrap">{fmtMoney(tax)}</b>
              </div>
              <div className="rounded-xl bg-[#ff4f25] px-4 py-3 mt-2">
                <div className="flex items-center justify-between gap-3 text-white">
                  <span className="font-bold text-[14px]">Tổng tiền thanh toán<br />(đã gồm thuế):</span>
                  <span className="text-[25px] font-extrabold whitespace-nowrap">{fmtMoney(grandTotal)}</span>
                </div>
              </div>
            </section>
          </section>

          <footer className="pt-2">
            <p className="text-right italic font-semibold mb-5">{data.deliveryDate
              ? `TP.HCM, ngày ${data.deliveryDate.slice(8, 10)} tháng ${data.deliveryDate.slice(5, 7)} năm ${data.deliveryDate.slice(0, 4)}`
              : ''}</p>
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <p className="font-bold">Đại diện Bên Bán</p>
                <p className="font-bold">{company.name}</p>
                <p className="text-[12px] italic text-[#6b7280]">(Ký và ghi rõ họ tên)</p>
                <div className="h-16" />
              </div>
              <div>
                <p className="font-bold">Đại diện Bên Mua</p>
                <p className="font-bold uppercase">{data.customerName}</p>
                <p className="text-[12px] italic text-[#6b7280]">(Ký và ghi rõ họ tên)</p>
                <div className="h-16" />
              </div>
            </div>
          </footer>
    </DocumentSheet>
  )
})
export default DeliverySheet
