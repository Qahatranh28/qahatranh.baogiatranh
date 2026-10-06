import { useMemo, useState } from 'react'
import { Card, Field, Btn, MoneyInput, inputCls } from '../components/ui.jsx'
import CompanyForm from '../components/CompanyForm.jsx'
import TermsRowsEditor from '../components/TermsRowsEditor.jsx'
import PreviewShell from '../components/PreviewShell.jsx'
import QuoteSheet from '../components/sheets/QuoteSheet.jsx'
import DeliverySheet from '../components/sheets/DeliverySheet.jsx'
import { DOC_TYPES, deliveryNotesOrDefault, newDocItem, toYmd, fromYmd, buildQuoteText } from '../lib/docs.js'
import { calcQuote } from '../lib/calc.js'
import { parseTerms, serializeTerms } from '../lib/richText.js'
import { DEFAULT_TERMS, TAX_OPTIONS } from '../lib/defaults.js'
import { fmtMoney } from '../lib/format.js'
import { fmtDate } from '../lib/format.js'

const Panel = ({ title, sub, children, defaultOpen = true }) => (
  <details open={defaultOpen} className="bg-white border border-[#e3e7ec] rounded-xl group">
    <summary className="cursor-pointer list-none px-5 py-3.5 flex items-center justify-between">
      <span><span className="font-bold text-[15px] text-[#1a1f2c]">{title}</span>{sub && <span className="block text-xs text-[#6b7280] font-normal">{sub}</span>}</span>
      <span className="text-[#9ca3af] text-sm group-open:rotate-180 transition">▾</span>
    </summary>
    <div className="px-5 pb-5 pt-1">{children}</div>
  </details>
)

function TermsSection({ terms, onChange }) {
  const [rows, setRows] = useState(() => { const r = parseTerms(terms?.body); return r.length ? r : [{ level: 1, text: '' }] })
  const sync = (u) => setRows((prev) => {
    const next = typeof u === 'function' ? u(prev) : u
    queueMicrotask(() => onChange({ ...terms, body: serializeTerms(next) }))
    return next
  })
  return (
    <div className="space-y-3">
      <Field label="Tiêu đề mục"><input className={inputCls} value={terms?.title ?? DEFAULT_TERMS.title} onChange={(e) => onChange({ ...terms, title: e.target.value })} /></Field>
      <TermsRowsEditor rows={rows} setRows={sync} />
    </div>
  )
}

function ItemsEditor({ type, items, setItems, showPrice }) {
  const set = (id, p) => setItems((its) => its.map((i) => (i.id === id ? { ...i, ...p } : i)))
  const num = (v) => (v === '' ? 0 : Number(v))
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="text-xs text-[#4b5563] border-b border-[#e3e7ec] text-left">
            <th className="py-2 w-8 font-semibold">STT</th>
            <th className="font-semibold px-1 min-w-[200px]">Tên sản phẩm{type === 'quote' ? ' / kích thước' : ''}</th>
            {type === 'delivery' && <th className="font-semibold px-1 w-32">ĐVT</th>}
            <th className="font-semibold px-1 w-20 text-right">SL</th>
            {showPrice && <th className="font-semibold px-1 w-36 text-right">Đơn giá</th>}
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={it.id} className="border-b border-[#eef0f3]">
              <td className="py-2 text-[#6b7280]">{idx + 1}</td>
              <td className="py-1.5 px-1">
                <input className={inputCls} value={it.name} placeholder="Tên sản phẩm" onChange={(e) => set(it.id, { name: e.target.value })} />
                {type === 'quote' && <input className={`${inputCls} mt-1`} value={it.size} placeholder="Kích thước (55x80 cm)" onChange={(e) => set(it.id, { size: e.target.value })} />}
              </td>
              {type === 'delivery' && <td className="py-1.5 px-1"><input className={inputCls} value={it.unit || 'Tấm'} placeholder="ĐVT" onChange={(e) => set(it.id, { unit: e.target.value })} /></td>}
              <td className="py-1.5 px-1"><input type="number" min="0" className={`${inputCls} text-right`} value={it.quantity} onChange={(e) => set(it.id, { quantity: num(e.target.value) })} /></td>
              {showPrice && <td className="py-1.5 px-1"><MoneyInput value={it.unitPrice} onChange={(v) => set(it.id, { unitPrice: v })} /></td>}
              <td className="py-2 text-right">{items.length > 1 && <button onClick={() => setItems((its) => its.filter((i) => i.id !== it.id))} className="text-gray-400 hover:text-red-600 text-lg leading-none" aria-label="Xoá dòng">&times;</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pt-3"><Btn variant="sm" onClick={() => setItems((its) => [...its, newDocItem(type)])}>+ Thêm sản phẩm</Btn></div>
    </div>
  )
}

// Sửa phiếu: MỌI thông tin trên phiếu đều là ô nhập (tiêu đề, số, ngày, khách, sản phẩm, giá, chiết khấu, VAT, điều khoản, công ty, thanh toán, QR…)
export default function DocEditor({ doc, data, setData, dirty, saving, editable, perms, previewOpen, onPreview, onClosePreview, onSave, onBack, onDelete, onOpenQuote }) {
  const type = doc.type
  const isDelivery = type === 'delivery'
  const set = (patch) => setData((d) => ({ ...d, ...patch }))
  const setCompany = (k, v) => setData((d) => ({ ...d, company: { ...d.company, [k]: v } }))
  const calc = useMemo(() => (isDelivery ? null : calcQuote({ items: data.items, discountPercent: data.discountPercent, taxRate: data.taxRate })), [data, isDelivery])
  const taxOptions = TAX_OPTIONS.some((t) => t.value === Number(data.taxRate)) ? TAX_OPTIONS : [...TAX_OPTIONS, { value: Number(data.taxRate), label: `VAT – ${data.taxRate}%` }]
  const disabled = !editable

  return (
    <div className="space-y-4">
      <Card className="!py-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={onBack} className="text-sm text-[#6b7280] hover:text-[#1a1f2c]">← Danh sách phiếu</button>
            <h2 className="font-bold text-lg">{DOC_TYPES[type].label} {data.code}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${DOC_TYPES[type].cls}`}>{DOC_TYPES[type].label}</span>
            {dirty && <span className="text-xs font-semibold text-amber-700">● Chưa lưu</span>}
            <span className="text-xs text-[#6b7280]">Tạo bởi <b className="text-[#1a1f2c]">{doc.ownerName || '—'}</b> · {fmtDate(doc.createdAt)}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {doc.quoteId && <Btn onClick={onOpenQuote}>Mở báo giá gốc</Btn>}
            {perms.canDeleteQuote && <Btn variant="danger" onClick={onDelete}>Xoá</Btn>}
            <Btn onClick={onPreview}>Xem trước / In</Btn>
            <Btn variant="primary" onClick={onSave} disabled={!editable || saving || !dirty}>{saving ? 'Đang lưu…' : dirty ? 'Lưu phiếu' : 'Đã lưu ✓'}</Btn>
          </div>
        </div>
        {!editable && <p className="text-xs text-red-600 mt-2">Bạn chỉ có quyền xem phiếu này (thuộc người khác).</p>}
      </Card>

      <Panel title="Thông tin phiếu">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Tiêu đề (góc phải, chữ đen)"><input className={inputCls} disabled={disabled} value={data.title || ''} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label={isDelivery ? 'Số phiếu' : 'Số báo giá'}><input className={inputCls} disabled={disabled} value={data.code || ''} onChange={(e) => set({ code: e.target.value })} /></Field>
          <Field label="Ngày"><input type="date" className={inputCls} disabled={disabled} value={toYmd(data.date)} onChange={(e) => set({ date: fromYmd(e.target.value) })} /></Field>
          {isDelivery
            ? <Field label="Theo báo giá số"><input className={inputCls} disabled={disabled} value={data.refCode || ''} onChange={(e) => set({ refCode: e.target.value })} /></Field>
            : <Field label="Khách hàng"><input className={inputCls} disabled={disabled} value={data.customerName || ''} onChange={(e) => set({ customerName: e.target.value })} /></Field>}
        </div>
      </Panel>

      {isDelivery && (
        <Panel title="Giao nhận">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Khách hàng / người nhận"><input className={inputCls} disabled={disabled} value={data.customerName || ''} onChange={(e) => set({ customerName: e.target.value })} /></Field>
            <Field label="Điện thoại"><input className={inputCls} disabled={disabled} value={data.customerPhone || ''} onChange={(e) => set({ customerPhone: e.target.value })} /></Field>
            <Field label="Ngày giao"><input type="date" className={inputCls} disabled={disabled} value={data.deliveryDate || ''} onChange={(e) => set({ deliveryDate: e.target.value })} /></Field>
            <Field label="Địa chỉ giao hàng" className="sm:col-span-2 lg:col-span-3"><input className={inputCls} disabled={disabled} value={data.deliveryAddress || ''} onChange={(e) => set({ deliveryAddress: e.target.value })} /></Field>
            <Field label="Người nhận hàng (ký nhận)"><input className={inputCls} disabled={disabled} value={data.receiver || ''} onChange={(e) => set({ receiver: e.target.value })} /></Field>
          </div>
        </Panel>
      )}

      <Panel title={isDelivery ? 'Sản phẩm giao' : 'Sản phẩm & giá'}>
        <ItemsEditor type={type} items={data.items} setItems={(u) => setData((d) => ({ ...d, items: typeof u === 'function' ? u(d.items) : u }))} showPrice />
        {isDelivery ? (
          <div className="grid sm:grid-cols-2 gap-3 mt-4 max-w-3xl">
            <Field label="Số tiền thu hộ khi giao (0 = không hiện)"><MoneyInput value={data.collectAmount} disabled={disabled} onChange={(v) => set({ collectAmount: v })} /></Field>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3 mt-4 max-w-2xl">
            <Field label="Chiết khấu (%)"><input type="number" min="0" max="100" step="0.5" className={inputCls} disabled={disabled} value={data.discountPercent} onChange={(e) => set({ discountPercent: e.target.value === '' ? 0 : Number(e.target.value) })} /></Field>
            <Field label="Thuế">
              <select className={inputCls} disabled={disabled} value={Number(data.taxRate)} onChange={(e) => set({ taxRate: Number(e.target.value) })}>
                {taxOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <div className="text-sm self-end pb-2">Tổng thanh toán: <b className="text-[#ff4f25]">{fmtMoney(calc.grandTotal)}</b></div>
          </div>
        )}
        <div className="grid gap-3 mt-3 max-w-3xl">
          <Field label={isDelivery ? 'Ghi chú giao hàng' : 'Ghi chú hiển thị trên phiếu'}><textarea rows={2} className={inputCls} disabled={disabled} value={data.note || ''} onChange={(e) => set({ note: e.target.value })} /></Field>
          {isDelivery && <Field label="Lưu ý"><textarea rows={4} className={inputCls} disabled={disabled} value={deliveryNotesOrDefault(data.confirmText)} onChange={(e) => set({ confirmText: e.target.value })} /></Field>}
        </div>
      </Panel>

      {!isDelivery && (
        <Panel title="Điều khoản" sub="Mục chính / mục con, in đậm" defaultOpen={false}>
          <TermsSection terms={data.terms} onChange={(t) => set({ terms: t })} />
        </Panel>
      )}

      <Panel title="Thông tin công ty & thanh toán" sub="Logo, liên hệ, ngân hàng, mã QR — chỉ đổi trên phiếu này" defaultOpen={false}>
        <CompanyForm form={data.company} set={setCompany} hideDocTitle />
      </Panel>

      {previewOpen && (
        <PreviewShell
          title={`Xem trước ${DOC_TYPES[type].label.toLowerCase()}`}
          fileName={data.code}
          onClose={onClosePreview}
          getText={isDelivery ? undefined : () => buildQuoteText(data, calc, data.company, data.terms || {})}
        >
          {(ref) => isDelivery
            ? <DeliverySheet ref={ref} data={data} company={data.company} />
            : <QuoteSheet ref={ref} data={data} company={data.company} terms={data.terms || {}} />}
        </PreviewShell>
      )}
    </div>
  )
}
