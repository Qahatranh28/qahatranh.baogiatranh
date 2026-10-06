import { forwardRef, useMemo } from 'react'
import FitWidth from '../FitWidth.jsx'
import { DateEd, Ed, ImgEd, InlineAddress, MoneyEd, NumEd } from '../Ed.jsx'
import { DEFAULT_ORDER_QUOTE_CONTENT, docTotals, newDocItem } from '../../lib/docs.js'
import { fmtDate, fmtMoney, fmtNum, moneyToWords } from '../../lib/format.js'

const ContactIcon = ({ children }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ff4f25" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
    {children}
  </svg>
)

const OrderQuoteSheet = forwardRef(function OrderQuoteSheet({ data, company, editor }, ref) {
  const edit = !!editor
  const totals = useMemo(() => docTotals(data), [data])
  const content = { ...DEFAULT_ORDER_QUOTE_CONTENT, ...data }
  const lines = edit ? totals.calc.lines : totals.calc.lines.filter((line) => line.name || line.unitPrice)
  const depositPercent = Math.min(100, Math.max(0, Number(content.depositPercent) || 0))
  const depositAmount = Math.round(totals.grand * depositPercent / 100)
  const remainingAmount = totals.grand - depositAmount
  const date = data.date ? fmtDate(data.date) : ''

  const set = (patch) => editor.setData((d) => ({ ...d, ...patch }))
  const setCompany = (key, value) => editor.setData((d) => ({ ...d, company: { ...d.company, [key]: value } }))
  const setItem = (id, patch) => editor.setData((d) => ({
    ...d,
    items: d.items.map((item) => item.id === id ? { ...item, ...patch } : item),
  }))
  const addItem = () => editor.setData((d) => ({
    ...d,
    items: [...d.items, { ...newDocItem('quote'), unit: 'Tấm' }],
  }))
  const removeItem = (id) => editor.setData((d) => ({
    ...d,
    items: d.items.length > 1 ? d.items.filter((item) => item.id !== id) : d.items,
  }))
  const changePercent = (key, value) => set({ [key]: Math.max(0, Math.min(100, Number(value) || 0)) })
  const field = (value, onChange, className = '', multiline = false, placeholder = '') => edit
    ? <Ed value={value} onChange={onChange} className={className} multiline={multiline} placeholder={placeholder} />
    : value
  const inlineField = (value, onChange, className = '', placeholder = '') => edit
    ? <input
      type="text"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`q2-ed q2-inline-input ${className}`}
      style={{ width: `${Math.max(4, String(value || placeholder || '').length + 3)}ch`, maxWidth: '100%' }}
    />
    : value
  const percentage = (key, value) => edit
    ? <span className="inline-flex items-center whitespace-nowrap"><NumEd value={value} onChange={(next) => changePercent(key, next)} className="q2-inline-input !inline-block shrink-0 text-center" style={{ width: `${Math.max(2, String(value ?? '').length)}ch` }} />%</span>
    : `${fmtNum(value)}%`
  const amount = (value, large = false) => (
    <span className={`font-bold whitespace-nowrap ${large ? 'text-[26px] font-extrabold' : ''}`}>{fmtMoney(value)}</span>
  )
  const totalRow = (label, value) => (
    <div className="flex justify-between items-center gap-3 py-1.5 text-[13px]">
      <span className="text-[#4b5563]">{label}</span>
      {amount(value)}
    </div>
  )

  return (
    <div className="max-w-[960px] mx-auto">
      <FitWidth width={960}>
        <article ref={ref} className={`q2-sheet q2-order-quote-sheet ${edit ? 'q2-edit' : ''} w-[960px] bg-white shadow-xl px-7 py-7 text-[13px] text-[#1a1f2c] leading-relaxed space-y-4`}>
          <header className="grid grid-cols-[120px_minmax(0,1.55fr)_minmax(0,.95fr)_190px] gap-3 items-start min-h-[190px]">
            <div className="flex flex-col items-center">
              {edit
                ? <ImgEd value={company.logoUrl} onChange={(value) => setCompany('logoUrl', value)} edit label="Logo" max={700} className="w-[120px] h-[118px]" imgClassName="w-[120px] h-[118px] object-contain" />
                : company.logoUrl && <img src={company.logoUrl} alt="" className="w-[120px] h-[118px] object-contain" />}
            </div>
            <div className="text-[14px] leading-[1.4]">
              <div className="font-bold">{inlineField(company.name, (value) => setCompany('name', value), 'font-bold')}</div>
              <div className="mt-1">{field(company.description, (value) => setCompany('description', value), '', true)}</div>
              {(company.highlights || edit) && <ul className="mt-1">
                {String(company.highlights || '').split('\n').filter((line, index, all) => line || (edit && index === all.length - 1)).map((line, index) => (
                  <li key={index} className="flex gap-1">
                    <span className="text-[#ff4f25]">•</span>
                    <span className="flex-1">{field(line, (value) => setCompany('highlights', String(company.highlights).split('\n').map((item, i) => i === index ? value : item).join('\n')), '', true)}</span>
                    {edit && <button type="button" onClick={() => setCompany('highlights', String(company.highlights).split('\n').filter((_, i) => i !== index).join('\n'))} className="q2-noprint opacity-0 hover:opacity-100 text-gray-400 hover:text-red-600">×</button>}
                  </li>
                ))}
                {edit && <li className="q2-noprint"><button type="button" onClick={() => setCompany('highlights', `${String(company.highlights || '').trimEnd()}\n`)} className="text-[10px] text-[#c2410c]">+ Thêm nội dung</button></li>}
              </ul>}
            </div>
            <div className="text-[13px] leading-[1.5] space-y-2">
              {(edit || company.website) && <div className="flex gap-2"><ContactIcon><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></ContactIcon><span className="min-w-0"><b>Website: </b>{inlineField(company.website, (value) => setCompany('website', value))}</span></div>}
              {(edit || company.address) && <div className="flex gap-2"><ContactIcon><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></ContactIcon><span className="q2-company-address min-w-0 flex-1"><InlineAddress value={company.address} onChange={(value) => setCompany('address', value)} edit={edit} /></span></div>}
              {(edit || company.hotline) && <div className="flex gap-2"><ContactIcon><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></ContactIcon><span className="min-w-0"><b>Hotline/Zalo: </b>{inlineField(company.hotline, (value) => setCompany('hotline', value))}</span></div>}
              {(edit || company.email) && <div className="q2-order-email flex gap-2"><ContactIcon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></ContactIcon><span className="min-w-0 whitespace-nowrap"><b>Email: </b>{inlineField(company.email, (value) => setCompany('email', value))}</span></div>}
            </div>
            <div className="text-[11px] leading-tight">
              <div className="font-extrabold text-[20px]">{inlineField(data.title || 'BÁO GIÁ', (value) => set({ title: value }), 'font-extrabold text-[20px]')}</div>
              <div className="font-extrabold text-[20px] text-[#ff4f25]">{inlineField(content.orderTitle, (value) => set({ orderTitle: value }), 'font-extrabold text-[20px] text-[#ff4f25]')}</div>
              <div className="mt-1"><b>Ngày: </b>{edit
                ? <DateEd value={data.date} onChange={(value) => set({ date: value })} className="!inline-block !w-auto font-bold" />
                : date}</div>
            </div>
          </header>

          <section className="rounded-2xl bg-[#fdf3ef] px-6 py-4 text-[14px] leading-relaxed">
            <div className="text-[12px] uppercase font-bold tracking-wide text-[#6b7280]">Kính gửi</div>
            <div className="font-bold text-[17px] text-[#ff4f25]">{inlineField(data.customerName, (value) => set({ customerName: value }), 'font-bold text-[#ff4f25]', 'Tên khách hàng')}</div>
            <div><b>Mã số thuế: </b>{inlineField(content.customerTaxCode, (value) => set({ customerTaxCode: value }), 'font-semibold', 'Mã số thuế')}</div>
            <div><b>Điện thoại: </b>{inlineField(data.customerPhone, (value) => set({ customerPhone: value }), 'font-semibold', 'Số điện thoại')}</div>
          </section>

          <p className="text-[14px] leading-relaxed">{field(content.introText, (value) => set({ introText: value }), '', true)}</p>

          <div className="rounded-xl overflow-hidden">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#ff4f25] text-white">
                  <th className="w-10 px-2 py-2.5 text-left font-semibold">STT</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Sản phẩm</th>
                  <th className="w-16 px-2 py-2.5 text-center font-semibold">ĐVT</th>
                  <th className="w-10 px-1 py-2.5 text-center font-semibold">SL</th>
                  <th className="w-28 px-3 py-2.5 text-right font-semibold">Đơn giá<br />(VND)</th>
                  <th className="w-32 px-3 py-2.5 text-right font-semibold">Thành tiền<br />(VND)</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={line.id} className={`${index % 2 ? 'bg-[#f4f4f4]' : 'bg-white'}`}>
                    <td className="px-3 py-2.5 text-center">{index + 1}</td>
                    <td className="px-3 py-2.5 font-medium">
                      <div className="flex items-start gap-1">
                        <div className="flex-1 min-w-0">
                          {edit
                            ? <Ed value={line.name} onChange={(value) => setItem(line.id, { name: value })} className="break-words [overflow-wrap:anywhere]" multiline wrapText placeholder="Tên sản phẩm" />
                            : <div className="break-words [overflow-wrap:anywhere]">{line.name}</div>}
                          {edit
                            ? <Ed value={line.size} onChange={(value) => setItem(line.id, { size: value })} className="text-xs text-gray-500" placeholder="Kích thước" />
                            : line.size && <div className="mt-0.5 text-xs font-normal text-gray-500">{line.size}</div>}
                        </div>
                        {edit && lines.length > 1 && <button type="button" onClick={() => removeItem(line.id)} className="q2-noprint text-gray-400 hover:text-red-600 text-lg leading-none" title="Xoá dòng">×</button>}
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-center">{field(line.unit || 'Tấm', (value) => setItem(line.id, { unit: value }), 'text-center', false, 'ĐVT')}</td>
                    <td className="px-2 py-2.5 text-center">{edit
                      ? <NumEd value={line.quantity} onChange={(value) => setItem(line.id, { quantity: value })} className="!inline-block !w-8 text-center" />
                      : fmtNum(line.quantity)}</td>
                    <td className="px-3 py-2.5 text-right">{edit
                      ? <MoneyEd value={line.unitPrice} onChange={(value) => setItem(line.id, { unitPrice: value })} className="!inline-block !w-24 text-right" />
                      : fmtNum(line.unitPrice)}</td>
                    <td className="px-3 py-2.5 text-right">{fmtNum(line.revenue)}</td>
                  </tr>
                ))}
                {!lines.length && <tr><td colSpan={6} className="px-3 py-5 text-center text-gray-400">Chưa có sản phẩm</td></tr>}
              </tbody>
            </table>
          </div>
          {edit && <div className="q2-noprint -mt-2"><button type="button" onClick={addItem} className="text-xs font-semibold text-[#c2410c] border border-[#ffc7b6] rounded-lg px-3 py-1 hover:bg-[#fff4ef]">+ Thêm sản phẩm</button></div>}

          <div className="grid grid-cols-[.9fr_1.1fr] gap-5 items-start">
            <div className="space-y-4">
              <section className="rounded-xl bg-[#fdf3ef] px-4 py-3">
                <h2 className="text-[10px] uppercase tracking-wide text-[#6b7280]">Tổng tiền bằng chữ</h2>
                <p className="font-bold text-[12px]">{moneyToWords(totals.grand)}.</p>
              </section>
              <section className="text-[11px] leading-[1.5]">
                <h2 className="font-bold text-[12px] mb-1">Lưu ý</h2>
                {edit
                  ? <Ed value={content.orderNotes} onChange={(value) => set({ orderNotes: value })} multiline placeholder="Mỗi dòng là một lưu ý" />
                  : <ul>{String(content.orderNotes || '').split('\n').filter(Boolean).map((note, index) => <li key={index}>- {note}</li>)}</ul>}
              </section>
            </div>
            <section className="rounded-xl bg-[#fafafa] px-4 py-3 space-y-1.5">
              {totalRow('Cộng tiền hàng (chưa bao gồm thuế):', totals.subtotal)}
              {Number(data.discountPercent) > 0 && totalRow(
                <>Chiết khấu: ({percentage('discountPercent',content.discountPercent)})</>,
                -totals.discountAmount,
              )}
              {totalRow(<>Thuế bán hàng: {percentage('taxRate', content.taxRate)}</>, totals.tax)}
              <div className="rounded-lg bg-[#ff4f25] px-3 py-2.5 mt-2">
                <div className="flex items-center justify-between gap-2 text-white">
                  <span className="font-bold text-[12px]">Tổng tiền thanh toán (đã gồm thuế):</span>
                  {amount(totals.grand, true)}
                </div>
              </div>
            </section>
          </div>

          <section className="text-[11px] leading-relaxed">
            <h2 className="font-bold text-[12px] mb-1">Phương thức thanh toán</h2>
            {field(content.paymentMethod, (value) => set({ paymentMethod: value }), '', true)}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="rounded-xl bg-[#fafafa] px-4 py-3 text-[11px] leading-relaxed">
                <div className="font-extrabold text-[#ff4f25]">ĐỢT 1 - ĐẶT CỌC {percentage('depositPercent', depositPercent)}</div>
                <div className="text-[22px] font-extrabold leading-tight">{fmtMoney(depositAmount)}</div>
                <div className="italic text-[#6b7280]">({moneyToWords(depositAmount)})</div>
                {field(content.depositNote, (value) => set({ depositNote: value }), 'mt-1', true)}
              </div>
              <div className="rounded-xl bg-[#fafafa] px-4 py-3 text-[11px] leading-relaxed">
                <div className="font-extrabold text-[#ff4f25]">ĐỢT 2 - CÒN LẠI {fmtNum(100 - depositPercent)}%</div>
                <div className="text-[22px] font-extrabold leading-tight">{fmtMoney(remainingAmount)}</div>
                <div className="italic text-[#6b7280]">({moneyToWords(remainingAmount)})</div>
                {field(content.remainingNote, (value) => set({ remainingNote: value }), 'mt-1', true)}
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-[#fdf3ef] px-5 py-4">
            <div className="grid grid-cols-[1fr_170px] gap-4 items-center">
              <div className="text-[12px] leading-relaxed">
                <h2 className="text-[10px] uppercase tracking-wide text-[#6b7280] font-bold mb-1">Thông tin chuyển khoản</h2>
                <div><span>Số tài khoản: </span>{inlineField(company.bankAccount, (value) => setCompany('bankAccount', value), 'font-extrabold text-[26px] text-[#ff4f25]')}</div>
                <div>Chủ tài khoản: {inlineField(company.bankHolder, (value) => setCompany('bankHolder', value), 'font-bold')}</div>
                <div>Ngân hàng: {inlineField(company.bankName, (value) => setCompany('bankName', value))}</div>
                <div className="mt-2">{field(content.paymentInfo, (value) => set({ paymentInfo: value }), '', true)}</div>
              </div>
              {(company.qrUrl || edit) && (
                <div className="text-center rounded-xl bg-white p-2">
                  <ImgEd value={company.qrUrl} onChange={(value) => setCompany('qrUrl', value)} edit={edit} label="Mã QR" max={500}
                    className="w-[150px] h-[150px] mx-auto" imgClassName="w-[150px] h-[150px] object-contain" />
                  <div className="text-[10px] leading-tight mt-1">{field(content.qrCaption, (value) => set({ qrCaption: value }), 'text-center')}</div>
                  <div className="font-bold text-[10px]">{fmtMoney(depositAmount)}</div>
                </div>
              )}
            </div>
          </section>

          <p className="text-[10px] leading-relaxed italic text-[#6b7280]">{field(content.paymentFootnote, (value) => set({ paymentFootnote: value }), '', true)}</p>
          <div className="space-y-0.5">
            <p className="text-[11px] leading-snug">{field(content.deliveryNote, (value) => set({ deliveryNote: value }))}</p>
            <div className="q2-order-final">
              <p className="text-[11px] leading-snug">{field(content.finalNote, (value) => set({ finalNote: value }), '', true)}</p>
              <p className="text-center font-bold text-[#ff4f25] mt-5">{field(content.thankYou, (value) => set({ thankYou: value }))}</p>
            </div>
          </div>
        </article>
      </FitWidth>
    </div>
  )
})

export default OrderQuoteSheet
