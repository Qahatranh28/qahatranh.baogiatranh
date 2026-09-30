import { useState } from 'react'
import { Btn } from './ui.jsx'

// Hiện mật khẩu tạm (chỉ hiện 1 lần) để quản lý copy gửi nhân viên qua Zalo
export default function TempPasswordBox({ username, password, onClose }) {
  const [copied, setCopied] = useState(false)
  const text = `Tài khoản hệ thống báo giá\nTên đăng nhập: ${username}\nMật khẩu tạm: ${password}\n(Hiệu lực 72 giờ, đăng nhập lần đầu sẽ phải đặt mật khẩu riêng.)`
  const copy = async () => {
    try { await navigator.clipboard.writeText(text) } catch { /* bỏ qua */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="mt-4 border border-emerald-200 bg-emerald-50 rounded-lg p-4">
      <p className="text-sm font-semibold text-emerald-800">Mật khẩu tạm cho «{username}» — chỉ hiện một lần</p>
      <div className="mt-2 flex items-center gap-3 flex-wrap">
        <code className="text-lg font-mono font-bold tracking-widest bg-white border border-emerald-200 rounded px-3 py-1">{password}</code>
        <Btn variant="ghost" onClick={copy}>{copied ? 'Đã copy ✓' : 'Copy nội dung gửi Zalo'}</Btn>
        <Btn variant="ghost" onClick={onClose}>Ẩn</Btn>
      </div>
      <p className="text-xs text-emerald-700 mt-2">Hiệu lực 72 giờ. Nhân viên đăng nhập lần đầu sẽ phải đặt mật khẩu riêng.</p>
    </div>
  )
}
