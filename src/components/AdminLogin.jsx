import { useState } from 'react'

export default function AdminLogin({ onLogin, onCancel }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    
    // Gọi hàm login từ cha truyền xuống
    const res = await onLogin(username, password)
    
    if (res && !res.success) {
      // Nếu sai: Hiện lỗi
      setErrorMsg(res.error) 
    } else if (res && res.success) {
      // 🌟 NẾU ĐÚNG: Đóng form đăng nhập lại
      if (onCancel) {
        onCancel();
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-5 sm:p-6 max-w-sm w-full shadow-xl border border-line">
        
        {/* Header có nút X đóng */}
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-display font-semibold text-lg text-blueprint">
            Đăng nhập Admin
          </h3>
          <button 
            onClick={onCancel}
            className="text-blueprint/50 hover:text-blueprint text-xl font-medium leading-none"
          >
            &times;
          </button>
        </div>
        <p className="text-sm text-blueprint/60 mb-5">
          Xem giá vốn và biên lợi nhuận chi tiết.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 🌟 Hiển thị lỗi cực kỳ gọn gàng */}
          {errorMsg && (
            <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded-md border border-red-100 font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-blueprint/70 mb-1.5">
              Tên đăng nhập
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-amber bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-blueprint/70 mb-1.5">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-amber bg-white transition-colors"
            />
          </div>

          <p className="text-xs text-blueprint/50">Demo: admin / admin123</p>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a1f2c] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#1a1f2c]/90 transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? 'Đang kiểm tra...' : 'Đăng nhập'}
          </button>

        </form>
      </div>
    </div>
  )
}