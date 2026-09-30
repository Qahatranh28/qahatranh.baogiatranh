import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabaseClient'
import { DEFAULT_COMPANY, DEFAULT_TERMS } from '../lib/defaults.js'

// Thông tin công ty + điều khoản MẶC ĐỊNH dùng chung (bảng quote2_settings, key: 'company' | 'terms').
// Mỗi báo giá còn có thể ghi đè riêng (quote.previewOverrides).
export function useQuote2Settings() {
  const [company, setCompany] = useState(DEFAULT_COMPANY)
  const [terms, setTerms] = useState(DEFAULT_TERMS)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('quote2_settings').select('key, value')
      if (error) throw error
      for (const row of data || []) {
        if (row.key === 'company') setCompany({ ...DEFAULT_COMPANY, ...row.value })
        if (row.key === 'terms') setTerms({ ...DEFAULT_TERMS, ...row.value })
      }
    } catch (err) {
      console.error('Lỗi tải cài đặt báo giá:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async (key, value, user) => {
    const { error } = await supabase
      .from('quote2_settings')
      .upsert({ key, value, updated_by: user?.user || '', updated_at: new Date().toISOString() })
    if (error) return { ok: false, error: error.message }
    if (key === 'company') setCompany({ ...DEFAULT_COMPANY, ...value })
    if (key === 'terms') setTerms({ ...DEFAULT_TERMS, ...value })
    return { ok: true }
  }

  return { company, terms, loading, saveCompany: (v, u) => save('company', v, u), saveTerms: (v, u) => save('terms', v, u) }
}
