import { useState } from 'react'
import { Modal, Field, inputCls, Btn } from './ui.jsx'
import { DEFAULT_COMPANY, DEFAULT_TERMS, TERMS_PLACEHOLDER } from '../lib/defaults.js'

// Thu nhỏ logo tải lên để lưu gọn trong JSON (tối đa 320px)
function fileToLogo(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const max = 320
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Không đọc được ảnh'))
    img.src = url
  })
}

const COMPANY_FIELDS = [
  ['name', 'Tên công ty / thương hiệu'],
  ['tagline', 'Khẩu hiệu / mô tả ngắn'],
  ['address', 'Địa chỉ'],
  ['phone', 'Điện thoại / Zalo'],
  ['email', 'Email'],
  ['website', 'Website'],
  ['taxCode', 'Mã số thuế'],
  ['bankName', 'Ngân hàng'],
  ['bankAccount', 'Số tài khoản'],
  ['bankHolder', 'Chủ tài khoản'],
]

// kind: 'company' | 'terms'. Lưu theo 2 phạm vi: chỉ báo giá này / mặc định cho mọi báo giá.
export default function PreviewEditModal({ kind, current, hasOverride, canEditQuote, canEditDefaults, onSaveQuote, onSaveDefault, onResetQuote, onClose }) {
  const [form, setForm] = useState({ ...(kind === 'company' ? DEFAULT_COMPANY : DEFAULT_TERMS), ...current })
  const [scope, setScope] = useState(canEditQuote ? 'quote' : 'default')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setBusy(true); setErr('')
    const res = scope === 'quote' ? await onSaveQuote(form) : await onSaveDefault(form)
    setBusy(false)
    if (res && res.ok === false) return setErr(res.error || 'Không lưu được')
    onClose()
  }

  const pickLogo = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try { set('logoUrl', await fileToLogo(f)) } catch (x) { setErr(x.message) }
  }

  return (
    <Modal
      wide
      title={kind === 'company' ? 'Tùy chỉnh thông tin công ty' : 'Tùy chỉnh điều khoản'}
      onClose={onClose}
      footer={
        <>
          {hasOverride && canEditQuote && (
            <Btn variant="ghost" className="mr-auto" onClick={async () => { await onResetQuote(); onClose() }}>Bỏ tuỳ chỉnh riêng (dùng mặc định)</Btn>
          )}
          <Btn onClick={onClose}>Huỷ</Btn>
          <Btn variant="primary" onClick={save} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</Btn>
        </>
      }
    >
      <div className="space-y-4">
        {err && <div className="text-xs bg-red-50 border border-red-100 text-red-600 rounded-md p-2.5">{err}</div>}

        <div className="flex gap-4 flex-wrap text-sm">
          <label className={`flex items-center gap-2 ${canEditQuote ? '' : 'opacity-40'}`}>
            <input type="radio" checked={scope === 'quote'} disabled={!canEditQuote} onChange={() => setScope('quote')} />
            Chỉ báo giá này
          </label>
          <label className={`flex items-center gap-2 ${canEditDefaults ? '' : 'opacity-40'}`}>
            <input type="radio" checked={scope === 'default'} disabled={!canEditDefaults} onChange={() => setScope('default')} />
            Mặc định cho mọi báo giá
          </label>
        </div>

        {kind === 'company' ? (
          <>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg border border-[#dfe3e8] bg-[#f7f8fa] flex items-center justify-center overflow-hidden">
                {form.logoUrl ? <img src={form.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" /> : <span className="text-xs text-gray-400">Chưa có</span>}
              </div>
              <div className="space-y-2">
                <input type="file" accept="image/*" onChange={pickLogo} className="text-xs" />
                {form.logoUrl && <button onClick={() => set('logoUrl', '')} className="block text-xs text-red-600 hover:underline">Xoá logo</button>}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {COMPANY_FIELDS.map(([k, label]) => (
                <Field key={k} label={label} className={k === 'address' ? 'sm:col-span-2' : ''}>
                  <input className={inputCls} value={form[k] || ''} onChange={(e) => set(k, e.target.value)} />
                </Field>
              ))}
            </div>
          </>
        ) : (
          <>
            <Field label="Tiêu đề mục">
              <input className={inputCls} value={form.title || ''} onChange={(e) => set('title', e.target.value)} />
            </Field>
            <Field label="Nội dung (mỗi dòng là một điều khoản, tự đánh số)">
              <textarea rows={10} className={inputCls} placeholder={TERMS_PLACEHOLDER} value={form.body || ''} onChange={(e) => set('body', e.target.value)} />
            </Field>
          </>
        )}
      </div>
    </Modal>
  )
}
