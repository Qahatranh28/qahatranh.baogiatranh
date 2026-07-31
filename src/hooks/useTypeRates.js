import { useEffect, useState } from 'react'
import { khungTypeRates as defaultKhungTypeRates } from '../data/khungCatalog.js'
import { tranhInTypeRates as defaultTranhInTypeRates } from '../data/frameDefaults.js'

// Cho phép Admin sửa "giá gốc" (đơn giá) riêng theo từng Loại khung và từng
// Loại tranh in ngay trong "Công cụ tính giá thành khung tranh" — dữ liệu
// khởi tạo lấy từ khungTypeRates / tranhInTypeRates (data/khungCatalog.js,
// data/frameDefaults.js), sau đó admin chỉnh sửa sẽ được lưu vào localStorage
// và ưu tiên dùng thay cho giá trị mặc định trong code.
const STORAGE_KEY = 'quote-app-type-rates'

const defaults = {
  khung: { ...defaultKhungTypeRates },
  tranhIn: { ...defaultTranhInTypeRates },
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      return {
        khung: { ...defaults.khung, ...(saved?.khung || {}) },
        tranhIn: { ...defaults.tranhIn, ...(saved?.tranhIn || {}) },
      }
    }
  } catch {
    // Bỏ qua nếu dữ liệu lưu bị lỗi, dùng giá trị mặc định
  }
  return { khung: { ...defaults.khung }, tranhIn: { ...defaults.tranhIn } }
}

export function useTypeRates() {
  const [typeRates, setTypeRates] = useState(loadInitial)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        setTypeRates({
          khung: { ...defaults.khung, ...(saved?.khung || {}) },
          tranhIn: { ...defaults.tranhIn, ...(saved?.tranhIn || {}) },
        })
      }
    } catch {
      // Bỏ qua nếu dữ liệu lưu bị lỗi
    }
  }, [])

  const updateTypeRate = (group, typeName, value) => {
    setTypeRates((prev) => {
      const next = {
        ...prev,
        [group]: { ...prev[group], [typeName]: value === '' ? '' : Number(value) },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const resetTypeRates = () => {
    const fresh = { khung: { ...defaults.khung }, tranhIn: { ...defaults.tranhIn } }
    setTypeRates(fresh)
    localStorage.removeItem(STORAGE_KEY)
  }

  return { typeRates, updateTypeRate, resetTypeRates }
}
