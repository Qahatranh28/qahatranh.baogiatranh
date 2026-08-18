import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { fetchMoebeFrameTypes, fetchMoebeSizes } from '../services/moebeSizeService.js'

export function useMoebePrices() {
  const [frameTypes, setFrameTypes] = useState([])
  const [sizes, setSizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [types, sizeData] = await Promise.all([fetchMoebeFrameTypes(), fetchMoebeSizes()])
      const normalized = (sizeData || []).map((row, index) => ({
        ...row,
        __rowKey:
          row.id ??
          `${row.size_label ?? 'size'}-${row.width ?? 0}-${row.height ?? 0}-${row.inner_width ?? 0}-${row.inner_height ?? 0}-${index}`,
      }))
      setFrameTypes(types)
      setSizes(normalized)
    } catch (err) {
      console.error('Lỗi tải giá Moebe:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateLocalSize = (rowKey, field, value) => {
    setSizes((prev) =>
      prev.map((row) =>
        row.__rowKey === rowKey ? { ...row, [field]: value === '' ? null : Number(value) } : row
      )
    )
  }

  const saveAllToDB = async () => {
    setSaving(true)
    try {
      const rows = sizes.map((s) => {
        const { __rowKey, frame_id, ...rest } = s
        return {
          ...rest,
          id: s.id ?? null,
          size_label: s.size_label,
          width: s.width,
          height: s.height,
          inner_width: s.inner_width,
          inner_height: s.inner_height,
          price: s.price != null ? Number(s.price) : null,
          price_print: s.price_print != null ? Number(s.price_print) : null,
        }
      })

      const rowsWithId = rows.filter((row) => row.id != null)
      const rowsWithoutId = rows.filter((row) => row.id == null)

      if (rowsWithId.length > 0) {
        const { error } = await supabase.from('frame_size_moebe').upsert(rowsWithId, { onConflict: 'id' })
        if (error) throw error
      }

      if (rowsWithoutId.length > 0) {
        const { error } = await supabase.from('frame_size_moebe').upsert(rowsWithoutId, { onConflict: 'size_label' })
        if (error) throw error
      }

      alert('Đã lưu bảng giá Khung Moebe lên cơ sở dữ liệu!')
    } catch (err) {
      alert('Lỗi khi lưu: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return { frameTypes, sizes, loading, saving, updateLocalSize, saveAllToDB, reload: load }
}
