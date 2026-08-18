import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { fetchJerseyPrices } from '../services/jerseyPriceService.js'

export function useJerseyPrices() {
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchJerseyPrices()
      setPrices(
        data.map((p) => ({
          id: p.id,
          size_label: p.sizeLabel,
          price_basic: p.priceBasic,
          price_premium: p.pricePremium,
        }))
      )
    } catch (err) {
      console.error('Lỗi tải giá Khung áo đấu:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateLocal = (id, field, value) => {
    setPrices((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: value === '' ? null : Number(value) } : row
      )
    )
  }

  const saveAllToDB = async () => {
    setSaving(true)
    try {
      const rows = prices.map((p) => ({
        id: p.id,
        size_label: p.size_label,
        price_basic: p.price_basic != null ? Number(p.price_basic) : null,
        price_premium: p.price_premium != null ? Number(p.price_premium) : null,
      }))

      const { error } = await supabase.from('jersey_frame_prices').upsert(rows, { onConflict: 'id' })
      if (error) throw error
      alert('Đã lưu bảng giá Khung áo đấu lên cơ sở dữ liệu!')
    } catch (err) {
      alert('Lỗi khi lưu: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return { prices, loading, saving, updateLocal, saveAllToDB, reload: load }
}
