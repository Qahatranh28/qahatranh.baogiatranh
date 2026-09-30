import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabaseClient'
import { genTempPassword } from '../lib/calc.js'

const TEMP_HOURS = 72
const COLS = 'id, user, full_name, role, is_active, must_change_password, temp_password_expires_at'

// Quản lý tài khoản nhân viên (bảng `admin` cũ) + yêu cầu cấp lại mật khẩu.
export function useStaff(enabled) {
  const [staff, setStaff] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError('')
    try {
      const [s, r] = await Promise.all([
        supabase.from('admin').select(COLS).order('id'),
        supabase.from('quote2_password_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }),
      ])
      if (s.error) throw s.error
      if (r.error) throw r.error
      setStaff(s.data || [])
      setRequests(r.data || [])
    } catch (err) {
      setError(
        /is_active|must_change_password|temp_password|does not exist|schema cache/i.test(err.message)
          ? 'Thiếu cột/bảng mới. Hãy chạy sql/quote2_migration.sql trong Supabase SQL Editor.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    load()
  }, [load])

  const tempExpiry = () => new Date(Date.now() + TEMP_HOURS * 3600 * 1000).toISOString()

  const createStaff = async ({ fullName, username, role }) => {
    const uname = username.trim()
    const { data: exist } = await supabase.from('admin').select('id').eq('user', uname).maybeSingle()
    if (exist) return { ok: false, error: 'Tên đăng nhập đã tồn tại.' }
    const tempPassword = genTempPassword()
    const { error: err } = await supabase.from('admin').insert([
      {
        user: uname,
        password: tempPassword,
        full_name: fullName.trim(),
        role,
        is_active: true,
        must_change_password: true,
        temp_password_expires_at: tempExpiry(),
      },
    ])
    if (err) return { ok: false, error: err.message }
    await load()
    return { ok: true, tempPassword }
  }

  const resetPassword = async (row) => {
    const tempPassword = genTempPassword()
    const { error: err } = await supabase
      .from('admin')
      .update({ password: tempPassword, must_change_password: true, temp_password_expires_at: tempExpiry() })
      .eq('id', row.id)
    if (err) return { ok: false, error: err.message }
    // đóng yêu cầu đang mở của tài khoản này
    await supabase.from('quote2_password_requests').update({ status: 'done' }).eq('username', row.user).eq('status', 'open')
    await load()
    return { ok: true, tempPassword }
  }

  const updateRole = async (id, role) => {
    const { error: err } = await supabase.from('admin').update({ role }).eq('id', id)
    if (err) return { ok: false, error: err.message }
    setStaff((p) => p.map((s) => (s.id === id ? { ...s, role } : s)))
    return { ok: true }
  }

  const setActive = async (id, active) => {
    const { error: err } = await supabase.from('admin').update({ is_active: active }).eq('id', id)
    if (err) return { ok: false, error: err.message }
    setStaff((p) => p.map((s) => (s.id === id ? { ...s, is_active: active } : s)))
    return { ok: true }
  }

  return { staff, requests, loading, error, reload: load, createStaff, resetPassword, updateRole, setActive }
}

// Nhân viên quên mật khẩu: gửi yêu cầu (không cần đăng nhập)
export async function requestPasswordReset(username) {
  const uname = String(username || '').trim()
  if (!uname) return { ok: false, error: 'Nhập tên đăng nhập.' }
  const { data: exist } = await supabase.from('admin').select('id').eq('user', uname).maybeSingle()
  if (!exist) return { ok: false, error: 'Không tìm thấy tên đăng nhập này.' }
  const { error } = await supabase.from('quote2_password_requests').insert([{ username: uname }])
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
