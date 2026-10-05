import { useState } from 'react'
import { Field, inputCls } from './ui.jsx'
import { resizeImage } from '../lib/image.js'

export function ImagePick({ label, value, onChange, hint, max }) {
  const [err, setErr] = useState('')
  const pick = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try { onChange(await resizeImage(f, max)); setErr('') } catch (x) { setErr(x.message) }
    e.target.value = ''
  }
  return (
    <div>
      <span className="block text-xs text-[#6b7280] mb-1">{label}</span>
      <div className="flex items-center gap-3">
        <div className="w-24 h-24 rounded-lg border border-[#dfe3e8] bg-[#f7f8fa] flex items-center justify-center overflow-hidden">
          {value ? <img src={value} alt="" className="max-w-full max-h-full object-contain" /> : <span className="text-xs text-gray-400">Chưa có</span>}
        </div>
        <div className="space-y-1.5">
          <input type="file" accept="image/*" onChange={pick} className="text-xs max-w-[210px]" />
          {value && <button type="button" onClick={() => onChange('')} className="block text-xs text-red-600 hover:underline">Xoá ảnh</button>}
          {hint && <p className="text-[11px] text-[#6b7280] max-w-[210px]">{hint}</p>}
          {err && <p className="text-[11px] text-red-600">{err}</p>}
        </div>
      </div>
    </div>
  )
}

const Section = ({ title, children }) => (
  <div className="border-t border-[#e3e7ec] pt-4">
    <h4 className="font-bold text-sm mb-3 text-[#1a1f2c]">{title}</h4>
    <div className="grid sm:grid-cols-2 gap-3">{children}</div>
  </div>
)

// Các trường thông tin công ty (dùng ở cửa sổ "Thông tin công ty" và trong từng phiếu).
// hideDocTitle: ẩn 2 dòng tiêu đề góc phải (phiếu có ô tiêu đề riêng)
export default function CompanyForm({ form, set, hideDocTitle = false }) {
  const text = (k, label, cls = '') => (
    <Field label={label} className={cls}><input className={inputCls} value={form[k] || ''} onChange={(e) => set(k, e.target.value)} /></Field>
  )
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <ImagePick label="Logo (đầu trang)" value={form.logoUrl} onChange={(v) => set('logoUrl', v)} max={700} hint="Nên dùng logo ngang, nền trong suốt (PNG)." />
      </div>
      <Section title="Giới thiệu">
        {text('name', 'Tên công ty', 'sm:col-span-2')}
        <Field label="Mô tả ngắn dưới tên công ty" className="sm:col-span-2">
          <textarea rows={2} className={inputCls} value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label="Các gạch đầu dòng (mỗi dòng một ý, hiện chấm cam)" className="sm:col-span-2">
          <textarea rows={4} className={inputCls} value={form.highlights || ''} onChange={(e) => set('highlights', e.target.value)} />
        </Field>
      </Section>
      <Section title="Liên hệ">
        {text('website', 'Website')}
        {text('hotline', 'Hotline / Zalo')}
        {text('address', 'Địa chỉ', 'sm:col-span-2')}
        {text('email', 'Email (không bắt buộc)')}
      </Section>
      {hideDocTitle ? (
        <Section title="Thương hiệu góc phải">{text('brandName', 'Dòng chữ cam dưới tiêu đề')}</Section>
      ) : (
        <Section title="Tiêu đề báo giá (góc phải)">
          {text('docTitle', 'Dòng 1 (chữ đen)')}
          {text('brandName', 'Dòng 2 (chữ cam)')}
        </Section>
      )}
      <Section title="Thông tin thanh toán">
        {text('bankName', 'Ngân hàng')}
        {text('bankAccount', 'Số tài khoản')}
        {text('bankHolder', 'Chủ tài khoản')}
        <ImagePick label="Mã QR thanh toán" value={form.qrUrl} onChange={(v) => set('qrUrl', v)} max={500} hint="Tải ảnh QR ngân hàng/VietQR của công ty." />
      </Section>
    </div>
  )
}
