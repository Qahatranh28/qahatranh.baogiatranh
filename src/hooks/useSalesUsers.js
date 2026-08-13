import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

// 🌟 Lấy danh sách toàn bộ tài khoản (admin/editor/sale) để hiển thị tên trong Dashboard doanh số.
// Chỉ lấy các cột không nhạy cảm (không lấy password).
export function useSalesUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('admin')
        .select('id, user, full_name, role')

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err.message)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // map id -> tên hiển thị, tiện dùng trong bảng/biểu đồ
  const nameById = users.reduce((acc, u) => {
    acc[u.id] = u.full_name || u.user || `User #${u.id}`
    return acc
  }, {})

  return { users, nameById, loading, refreshUsers: fetchUsers }
}
