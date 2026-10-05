import { useState } from 'react'
import { Card, CardTitle, Field, Btn, inputCls, Empty } from '../components/ui.jsx'
import TempPasswordBox from '../components/TempPasswordBox.jsx'
import { useStaff } from '../hooks/useStaff.js'
import { ROLE_LABELS } from '../lib/permissions.js'
import { fmtDate } from '../lib/format.js'
import { useDialog } from '../components/Dialogs.jsx'

export default function AccountsPage({ me }) {
  const dialog = useDialog()
  const { staff, requests, loading, error, createStaff, resetPassword, updateRole, setActive } = useStaff(true)
  const [form, setForm] = useState({ fullName: '', username: '', role: 'sale' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [temp, setTemp] = useState(null) // {username, password}

  const create = async (e) => {
    e.preventDefault()
    setMsg('')
    if (!form.fullName.trim() || !form.username.trim()) return setMsg('Nhập họ tên và tên đăng nhập.')
    setBusy(true)
    const res = await createStaff(form)
    setBusy(false)
    if (!res.ok) return setMsg(res.error)
    setTemp({ username: form.username.trim(), password: res.tempPassword })
    setForm({ fullName: '', username: '', role: 'sale' })
  }

  const reset = async (row) => {
    const ok = await dialog.confirm({
      tone: 'warning', icon: 'key', title: `Cấp lại mật khẩu cho «${row.user}»?`,
      message: 'Hệ thống sẽ tạo một mật khẩu tạm (hiệu lực 72 giờ). Mật khẩu cũ của tài khoản này sẽ mất hiệu lực ngay lập tức.',
      confirmText: 'Cấp mật khẩu mới', cancelText: 'Huỷ',
    })
    if (!ok) return
    const res = await resetPassword(row)
    if (!res.ok) return setMsg(res.error)
    setTemp({ username: row.user, password: res.tempPassword })
  }

  const isMe = (r) => String(r.id) === String(me.id)

  return (
    <div className="space-y-4">
      {error && <div className="text-sm bg-red-50 border border-red-100 text-red-700 rounded-lg p-3">{error}</div>}

      <Card>
        <CardTitle>Yêu cầu cấp lại mật khẩu</CardTitle>
        {requests.length === 0 ? <p className="text-sm text-[#6b7280]">Không có yêu cầu nào.</p> : (
          <ul className="divide-y divide-[#eef0f3]">
            {requests.map((r) => {
              const row = staff.find((s) => s.user === r.username)
              return (
                <li key={r.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <span><b>{r.username}</b> <span className="text-xs text-[#6b7280]">· {fmtDate(r.created_at)}</span></span>
                  {row && <Btn variant="sm" onClick={() => reset(row)}>Cấp lại mật khẩu</Btn>}
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle sub="Hệ thống tạo mật khẩu tạm (hiệu lực 72 giờ). Gửi cho nhân viên qua Zalo, nhân viên đăng nhập lần đầu sẽ phải đặt mật khẩu riêng.">
          Thêm tài khoản nhân viên
        </CardTitle>
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_.8fr_auto] items-end">
          <Field label="Họ tên"><input className={inputCls} placeholder="VD: Nguyễn Thu Hà" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label="Tên đăng nhập"><input className={inputCls} placeholder="VD: thuha" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
          <Field label="Vai trò">
            <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="sale">Sale</option><option value="editor">Biên tập viên</option><option value="admin">Quản lý</option>
            </select>
          </Field>
          <Btn variant="primary" onClick={create} disabled={busy}>{busy ? 'Đang tạo…' : 'Tạo tài khoản'}</Btn>
        </form>
        {msg && <p className="text-xs text-red-600 mt-2">{msg}</p>}
        {temp && <TempPasswordBox username={temp.username} password={temp.password} onClose={() => setTemp(null)} />}
      </Card>

      <Card>
        <CardTitle>Danh sách tài khoản</CardTitle>
        {loading ? <Empty>Đang tải…</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead><tr className="text-xs text-[#4b5563] border-b border-[#e3e7ec] text-left">
                <th className="py-2 font-semibold">Họ tên</th><th className="font-semibold">Tên đăng nhập</th>
                <th className="font-semibold">Vai trò</th><th className="font-semibold">Trạng thái</th><th /></tr></thead>
              <tbody>
                {staff.map((r) => (
                  <tr key={r.id} className="border-b border-[#eef0f3]">
                    <td className="py-2.5 font-semibold">{r.full_name || '—'}{isMe(r) && <span className="text-xs font-normal text-[#6b7280]"> (bạn)</span>}</td>
                    <td>{r.user}</td>
                    <td>
                      <select className="border border-[#dfe3e8] rounded-md px-2 py-1 text-sm bg-white disabled:opacity-60" value={r.role} disabled={isMe(r)}
                        onChange={async (e) => { const res = await updateRole(r.id, e.target.value); if (!res.ok) setMsg(res.error) }}>
                        {Object.entries(ROLE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                      </select>
                    </td>
                    <td>
                      {r.is_active === false
                        ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">● Đã khoá</span>
                        : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">● Đang hoạt động</span>}
                      {r.must_change_password && <div className="text-[11px] text-amber-700 mt-0.5">Đang dùng mật khẩu tạm</div>}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {!isMe(r) && <Btn variant="sm" onClick={() => setActive(r.id, r.is_active === false)}>{r.is_active === false ? 'Mở khoá' : 'Khoá'}</Btn>}{' '}
                      <Btn variant="sm" onClick={() => reset(r)}>Cấp lại mật khẩu</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
