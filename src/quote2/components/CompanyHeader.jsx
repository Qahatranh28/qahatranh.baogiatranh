import { fmtDate } from '../lib/format.js'
import { Ed, DateEd, ImgEd } from './Ed.jsx'

const Ic = ({ children }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ff4f25" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">{children}</svg>
)

// Đầu trang: logo | tên + mô tả + gạch đầu dòng | liên hệ | tiêu đề + số + ngày.
// Chế độ sửa (edit=true): mọi chữ là ô nhập. onCompany(k, v) sửa thông tin công ty; onTitle/onCode/onDate sửa phần góc phải.
export default function CompanyHeader({
  company, code, date, title, numberLabel = 'Số báo giá', dateMode = 'iso',
  edit = false, onCompany, onTitle, onCode, onDate,
}) {
  const heading = title ?? company.docTitle ?? 'BÁO GIÁ'
  const hotline = company.hotline || company.phone // phone: tên trường cũ
  const lines = String(company.highlights || '').split('\n')
  const bullets = edit ? lines : lines.map((s) => s.trim()).filter(Boolean)
  const setBullet = (i, v) => onCompany('highlights', lines.map((l, k) => (k === i ? v : l)).join('\n'))
  const delBullet = (i) => onCompany('highlights', lines.filter((_, k) => k !== i).join('\n'))
  const addBullet = () => onCompany('highlights', [...lines.filter((l, k) => l.trim() || k < lines.length - 1), ''].join('\n'))
  const F = (k, extra = {}) => edit
    ? <Ed value={k === 'hotline' ? hotline : company[k]} onChange={(v) => onCompany(k, v)} {...extra} />
    : <span>{k === 'hotline' ? hotline : company[k]}</span>
  const show = (k) => edit || (k === 'hotline' ? hotline : company[k])
  const opt = (k) => (edit && !(k === 'hotline' ? hotline : company[k]) ? 'q2-empty' : '')

  return (
    <header className="grid gap-5 grid-cols-[130px_minmax(0,1fr)_220px_210px] items-start">
      <div className="flex justify-center">
        <ImgEd value={company.logoUrl} onChange={(v) => onCompany('logoUrl', v)} edit={edit} label="Logo" max={700}
          className="w-[130px]" imgClassName="max-w-[140px] max-h-[100px] object-contain mx-auto" />
      </div>

      <div>
        <h1 className="text-[17px] font-bold text-[#1a1f2c] leading-snug">{F('name', { multiline: true })}</h1>
        {(edit || company.description) && <div className={`text-[13px] mt-1 leading-snug ${opt('description')}`}>{F('description', { multiline: true, placeholder: 'Mô tả ngắn' })}</div>}
        {bullets.length > 0 || edit ? (
          <ul className="mt-1.5 space-y-0.5 text-[13px] leading-snug">
            {bullets.map((b, i) => (
              <li key={i} className={`flex gap-2 group ${edit && !b.trim() ? 'q2-empty' : ''}`}>
                <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#ff4f25] shrink-0" />
                {edit ? <Ed value={b} onChange={(v) => setBullet(i, v)} placeholder="Gạch đầu dòng" /> : b}
                {edit && <button type="button" onClick={() => delBullet(i)} title="Xoá dòng" className="q2-noprint text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 leading-none">×</button>}
              </li>
            ))}
            {edit && <li className="q2-noprint"><button type="button" onClick={addBullet} className="text-[11px] text-[#c2410c] hover:underline">+ thêm gạch đầu dòng</button></li>}
          </ul>
        ) : null}
      </div>

      <ul className="space-y-2.5 text-[13px] leading-snug">
        {show('website') && (
          <li className={`flex gap-2 ${opt('website')}`}><Ic><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Ic><span className="shrink-0">Website:</span>{F('website', { placeholder: 'website' })}</li>
        )}
        {show('address') && (
          <li className={`flex gap-2 ${opt('address')}`}><Ic><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></Ic><span className="shrink-0">Địa chỉ:</span>{F('address', { multiline: true, placeholder: 'địa chỉ' })}</li>
        )}
        {show('hotline') && (
          <li className={`flex gap-2 ${opt('hotline')}`}><Ic><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Ic><span className="shrink-0">Hotline/Zalo:</span>{F('hotline', { placeholder: 'số điện thoại' })}</li>
        )}
        {show('email') && (
          <li className={`flex gap-2 ${opt('email')}`}><Ic><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Ic><span className="shrink-0">Email:</span>{F('email', { placeholder: 'email' })}</li>
        )}
      </ul>

      <div>
        <div className={`${heading.length > 10 ? 'text-[21px]' : 'text-[26px]'} font-extrabold leading-none text-[#1a1f2c] whitespace-nowrap`}>
          {edit ? <Ed value={heading} onChange={onTitle} /> : heading}
        </div>
        {(edit || company.brandName) && (
          <div className={`text-[26px] font-extrabold leading-tight text-[#ff4f25] ${opt('brandName')}`}>{F('brandName', { placeholder: 'THƯƠNG HIỆU' })}</div>
        )}
        <div className="text-[13px] mt-2 flex gap-1.5"><span className="shrink-0">{numberLabel}:</span>{edit ? <Ed value={code} onChange={onCode} className="font-bold" /> : <b>{code}</b>}</div>
        <div className="text-[13px] flex gap-1.5"><span className="shrink-0">Ngày:</span>{edit ? <DateEd value={date} onChange={onDate} mode={dateMode} className="font-bold" /> : <b>{dateMode === 'ymd' ? date : date ? fmtDate(date) : ''}</b>}</div>
      </div>
    </header>
  )
}
