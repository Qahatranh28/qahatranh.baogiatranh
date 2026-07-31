import { useEffect, useState } from 'react'
import { defaultStandardPrices } from '../data/khungCatalog.js'

const STORAGE_KEY = 'quote-app-standard-prices'

// Gộp dữ liệu đã lưu (nếu có) với bảng giá mặc định trong code — giữ lại các
// giá trị admin đã tự sửa, đồng thời vẫn thấy được các Loại khung mới thêm
// vào defaultStandardPrices sau này.
function mergeWithDefaults(saved) {
  const merged = {}
  for (const khungType of Object.keys(defaultStandardPrices)) {
    merged[khungType] = {
      ...defaultStandardPrices[khungType],
      ...(saved?.[khungType] || {}),
    }
  }
  for (const khungType of Object.keys(saved || {})) {
    if (!merged[khungType]) merged[khungType] = { ...saved[khungType] }
  }
  return merged
}

export function useStandardPrices() {
  const [prices, setPrices] = useState(() => mergeWithDefaults(null))

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setPrices(mergeWithDefaults(JSON.parse(raw)))
    } catch {
      // Bỏ qua nếu dữ liệu lưu bị lỗi, dùng giá trị mặc định
    }
  }, [])

  const updatePrice = (khungType, sizeLabel, value) => {
    setPrices((prev) => {
      const next = {
        ...prev,
        [khungType]: { ...prev[khungType], [sizeLabel]: value },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const resetPrices = () => {
    const fresh = mergeWithDefaults(null)
    setPrices(fresh)
    localStorage.removeItem(STORAGE_KEY)
  }

  return { prices, updatePrice, resetPrices }
}
