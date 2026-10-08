import { ImgEd } from './Ed.jsx'
import { DEFAULT_PAYMENT_NOTICE } from '../lib/defaults.js'

// Thông tin thanh toán: ngân hàng, số tài khoản, chủ tài khoản — bên cạnh là mã QR.
export default function PaymentBlock({ company, edit = false, onCompany, paymentNotice }) {
  const rows = [
    ['bankAccount', 'Số tài khoản'],
    ['bankHolder', 'Chủ tài khoản'],
    ['bankName', 'Ngân hàng'],
  ]
  const empty = !rows.some(([k]) => company[k]) && !company.qrUrl
  if (empty && !edit) return null
  const bankField = (key, label) => edit
    ? <input
      type="text"
      value={company[key] ?? ''}
      onChange={(event) => onCompany(key, event.target.value)}
      placeholder={label}
      className={`q2-ed q2-inline-input ${key === 'bankAccount' ? 'font-extrabold text-[26px] text-[#ff4f25]' : 'font-bold'}`}
      style={{ width: `${Math.max(4, String(company[key] || label).length + 3)}ch`, maxWidth: '100%' }}
    />
    : company[key]
  return (
    <section className={`rounded-xl bg-[#fdf3ef] px-5 py-4 ${empty ? 'q2-empty' : ''}`}>
      <div className="grid grid-cols-[1fr_170px] gap-4 items-center">
        <div className="text-[12px] leading-relaxed">
          <h2 className="text-[10px] uppercase tracking-wide text-[#6b7280] font-bold mb-1">Thông tin chuyển khoản</h2>
          <div>
            {rows.map(([k, label]) => (
              (edit || company[k]) && (
                <div key={k} className={edit && !company[k] ? 'q2-empty' : ''}>
                  <span>{label}: </span>
                  <strong className={k === 'bankAccount' ? 'font-extrabold text-[26px] text-[#ff4f25]' : ''}>
                    {bankField(k, label)}
                  </strong>
                </div>
              )
            ))}
          </div>
          <div className="font-bold text-[#c2410c] text-left mt-2">
            {paymentNotice ?? company.paymentNotice ?? DEFAULT_PAYMENT_NOTICE}
          </div>
        </div>
        {(company.qrUrl || edit) && (
          <div className="text-center rounded-xl bg-white p-2">
            <ImgEd value={company.qrUrl} onChange={(v) => onCompany('qrUrl', v)} edit={edit} label="Mã QR" max={500}
              className="w-[150px] h-[150px] mx-auto" imgClassName="w-[150px] h-[150px] object-contain" />
            {company.qrUrl && <p className="text-[10px] leading-tight mt-1">Quét mã để thanh toán</p>}
          </div>
        )}
      </div>
    </section>
  )
}
