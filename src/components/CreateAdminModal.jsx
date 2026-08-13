import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function CreateAdminModal({ isOpen, onClose }) {
  const [fullName, setFullName] = useState('') // 👈 State cho Họ và tên
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('') 
  const [role, setRole] = useState('editor') // 👈 State cho phân quyền (Mặc định là editor)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim() || !confirmPassword.trim() || !fullName.trim()) {
      return alert('Vui lòng nhập đầy đủ thông tin!')
    }

    if (password !== confirmPassword) {
      return alert('Mật khẩu xác nhận không khớp! Vui lòng nhập lại.')
    }

    setLoading(true)
    try {
      // 🌟 Sửa lại select('user') và eq('user', ...)
      const { data: existingUser } = await supabase
        .from('admin')
        .select('user') 
        .eq('user', username.trim())
        .maybeSingle()

      if (existingUser) {
        setLoading(false)
        return alert('Tên đăng nhập này đã tồn tại! Vui lòng chọn tên khác.')
      }

      // 🌟 Sửa trường username thành user khi insert
      const { error } = await supabase.from('admin').insert([
        {
          user: username.trim(), 
          password: password.trim(), 
          full_name: fullName.trim(),
          role: role,
        },
      ])

      if (error) throw error

      alert('Tạo tài khoản thành công!')
      setFullName('')
      setUsername('')
      setPassword('')
      setConfirmPassword('')
      setRole('editor')
      onClose()
    } catch (err) {
      console.error('Lỗi khi tạo tài khoản:', err.message)
      alert('Lỗi khi tạo tài khoản: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Nới rộng max-w-sm thành max-w-md để form trông cân đối hơn khi có nhiều ô */}
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl border border-line">
        <h3 className="font-display font-semibold text-lg text-blueprint mb-4">
          Tạo tài khoản hệ thống
        </h3>
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          
          {/* 🌟 Ô nhập Họ và Tên */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-blueprint/70 mb-1">
              Họ và tên (Full Name)
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên người dùng..."
              className="w-full border border-line rounded px-3 py-2 text-sm outline-none focus:border-amber"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-blueprint/70 mb-1">
              Tên đăng nhập (Username)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập..."
              className="w-full border border-line rounded px-3 py-2 text-sm outline-none focus:border-amber"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-blueprint/70 mb-1">
              Mật khẩu (Password)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full border border-line rounded px-3 py-2 text-sm outline-none focus:border-amber"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-blueprint/70 mb-1">
              Xác nhận mật khẩu (Confirm Password)
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu..."
              className="w-full border border-line rounded px-3 py-2 text-sm outline-none focus:border-amber"
            />
          </div>

          {/* 🌟 Ô chọn Phân Quyền */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-blueprint/70 mb-1">
              Phân quyền (Role)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-line rounded px-3 py-2 text-sm outline-none focus:border-amber bg-white"
            >
              <option value="sale">Sale (Chỉ tạo báo giá cho khách)</option>
              <option value="editor">Biên tập viên (Thêm/Xóa sản phẩm)</option>
              <option value="admin">Quản trị viên (Toàn quyền hệ thống)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-blueprint/60 hover:text-blueprint"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blueprint text-paper px-4 py-2 rounded text-sm font-medium hover:bg-blueprint-light transition-colors"
            >
              {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}