import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useAdminAuth() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('adminUser')
    return saved ? JSON.parse(saved) : null
  })

  const login = async (username, password) => {
    try {
      const { data, error } = await supabase
        .from('admin')
        .select('*')
        .eq('user', username) // 🌟 Đổi thành cột 'user'
        .eq('password', password)
        .maybeSingle()

      if (error) throw error

      if (data) {
        // Tài khoản bị khoá hoặc mật khẩu tạm đã hết hạn (72h) — cột do sql/quote2_migration.sql thêm
        if (data.is_active === false) {
          return { success: false, error: 'Tài khoản đã bị khoá. Liên hệ quản lý.' }
        }
        if (data.temp_password_expires_at && new Date(data.temp_password_expires_at) < new Date()) {
          return { success: false, error: 'Mật khẩu tạm đã hết hạn. Hãy xin quản lý cấp lại.' }
        }
        setUser(data)
        localStorage.setItem('adminUser', JSON.stringify(data))
        return { success: true }
      } else {
        return { success: false, error: 'Sai tên đăng nhập hoặc mật khẩu!' }
      }
    } catch (err) {
      console.error('Lỗi đăng nhập:', err.message)
      return { success: false, error: 'Lỗi kết nối máy chủ.' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('adminUser')
  }

  const createAccount = async (username, password, fullName, role) => {
    try {
      const { data: existing } = await supabase
        .from('admin')
        .select('user') // 🌟 Đổi thành cột 'user'
        .eq('user', username) // 🌟 Đổi thành cột 'user'
        .maybeSingle()
        
      if (existing) return { success: false, error: 'Tên đăng nhập đã tồn tại!' }

      const { error } = await supabase
        .from('admin')
        .insert([{ user: username, password, full_name: fullName, role }]) // 🌟 Ghi vào cột 'user'

      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // Đổi mật khẩu của chính mình (dùng cho trang báo giá mới, cũng xoá cờ "phải đổi mật khẩu")
  const changePassword = async (oldPassword, newPassword) => {
    if (!user) return { success: false, error: 'Chưa đăng nhập.' }
    if (String(newPassword).length < 6) return { success: false, error: 'Mật khẩu mới tối thiểu 6 ký tự.' }
    try {
      const { data: row, error: e1 } = await supabase
        .from('admin').select('id').eq('id', user.id).eq('password', oldPassword).maybeSingle()
      if (e1) throw e1
      if (!row) return { success: false, error: 'Mật khẩu hiện tại không đúng.' }
      const patch = { password: newPassword, must_change_password: false, temp_password_expires_at: null }
      const { error: e2 } = await supabase.from('admin').update(patch).eq('id', user.id)
      if (e2) throw e2
      const next = { ...user, ...patch }
      setUser(next)
      localStorage.setItem('adminUser', JSON.stringify(next))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  return {
    user,
    isAdmin: !!user,
    login,
    logout,
    createAccount,
    changePassword
  }
}