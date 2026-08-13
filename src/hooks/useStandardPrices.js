import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { parseDimensionsFromSizeName } from '../utils/sizeParsing.js'

export function useStandardPrices() {
  const [standardPrices, setStandardPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchPrices() {
      try {
        const [catalogRes, sizeRes] = await Promise.all([
          supabase.from('frame_catalog').select('frame_id, name'),
          supabase.from('frame_size').select('*')
        ])

        if (catalogRes.error) throw catalogRes.error
        if (sizeRes.error) throw sizeRes.error

        const catalogData = catalogRes.data || []
        const sizeData = sizeRes.data || []

        const catalogMap = {}
        catalogData.forEach(item => {
          catalogMap[item.frame_id] = item.name 
        })

        const formattedPrices = {}

        sizeData.forEach((item) => {
          const frameName = catalogMap[item.frame_id]
          const sizeName = item.size_name
          const price = item.price != null ? Number(item.price) : null

          if (frameName && sizeName) {
            if (!formattedPrices[frameName]) formattedPrices[frameName] = {}
            formattedPrices[frameName][sizeName] = price
          }
        })

        setStandardPrices(formattedPrices)
      } catch (err) {
        console.error('Lỗi tải giá tiêu chuẩn:', err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPrices()
  }, [])

  // Chỉ thay đổi trên giao diện (state cục bộ), không gọi DB ngay
  const setLocalPrice = (khungType, sizeLabel, value) => {
    const numValue = (value === '' || value === null || value === undefined) ? null : Number(value)
    setStandardPrices((prev) => ({
      ...prev,
      [khungType]: {
        ...(prev[khungType] || {}),
        [sizeLabel]: numValue,
      },
    }))
  }

  // Hàm lưu toàn bộ bảng giá lên DB khi bấm nút bên ngoài
  const saveAllPricesToDB = async () => {
    setSaving(true)
    try {
      console.log('1. Bắt đầu lưu bảng giá...', standardPrices)

      const { data: catalogData, error: catError } = await supabase
        .from('frame_catalog')
        .select('frame_id, name')

      if (catError) {
        console.error('Lỗi khi tải catalog:', catError)
        throw catError
      }

      const nameToIdMap = {}
      catalogData.forEach(item => {
        nameToIdMap[item.name] = item.frame_id
      })

      const upsertRows = []
      for (const [khungType, sizes] of Object.entries(standardPrices)) {
        const frameId = nameToIdMap[khungType]
        if (!frameId) {
          console.warn(`Không tìm thấy frame_id cho tên: ${khungType}`)
          continue
        }

        for (const [sizeLabel, price] of Object.entries(sizes)) {
          if (price !== null && price !== '' && price !== undefined) {
            // 🌟 Ghi luôn width/height suy ra từ tên size lên DB (bảng frame_size
            // trước đây chỉ có size_name + price) để việc so khớp "size lẻ gần
            // nhất" không còn phải phụ thuộc vào việc tự suy luận lúc đọc dữ liệu.
            const { width, height } = parseDimensionsFromSizeName(sizeLabel)
            upsertRows.push({
              frame_id: frameId,
              size_name: sizeLabel,
              width,
              height,
              price: Number(price)
            })
          }
        }
      }

      console.log('2. Dữ liệu chuẩn bị upsert:', upsertRows)

      if (upsertRows.length === 0) {
        alert('Không có dữ liệu giá nào để lưu!')
        setSaving(false)
        return
      }

      const { error: upsertError } = await supabase
        .from('frame_size')
        .upsert(upsertRows, { onConflict: ['frame_id', 'size_name'] })

      if (upsertError) {
        console.error('Lỗi Supabase upsert:', upsertError)
        throw upsertError
      }

      console.log('3. Lưu thành công!')
      alert('Đã lưu tất cả thay đổi bảng giá lên cơ sở dữ liệu thành công!')
    } catch (err) {
      console.error('Lỗi ngoại lệ khi lưu bảng giá:', err)
      alert('Lỗi khi lưu: ' + (err.message || err))
    } finally {
      setSaving(false)
    }
  }

  const resetStandardPrices = async () => {
    setStandardPrices({})
  }

  return { standardPrices, setLocalPrice, saveAllPricesToDB, resetStandardPrices, loading, saving }
}