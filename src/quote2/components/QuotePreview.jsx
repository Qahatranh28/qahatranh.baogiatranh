import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Btn } from './ui.jsx'
import PreviewEditModal from './PreviewEditModal.jsx'
import { calcQuote } from '../lib/calc.js'
import { fmtMoney, fmtNum, fmtDate, moneyToWords } from '../lib/format.js'

const PRINT_CSS = `
@media print {
  body > *:not(#q2-print-root) { display: none !important; }
  #q2-print-root { position: static !important; inset: auto !important; background: #fff !important; padding: 0 !important; overflow: visible !important; display: block !important; }
  .q2-noprint { display: none !important; }
  .q2-sheet { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: none !important; width: 100% !important; padding: 0 !important; }
  @page { size: A4; margin: 12mm; }
}`

function buildZaloText(quote, calc, company, terms) {
  const lines = [
    `${company.name || 'BÁO GIÁ'} — BÁO GIÁ ${quote.code}`,
    `Ngày: ${fmtDate(quote.createdAt)}`,
    `Khách hàng: ${quote.customerName || '—'}${quote.customerPhone ? ` (${quote.customerPhone})` : ''}`,
    '',
    ...calc.lines.map((l, i) => `${i + 1}. ${l.name || 'Sản phẩm'}${l.size ? ` (${l.size})` : ''} × ${fmtNum(l.quantity)} — ${fmtMoney(l.unitPrice)} = ${fmtMoney(l.revenue)}`),
    '',
    `Tổng tiền: ${fmtMoney(calc.subtotal)}`,
    ...(calc.discountPercent > 0 ? [`Chiết khấu ${fmtNum(calc.discountPercent)}%: -${fmtMoney(calc.discountAmount)}`] : []),
    ...(calc.taxRate > 0 ? [`VAT ${calc.taxRate}%: ${fmtMoney(calc.taxAmount)}`] : []),
    `TỔNG THANH TOÁN: ${fmtMoney(calc.grandTotal)}`,
  ]
  if (quote.note?.trim()) lines.push('', `Ghi chú: ${quote.note.trim()}`)
  const t = String(terms.body || '').split('\n').map((s) => s.trim()).filter(Boolean)
  if (t.length) lines.push('', `${terms.title || 'Điều khoản'}:`, ...t.map((s, i) => `${i + 1}. ${s}`))
  return lines.join('\n')
}

export default function QuotePreview({
  quote, setQuote, company: defCompany, terms: defTerms,
  canEditThisQuote, canEditDefaults, onSaveDefaultCompany, onSaveDefaultTerms, onClose,
}) {
  const [editing, setEditing] = useState(null) // 'company' | 'terms' | null
  const [copied, setCopied] = useState(false)
  const calc = useMemo(() => calcQuote(quote), [quote])
  const ov = quote.previewOverrides || {}
  const company = { ...defCompany, ...(ov.company || {}) }
  const terms = { ...defTerms, ...(ov.terms || {}) }
  const termLines = String(terms.body || '').split('\n').map((s) => s.trim()).filter(Boolean)
  const setOverride = (kind, value) => setQuote((q) => ({ ...q, previewOverrides: { ...(q.previewOverrides || {}), [kind]: value } }))
  const clearOverride = (kind) => setQuote((q) => {
    const next = { ...(q.previewOverrides || {}) }
    delete next[kind]
    return { ...q, previewOverrides: next }
  })

  const copyText = async () => {
    try { await navigator.clipboard.writeText(buildZaloText(quote, calc, company, terms)) } catch { /* bỏ qua */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // Container gắn vào <body> để khi in chỉ in bản báo giá (xem PRINT_CSS). Gỡ đi khi đóng preview.
  const root = useMemo(() => {
    const el = document.createElement('div')
    el.id = 'q2-print-root'
    el.className = 'fixed inset-0 z-50 bg-[#525659] overflow-auto py-6 px-3'
    return el
  }, [])
  useEffect(() => {
    document.body.appendChild(root)
    return () => root.remove()
  }, [root])

  const th = 'border border-[#cfd4da] bg-[#f3f4f6] px-2 py-1.5 text-xs font-semibold'
  const td = 'border border-[#cfd4da] px-2 py-1.5 align-top'

  return createPortal(
    <>
      <style>{PRINT_CSS}</style>
      <div className="q2-noprint max-w-[794px] mx-auto mb-3 flex flex-wrap items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow">
        <span className="font-bold text-sm mr-auto">Xem trước báo giá gửi khách</span>
        <Btn variant="sm" onClick={() => setEditing('company')}>✎ Thông tin công ty</Btn>
        <Btn variant="sm" onClick={() => setEditing('terms')}>✎ Điều khoản</Btn>
        <Btn variant="sm" onClick={copyText}>{copied ? 'Đã copy ✓' : 'Copy nội dung (Zalo)'}</Btn>
        <Btn variant="primary" className="!py-1 !px-3 !text-xs" onClick={() => window.print()}>In / Lưu PDF</Btn>
        <Btn variant="dark" className="!py-1 !px-3 !text-xs" onClick={onClose}>Đóng</Btn>
      </div>

      <article className="q2-sheet max-w-[794px] mx-auto bg-white shadow-xl p-8 sm:p-10 text-[13px] text-[#1a1f2c] leading-relaxed">
        {/* Thông tin công ty */}
        <header className="flex items-start justify-between gap-6 border-b-2 border-[#ff4f25] pb-4">
          <div className="flex gap-4 items-start">
            {company.logoUrl && <img src={company.logoUrl} alt="" className="w-20 h-20 object-contain rounded" />}
            <div>
              <h1 className="text-xl font-extrabold tracking-wide">{company.name}</h1>
              {company.tagline && <p className="text-[#6b7280] -mt-0.5">{company.tagline}</p>}
              <div className="mt-1 text-[12px] space-y-px">
                {company.address && <p>Địa chỉ: {company.address}</p>}
                {(company.phone || company.email) && <p>{[company.phone && `ĐT/Zalo: ${company.phone}`, company.email && `Email: ${company.email}`].filter(Boolean).join(' · ')}</p>}
                {(company.website || company.taxCode) && <p>{[company.website, company.taxCode && `MST: ${company.taxCode}`].filter(Boolean).join(' · ')}</p>}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-extrabold text-[#ff4f25]">BÁO GIÁ</p>
            <p className="font-semibold">Số: {quote.code}</p>
            <p>Ngày: {fmtDate(quote.createdAt)}</p>
          </div>
        </header>

        {/* Thông tin đơn hàng */}
        <section className="grid grid-cols-2 gap-x-6 gap-y-1 mt-4">
          <p><span className="text-[#6b7280]">Khách hàng:</span> <b>{quote.customerName || '—'}</b></p>
          <p><span className="text-[#6b7280]">Người lập:</span> {quote.ownerName || '—'}</p>
          <p><span className="text-[#6b7280]">Số điện thoại:</span> {quote.customerPhone || '—'}</p>
          <p><span className="text-[#6b7280]">Mã đơn:</span> {quote.code}</p>
        </section>

        <table className="w-full border-collapse mt-4">
          <thead>
            <tr>
              <th className={`${th} w-9 text-center`}>STT</th>
              <th className={`${th} text-left`}>Tên sản phẩm</th>
              <th className={`${th} w-24 text-left`}>Kích thước</th>
              <th className={`${th} w-12 text-right`}>SL</th>
              <th className={`${th} w-28 text-right`}>Đơn giá</th>
              <th className={`${th} w-32 text-right`}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {calc.lines.filter((l) => l.name || l.unitPrice).map((l, i) => (
              <tr key={l.id}>
                <td className={`${td} text-center`}>{i + 1}</td>
                <td className={td}>{l.name}</td>
                <td className={td}>{l.size}</td>
                <td className={`${td} text-right`}>{fmtNum(l.quantity)}</td>
                <td className={`${td} text-right`}>{fmtMoney(l.unitPrice)}</td>
                <td className={`${td} text-right font-medium`}>{fmtMoney(l.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-3">
          <dl className="w-72 text-[13px]">
            <div className="flex justify-between py-0.5"><dt>Tổng tiền hàng</dt><dd>{fmtMoney(calc.subtotal)}</dd></div>
            {calc.discountPercent > 0 && <div className="flex justify-between py-0.5"><dt>Chiết khấu ({fmtNum(calc.discountPercent)}%)</dt><dd>− {fmtMoney(calc.discountAmount)}</dd></div>}
            {calc.discountPercent > 0 && <div className="flex justify-between py-0.5"><dt>Sau chiết khấu</dt><dd>{fmtMoney(calc.afterDiscount)}</dd></div>}
            {calc.taxRate > 0 && <div className="flex justify-between py-0.5"><dt>VAT ({calc.taxRate}%)</dt><dd>{fmtMoney(calc.taxAmount)}</dd></div>}
            <div className="flex justify-between py-1.5 mt-1 border-t-2 border-[#1a1f2c] font-extrabold text-base"><dt>TỔNG THANH TOÁN</dt><dd className="text-[#ff4f25]">{fmtMoney(calc.grandTotal)}</dd></div>
          </dl>
        </div>
        <p className="italic mt-1"><span className="text-[#6b7280]">Bằng chữ:</span> {moneyToWords(calc.grandTotal)}</p>

        {quote.note?.trim() && <p className="mt-3 whitespace-pre-line"><b>Ghi chú:</b> {quote.note.trim()}</p>}

        {termLines.length === 0 && (
          <p className="q2-noprint mt-5 border border-dashed border-[#cfd4da] rounded p-3 text-center text-xs text-[#6b7280]">
            Chưa có điều khoản — bấm «✎ Điều khoản» ở thanh trên để nhập. (Dòng này không hiện khi in/gửi khách.)
          </p>
        )}
        {/* Điều khoản */}
        {termLines.length > 0 && (
          <section className="mt-5">
            <h2 className="font-bold text-sm uppercase tracking-wide border-b border-[#cfd4da] pb-1 mb-1.5">{terms.title}</h2>
            <ol className="list-decimal pl-5 space-y-0.5">{termLines.map((t, i) => <li key={i}>{t}</li>)}</ol>
          </section>
        )}

        {(company.bankName || company.bankAccount) && (
          <section className="mt-4 border border-[#cfd4da] rounded p-3 bg-[#fafafa]">
            <p className="font-bold text-sm mb-0.5">Thông tin thanh toán</p>
            <p>{[company.bankName, company.bankAccount && `STK: ${company.bankAccount}`, company.bankHolder && `Chủ TK: ${company.bankHolder}`].filter(Boolean).join(' · ')}</p>
          </section>
        )}

        <footer className="grid grid-cols-2 text-center mt-8 pt-2">
          <div><p className="font-semibold">Khách hàng xác nhận</p><p className="text-[11px] text-[#6b7280]">(Ký, ghi rõ họ tên)</p><div className="h-16" /></div>
          <div><p className="font-semibold">Đại diện {company.name}</p><p className="text-[11px] text-[#6b7280]">(Ký, ghi rõ họ tên)</p><div className="h-16" /></div>
        </footer>
      </article>

      {editing && (
        <div className="q2-noprint">
          <PreviewEditModal
            kind={editing}
            current={editing === 'company' ? company : terms}
            hasOverride={!!ov[editing]}
            canEditQuote={canEditThisQuote}
            canEditDefaults={canEditDefaults}
            onSaveQuote={(v) => { setOverride(editing, v); return { ok: true } }}
            onSaveDefault={(v) => (editing === 'company' ? onSaveDefaultCompany(v) : onSaveDefaultTerms(v))}
            onResetQuote={() => clearOverride(editing)}
            onClose={() => setEditing(null)}
          />
        </div>
      )}
    </>,
    root
  )
}
