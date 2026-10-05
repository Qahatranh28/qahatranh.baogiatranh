import { Ed, ImgEd } from './Ed.jsx'

// Thông tin thanh toán: ngân hàng, số tài khoản, chủ tài khoản, nội dung CK — bên cạnh là mã QR.
// edit: mọi dòng là ô nhập. onCompany(k,v): sửa ngân hàng/STK/chủ TK/QR. transferNote + onNote: nội dung CK (mặc định = số phiếu)
export default function PaymentBlock({ company, code, edit = false, onCompany, transferNote, onNote }) {
  const rows = [
    ['bankName', 'Ngân hàng'],
    ['bankAccount', 'Số tài khoản'],
    ['bankHolder', 'Chủ tài khoản'],
  ]
  const empty = !rows.some(([k]) => company[k]) && !company.qrUrl
  if (empty && !edit) return null
  return (
    <section className={`rounded-2xl border border-[#e5e7eb] px-6 py-5 ${empty ? 'q2-empty' : ''}`}>
      <h2 className="text-base font-bold mb-3 text-center">Thông tin thanh toán</h2>
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-[13.5px]">
        <dl className="space-y-1.5 min-w-[320px]">
          {rows.map(([k, label]) => (
            (edit || company[k]) && (
              <div key={k} className={`flex gap-3 items-baseline ${edit && !company[k] ? 'q2-empty' : ''}`}>
                <dt className="w-28 text-[#6b7280] shrink-0">{label}:</dt>
                <dd className={`flex-1 ${k === 'bankAccount' ? 'font-bold text-base tracking-wide' : 'font-semibold'}`}>
                  {edit ? <Ed value={company[k]} onChange={(v) => onCompany(k, v)} placeholder={label} /> : company[k]}
                </dd>
              </div>
            )
          ))}
          <div className="flex gap-3 items-baseline">
            <dt className="w-28 text-[#6b7280] shrink-0">Nội dung CK:</dt>
            <dd className="flex-1 font-semibold">{edit ? <Ed value={transferNote ?? code} onChange={onNote} /> : (transferNote ?? code)}</dd>
          </div>
        </dl>
        {(company.qrUrl || edit) && (
          <div className={`text-center shrink-0 ${edit && !company.qrUrl ? 'q2-empty' : ''}`}>
            <ImgEd value={company.qrUrl} onChange={(v) => onCompany('qrUrl', v)} edit={edit} label="Mã QR" max={500}
              className="w-36 h-36 mx-auto" imgClassName="w-36 h-36 object-contain border border-[#e5e7eb] rounded-lg p-1 bg-white mx-auto" />
            {company.qrUrl && <p className="text-[11px] text-[#6b7280] mt-1">Quét mã để thanh toán</p>}
          </div>
        )}
      </div>
    </section>
  )
}
