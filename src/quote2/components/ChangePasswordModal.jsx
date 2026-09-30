import { useState } from 'react'
import { Modal, Field, inputCls, Btn } from './ui.jsx'

export default function ChangePasswordModal({ onSubmit, onClose, forced = false }) {
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [again, setAgain] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e?.preventDefault()
    setErr('')
    if (newPw !== again) return setErr('Mật khẩu nhập lại không khớp.')
    setBusy(true)
    const res = await onSubmit(oldPw, newPw)
    setBusy(false)
    if (!res.success) return setErr(res.error)
    onClose?.()
  }

  return (
    <Modal
      title={forced ? 'Đặt mật khẩu riêng để tiếp tục' : 'Đổi mật khẩu'}
      onClose={forced ? undefined : onClose}
      footer={
        <>
          {!forced && <Btn onClick={onClose}>Huỷ</Btn>}
          <Btn variant="primary" onClick={submit} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu mật khẩu'}</Btn>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        {forced && <p className="text-sm text-[#6b7280]">Bạn đang dùng mật khẩu tạm. Hãy đặt mật khẩu riêng (tối thiểu 6 ký tự).</p>}
        {err && <div className="text-xs bg-red-50 border border-red-100 text-red-600 rounded-md p-2.5">{err}</div>}
        <Field label={forced ? 'Mật khẩu tạm' : 'Mật khẩu hiện tại'}>
          <input type="password" className={inputCls} value={oldPw} onChange={(e) => setOldPw(e.target.value)} autoFocus />
        </Field>
        <Field label="Mật khẩu mới">
          <input type="password" className={inputCls} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
        </Field>
        <Field label="Nhập lại mật khẩu mới">
          <input type="password" className={inputCls} value={again} onChange={(e) => setAgain(e.target.value)} />
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
