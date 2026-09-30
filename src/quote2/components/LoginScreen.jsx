import { useState } from 'react'
import { Field, inputCls, Btn, Card } from './ui.jsx'
import { requestPasswordReset } from '../hooks/useStaff.js'

export default function LoginScreen({ onLogin, onBack }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setInfo(''); setBusy(true)
    const res = await onLogin(username.trim(), password)
    setBusy(false)
    if (!res.success) setErr(res.error)
  }

  const forgot = async () => {
    setErr(''); setInfo('')
    const res = await requestPasswordReset(username)
    if (!res.ok) return setErr(res.error)
    setInfo('Đã gửi yêu cầu. Quản lý sẽ cấp mật khẩu tạm và gửi bạn qua Zalo.')
  }

  return (
    <div className="min-h-screen bg-[#eef1f4] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm !p-6">
        <div className="flex items-center gap-3 mb-5">
          <img src="/images/logoCompany.png" alt="Qaha Tranh" className="w-12 h-12 rounded-lg" />
          <div>
            <h1 className="font-bold text-lg text-[#1a1f2c]">Hệ thống báo giá</h1>
            <p className="text-xs text-[#6b7280]">Đăng nhập để tiếp tục</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {err && <div className="text-xs bg-red-50 border border-red-100 text-red-600 rounded-md p-2.5">{err}</div>}
          {info && <div className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md p-2.5">{info}</div>}
          <Field label="Tên đăng nhập">
            <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
          </Field>
          <Field label="Mật khẩu">
            <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <button type="submit" disabled={busy} className="w-full bg-[#1a1f2c] text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50">
            {busy ? 'Đang kiểm tra…' : 'Đăng nhập'}
          </button>
        </form>
        <div className="flex justify-between mt-4 text-xs">
          <button onClick={forgot} className="text-[#ff4f25] hover:underline">Quên mật khẩu?</button>
          <button onClick={onBack} className="text-[#6b7280] hover:underline">← Chọn chế độ khác</button>
        </div>
      </Card>
    </div>
  )
}
