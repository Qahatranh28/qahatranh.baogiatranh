import { useState } from 'react'

export default function AdminLogin({ onLogin, onClose }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const success = onLogin(username, password)
    if (!success) {
      setError('Sai tên đăng nhập hoặc mật khẩu.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-blueprint/40 px-4 pt-24 sm:pt-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-paper rounded-2xl border border-line p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-semibold text-lg text-blueprint">
            Đăng nhập Admin
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-blueprint-light hover:text-blueprint text-xl leading-none"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-blueprint-light mb-5">
          Xem giá vốn và biên lợi nhuận chi tiết.
        </p>

        <label
          htmlFor="admin-username"
          className="block font-mono text-xs uppercase tracking-widest text-blueprint-light mb-1"
        >
          Tên đăng nhập
        </label>
        <input
          id="admin-username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border-2 border-line focus:border-amber rounded-md px-3 py-2 mb-4 outline-none transition-colors"
        />

        <label
          htmlFor="admin-password"
          className="block font-mono text-xs uppercase tracking-widest text-blueprint-light mb-1"
        >
          Mật khẩu
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border-2 border-line focus:border-amber rounded-md px-3 py-2 mb-2 outline-none transition-colors"
        />

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        <p className="text-xs text-blueprint-light/70 mb-5">
          Demo: admin / admin123
        </p>

        <button
          type="submit"
          className="w-full bg-blueprint text-paper font-medium rounded-md py-2.5 hover:bg-blueprint-light transition-colors"
        >
          Đăng nhập
        </button>
      </form>
    </div>
  )
}
