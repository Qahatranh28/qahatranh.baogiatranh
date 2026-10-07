import { fmtDate } from '../lib/format.js'
import { Ed, DateEd, ImgEd, InlineAddress } from './Ed.jsx'

const Ic = ({ children }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ff4f25" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">{children}</svg>
)

// Dùng chung header cho các chứng từ; phần thân và tiêu đề phụ có thể thay đổi theo từng loại phiếu.
export default function CompanyHeader({
  company, code, date, title, numberLabel = 'Số báo giá', dateMode = 'iso',
  accentTitle, edit = false, showNumber = true, onCompany, onTitle, onCode, onDate, onAccentTitle,
}) {
  const heading = title ?? company.docTitle ?? 'BÁO GIÁ'
  const subheading = accentTitle ?? company.brandName
  const hotline = company.hotline || company.phone
  const lines = String(company.highlights || '').split('\n')
  const bullets = edit ? lines : lines.map((line) => line.trim()).filter(Boolean)
  const setBullet = (index, value) => onCompany('highlights', lines.map((line, i) => i === index ? value : line).join('\n'))
  const deleteBullet = (index) => onCompany('highlights', lines.filter((_, i) => i !== index).join('\n'))
  const addBullet = () => onCompany('highlights', [...lines.filter((line, i) => line.trim() || i < lines.length - 1), ''].join('\n'))
  const field = (key, extra = {}) => edit
    ? <Ed value={key === 'hotline' ? hotline : company[key]} onChange={(value) => onCompany(key, value)} {...extra} />
    : <span>{key === 'hotline' ? hotline : company[key]}</span>
  const contactField = (key, placeholder) => {
    const value = key === 'hotline' ? hotline : company[key]
    return edit
      ? <input
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => onCompany(key, event.target.value)}
        className="q2-contact-input"
        style={{ width: `${Math.max(4, String(value || placeholder || '').length + 1)}ch` }}
      />
      : <span>{value}</span>
  }
  const show = (key) => edit || (key === 'hotline' ? hotline : company[key])
  const optionalClass = (key) => edit && !(key === 'hotline' ? hotline : company[key]) ? 'q2-empty' : ''

  return (
    <header className="-mr-4 grid grid-cols-[120px_minmax(0,1.8fr)_minmax(0,1fr)_180px] gap-3 items-start min-h-[190px]">
      <div className="flex flex-col items-center">
        <ImgEd value={company.logoUrl} onChange={(value) => onCompany('logoUrl', value)} edit={edit} label="Logo" max={700}
          className="w-[120px] h-[118px]" imgClassName="w-[120px] h-[118px] object-contain" />
      </div>

      <div className="text-[14px] leading-[1.4]">
        <h1 className="font-bold">{field('name', { multiline: true })}</h1>
        {(edit || company.description) && <div className={`mt-1 ${optionalClass('description')}`}>{field('description', { multiline: true, placeholder: 'Mô tả ngắn' })}</div>}
        {(bullets.length > 0 || edit) && (
          <ul className="mt-1">
            {bullets.map((line, index) => (
              <li key={index} className={`flex gap-1 group ${edit && !line.trim() ? 'q2-empty' : ''}`}>
                <span className="text-[#ff4f25]">•</span>
                <span className="flex-1">{edit ? <Ed value={line} onChange={(value) => setBullet(index, value)} placeholder="Gạch đầu dòng" /> : line}</span>
                {edit && <button type="button" onClick={() => deleteBullet(index)} title="Xoá dòng" className="q2-noprint text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 leading-none">×</button>}
              </li>
            ))}
            {edit && <li className="q2-noprint"><button type="button" onClick={addBullet} className="text-[10px] text-[#c2410c]">+ Thêm nội dung</button></li>}
          </ul>
        )}
      </div>

      <ul className="text-[13px] leading-[1.5] space-y-2">
        {show('website') && (
          <li className={`flex gap-2 ${optionalClass('website')}`}>
            <Ic><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Ic>
            <span className="whitespace-nowrap"><strong>Website:</strong> {contactField('website', 'website')}</span>
          </li>
        )}
        {show('address') && (
          <li className={`flex gap-2 ${optionalClass('address')}`}>
            <Ic><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></Ic>
            <span className="q2-company-address min-w-0">
              <InlineAddress value={company.address} onChange={(value) => onCompany('address', value)} edit={edit} />
            </span>
          </li>
        )}
        {show('hotline') && (
          <li className={`flex gap-2 ${optionalClass('hotline')}`}>
            <Ic><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.58 2.8.7A2 2 0 0 1 22 16.92z" /></Ic>
            <span className="whitespace-nowrap"><strong>Hotline/Zalo:</strong> {contactField('hotline', 'số điện thoại')}</span>
          </li>
        )}
        {show('email') && (
          <li className={`flex gap-2 ${optionalClass('email')}`}>
            <Ic><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Ic>
            <span className="whitespace-nowrap"><strong>Email:</strong> {contactField('email', 'email')}</span>
          </li>
        )}
      </ul>

      <div className="text-left justify-self-end w-fit max-w-full">
        <div className="text-[20px] font-extrabold leading-tight text-[#1a1f2c]">
          {edit ? <Ed value={heading} onChange={onTitle} /> : heading}
        </div>
        {(edit || subheading) && (
          <div className="text-[20px] leading-tight font-extrabold text-[#ff4f25]">
            {accentTitle !== undefined
              ? (edit ? <Ed value={accentTitle} onChange={onAccentTitle} /> : accentTitle)
              : field('brandName', { placeholder: 'THƯƠNG HIỆU' })}
          </div>
        )}
        {showNumber && <div className="text-[13px] mt-2 flex gap-1.5"><span className="shrink-0">{numberLabel}:</span>{edit ? <Ed value={code} onChange={onCode} className="font-bold" /> : <b>{code}</b>}</div>}
        <div className="text-[13px] flex gap-1.5"><span className="shrink-0">Ngày:</span>{edit ? <DateEd value={date} onChange={onDate} mode={dateMode} className="font-bold" /> : <b>{dateMode === 'ymd' ? date : date ? fmtDate(date) : ''}</b>}</div>
      </div>
    </header>
  )
}
