import { useEffect, useMemo, useState } from 'react'
import { Card, Field, Btn, MoneyInput, AutoGrowTextarea, inputCls } from './ui.jsx'
import CompanyForm from './CompanyForm.jsx'
import TermsRowsEditor from './TermsRowsEditor.jsx'
import { DEFAULT_ORDER_QUOTE_CONTENT, deliveryNotesOrDefault, newDocItem, toYmd, fromYmd, docTotals, withCentimeterUnit } from '../lib/docs.js'
import { parseTerms, serializeTerms } from '../lib/richText.js'
import { DEFAULT_TERMS, TAX_OPTIONS } from '../lib/defaults.js'
import { fmtMoney } from '../lib/format.js'

const Heading = ({ children }) => <h4 className="text-[12.5px] font-bold tracking-wide text-[#4b5563] uppercase mt-1 mb-2">{children}</h4>

function Panel({ title, sub, children, defaultOpen = true }) {
  return (
    <details open={defaultOpen} className="bg-white border border-[#e3e7ec] rounded-xl group">
      <summary className="cursor-pointer list-none px-5 py-3.5 flex items-center justify-between">
        <span><span className="font-bold text-[15px] text-[#1a1f2c]">{title}</span>{sub && <span className="block text-xs text-[#6b7280] font-normal">{sub}</span>}</span>
        <span className="text-[#9ca3af] text-sm group-open:rotate-180 transition">▾</span>
      </summary>
      <div className="px-5 pb-5 pt-1">{children}</div>
    </details>
  )
}

function TermsSection({ terms, onChange, disabled }) {
  const fromBody = () => { const r = parseTerms(terms?.body); return r.length ? r : [{ level: 1, text: '' }] }
  const [rows, setRows] = useState(fromBody)
  // Điều khoản bị sửa từ nơi khác (nút ✎ trên tờ phiếu) -> nạp lại
  useEffect(() => { if (serializeTerms(rows) !== (terms?.body || '')) setRows(fromBody()) }, [terms?.body]) // eslint-disable-line react-hooks/exhaustive-deps
  const sync = (u) => setRows((prev) => {
    const next = typeof u === 'function' ? u(prev) : u
    queueMicrotask(() => onChange({ ...terms, body: serializeTerms(next) }))
    return next
  })
  return (
    <fieldset disabled={disabled} className="space-y-3">
      <Field label="Tiêu đề mục"><input className={inputCls} value={terms?.title ?? DEFAULT_TERMS.title} onChange={(e) => onChange({ ...terms, title: e.target.value })} /></Field>
      <TermsRowsEditor rows={rows} setRows={sync} />
    </fieldset>
  )
}

function ItemsEditor({ type, items, setItems, showPrice, disabled }) {
  const set = (id, p) => setItems((its) => its.map((i) => (i.id === id ? { ...i, ...p } : i)))
  const num = (v) => (v === '' ? 0 : Number(v))
  return (
    <div className="overflow-x-auto">
      <table className="w-max text-sm">
        <thead>
          <tr className="text-xs text-[#4b5563] border-b border-[#e3e7ec] text-left">
            <th className="py-2 w-8 font-semibold">STT</th>
            <th className="font-semibold px-1 w-[220px]">Sản phẩm</th>
            <th className="font-semibold px-1 w-[92px]">Kích thước</th>
            <th className="font-semibold px-1 w-[62px]">ĐVT</th>
            <th className="font-semibold px-1 w-[42px] text-right">SL</th>
            {showPrice && <th className="font-semibold px-1 w-32 text-right">Đơn giá (VND)</th>}
            <th className="w-6" />
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={it.id} className="border-b border-[#eef0f3]">
              <td className="py-2 text-[#6b7280]">{idx + 1}</td>
              <td className="py-1.5 px-1 w-[220px]"><AutoGrowTextarea disabled={disabled} className="!w-[220px] min-h-[40px] py-2" value={it.name} onChange={(value) => set(it.id, { name: value })} placeholder="Tên sản phẩm" /></td>
              <td className="py-1.5 px-1"><input disabled={disabled} className={`${inputCls} !w-[80px] !px-2`} value={it.size || ''} placeholder="55x80" onChange={(e) => set(it.id, { size: e.target.value })} onBlur={(e) => set(it.id, { size: withCentimeterUnit(e.target.value) })} /></td>
              <td className="py-1.5 px-1 w-[62px]"><input disabled={disabled} className={`${inputCls} !w-[50px] !px-1.5 text-center`} value={it.unit || 'Tấm'} placeholder="ĐVT" onChange={(e) => set(it.id, { unit: e.target.value })} /></td>
              <td className="py-1.5 px-1 w-[42px]"><input disabled={disabled} type="number" min="0" className={`${inputCls} !w-[30px] !px-1 text-right`} value={it.quantity} onChange={(e) => set(it.id, { quantity: num(e.target.value) })} /></td>
              {showPrice && <td className="py-1.5 px-1"><MoneyInput disabled={disabled} value={it.unitPrice} onChange={(v) => set(it.id, { unitPrice: v })} /></td>}
              <td className="py-2 text-right">{!disabled && items.length > 1 && <button onClick={() => setItems((its) => its.filter((i) => i.id !== it.id))} className="text-gray-400 hover:text-red-600 text-lg leading-none" aria-label="Xoá dòng">&times;</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!disabled && <div className="pt-3"><Btn variant="sm" onClick={() => setItems((its) => [...its, newDocItem(type)])}>+ Thêm sản phẩm</Btn></div>}
    </div>
  )
}

// Biểu mẫu sửa phiếu (cột trái). Dùng chung dữ liệu với tờ phiếu bên phải: sửa ở đâu cũng được.
export default function DocForm({ type, data, setData, disabled, orderMode = false }) {
  const isDelivery = type === 'delivery'
  const set = (patch) => setData((d) => ({ ...d, ...patch }))
  const setCompany = (k, v) => setData((d) => ({ ...d, company: { ...d.company, [k]: v } }))
  const t = useMemo(() => (isDelivery ? null : docTotals(data)), [data, isDelivery])
  const taxOptions = TAX_OPTIONS.some((x) => x.value === Number(data.taxRate)) ? TAX_OPTIONS : [...TAX_OPTIONS, { value: Number(data.taxRate), label: `VAT – ${data.taxRate}%` }]
  const setItems = (u) => setData((d) => ({ ...d, items: typeof u === 'function' ? u(d.items) : u }))
  const setGrand = (v) => set({ overrides: { ...(data.overrides || {}), grand: v } })
  const clearGrand = () => setData((d) => { const o = { ...(d.overrides || {}) }; delete o.grand; return { ...d, overrides: o } })

  return (
    <div className="space-y-4">
      <Card>
        <fieldset disabled={disabled} className="space-y-3">
          <Heading>Thông tin phiếu</Heading>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Tiêu đề (góc phải, chữ đen)"><input className={inputCls} value={data.title || ''} onChange={(e) => set({ title: e.target.value })} /></Field>
            <Field label={isDelivery ? 'Số phiếu' : 'Số báo giá'}><input className={inputCls} value={data.code || ''} onChange={(e) => set({ code: e.target.value })} /></Field>
            <Field label="Ngày lập"><input type="date" className={inputCls} value={toYmd(data.date)} onChange={(e) => set({ date: fromYmd(e.target.value) })} /></Field>
            {isDelivery && <Field label="Theo báo giá số"><input className={inputCls} value={data.refCode || ''} onChange={(e) => set({ refCode: e.target.value })} /></Field>}
          </div>

          <Heading>{isDelivery ? 'Người nhận' : 'Khách hàng'}</Heading>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={isDelivery ? 'Khách hàng / người nhận' : 'Tên khách hàng'}><input className={inputCls} value={data.customerName || ''} onChange={(e) => set({ customerName: e.target.value })} /></Field>
            {isDelivery && <Field label="Điện thoại"><input className={inputCls} value={data.customerPhone || ''} onChange={(e) => set({ customerPhone: e.target.value })} /></Field>}
          </div>

          {isDelivery ? (
            <>
              <Heading>Giao hàng</Heading>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Địa chỉ giao hàng" className="sm:col-span-2"><input className={inputCls} value={data.deliveryAddress || ''} onChange={(e) => set({ deliveryAddress: e.target.value })} /></Field>
                <Field label="Ngày giao"><input type="date" className={inputCls} value={data.deliveryDate || ''} onChange={(e) => set({ deliveryDate: e.target.value })} /></Field>
                <Field label="Người nhận hàng (ký nhận)"><input className={inputCls} value={data.receiver || ''} onChange={(e) => set({ receiver: e.target.value })} /></Field>
              </div>
            </>
          ) : (
            <>
              <Heading>Thanh toán</Heading>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Chiết khấu (%)"><input type="number" min="0" max="100" step="0.5" className={inputCls} value={data.discountPercent} onChange={(e) => set({ discountPercent: e.target.value === '' ? 0 : Number(e.target.value) })} /></Field>
                <Field label="Thuế">
                  <select className={inputCls} value={Number(data.taxRate)} onChange={(e) => set({ taxRate: Number(e.target.value) })}>
                    {taxOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                  </select>
                </Field>
                <Field label="Tổng thanh toán (sửa tay được)">
                  <MoneyInput value={t.grand} onChange={setGrand} className={t.overridden.grand ? '!border-amber-400 !bg-amber-50' : ''} />
                </Field>
              </div>
              {t.overridden.grand && (
                <p className="text-xs text-amber-700">Tổng thanh toán đang nhập tay ({fmtMoney(t.grand)}) thay vì {fmtMoney(t.calc.grandTotal)} tính theo sản phẩm. <button type="button" className="underline font-semibold" onClick={clearGrand}>↺ Tính lại</button></p>
              )}
            </>
          )}
        </fieldset>
      </Card>

      <Card>
        <h3 className="font-bold text-[15px] mb-3">{isDelivery ? 'Sản phẩm giao' : 'Sản phẩm'}</h3>
        <ItemsEditor type={type} items={data.items} setItems={setItems} showPrice disabled={disabled} />
        {isDelivery && (
          <fieldset disabled={disabled} className="grid gap-3 mt-4">
            <Field label="Ghi chú giao hàng"><textarea rows={2} className={inputCls} value={data.note || ''} onChange={(e) => set({ note: e.target.value })} /></Field>
            <Field label="Lưu ý"><textarea rows={4} className={inputCls} value={deliveryNotesOrDefault(data.confirmText)} onChange={(e) => set({ confirmText: e.target.value })} /></Field>
          </fieldset>
        )}
      </Card>

      {!isDelivery && (orderMode ? (
        <Panel title="Điều khoản phiếu đơn hàng" sub="Chỉ áp dụng cho phiếu này, không thay đổi báo giá gốc" defaultOpen={false}>
          <fieldset disabled={disabled}>
            <Field label="Lưu ý / điều khoản áp dụng cho đơn hàng">
              <textarea
                className={`${inputCls} min-h-36`}
                value={data.orderNotes ?? DEFAULT_ORDER_QUOTE_CONTENT.orderNotes}
                onChange={(e) => set({ orderNotes: e.target.value })}
                placeholder="Nhập mỗi lưu ý trên một dòng"
              />
            </Field>
          </fieldset>
        </Panel>
      ) : (
        <Panel title="Điều khoản" sub="Mục chính / mục con, in đậm" defaultOpen={false}>
          <TermsSection terms={data.terms} onChange={(v) => set({ terms: v })} disabled={disabled} />
        </Panel>
      ))}

      <Panel title="Thông tin công ty & thanh toán" sub="Logo, liên hệ, ngân hàng, mã QR — chỉ đổi trên phiếu này" defaultOpen={false}>
        <fieldset disabled={disabled} className="space-y-3">
          <CompanyForm form={data.company} set={setCompany} hideDocTitle />
        </fieldset>
      </Panel>
    </div>
  )
}
