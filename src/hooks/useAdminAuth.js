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

  return {
    user,
    isAdmin: !!user,
    login,
    logout,
    createAccount
  }
}