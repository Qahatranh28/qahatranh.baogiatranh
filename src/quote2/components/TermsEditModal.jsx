import { useState } from 'react'
import { Modal, Field, inputCls, Btn } from './ui.jsx'
import TermsBlock from './TermsBlock.jsx'
import TermsRowsEditor from './TermsRowsEditor.jsx'
import { DEFAULT_TERMS } from '../lib/defaults.js'
import { parseTerms, serializeTerms } from '../lib/richText.js'

// Cửa sổ chỉnh điều khoản (trong xem trước báo giá): lưu cho riêng báo giá này hoặc làm mặc định.
export default function TermsEditModal({ current, hasOverride, canEditQuote, canEditDefaults, onSaveQuote, onSaveDefault, onResetQuote, onClose }) {
  const [title, setTitle] = useState(current.title ?? DEFAULT_TERMS.title)
  const [rows, setRows] = useState(() => {
    const r = parseTerms(current.body)
    return r.length ? r : [{ level: 1, text: '' }]
  })
  const [scope, setScope] = useState(canEditQuote ? 'quote' : 'default')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const body = serializeTerms(rows)
  const save = async () => {
    setBusy(true); setErr('')
    const value = { title: title.trim() || DEFAULT_TERMS.title, body }
    const res = scope === 'quote' ? await onSaveQuote(value) : await onSaveDefault(value)
    setBusy(false)
    if (res?.ok === false) return setErr(res.error || 'Không lưu được')
    onClose()
  }

  return (
    <Modal
      wide
      title="Tùy chỉnh điều khoản"
      onClose={onClose}
      footer={
        <>
          {hasOverride && canEditQuote && <Btn className="mr-auto" onClick={async () => { await onResetQuote(); onClose() }}>Bỏ tuỳ chỉnh riêng (dùng mặc định)</Btn>}
          <Btn onClick={onClose}>Huỷ</Btn>
          <Btn variant="primary" onClick={save} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</Btn>
        </>
      }
    >
      <div className="space-y-4">
        {err && <div className="text-xs bg-red-50 border border-red-100 text-red-600 rounded-md p-2.5">{err}</div>}
        <div className="flex gap-4 flex-wrap text-sm">
          <label className={`flex items-center gap-2 ${canEditQuote ? '' : 'opacity-40'}`}>
            <input type="radio" checked={scope === 'quote'} disabled={!canEditQuote} onChange={() => setScope('quote')} /> Chỉ báo giá này
          </label>
          <label className={`flex items-center gap-2 ${canEditDefaults ? '' : 'opacity-40'}`}>
            <input type="radio" checked={scope === 'default'} disabled={!canEditDefaults} onChange={() => setScope('default')} /> Mặc định cho mọi báo giá
          </label>
        </div>

        <Field label="Tiêu đề mục"><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>

        <TermsRowsEditor rows={rows} setRows={setRows} />

        <div className="border-t border-[#e3e7ec] pt-4">
          <h4 className="font-bold text-sm mb-2">Xem trước</h4>
          <TermsBlock terms={{ title, body }} />
        </div>
      </div>
    </Modal>
  )
}
