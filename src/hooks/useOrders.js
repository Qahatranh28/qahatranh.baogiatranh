import { useCallback, useEffect, useState } from 'react'

// Lưu lịch sử báo giá ngay trên trình duyệt (localStorage).
// Lưu ý: dữ liệu chỉ tồn tại trên máy/trình duyệt hiện tại — nếu đổi máy hoặc
// xoá dữ liệu trình duyệt sẽ mất lịch sử. Muốn dùng chung nhiều máy/nhân viên,
// cần thay phần này bằng một API lưu vào cơ sở dữ liệu thật (backend).
const STORAGE_KEY = 'quote-app-orders'

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useOrders() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    setOrders(loadOrders())
  }, [])

  const persist = (next) => {
    setOrders(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const saveOrder = useCallback((order) => {
    const record = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...order,
    }
    persist([record, ...loadOrders()])
    return record
  }, [])

  const deleteOrder = useCallback((id) => {
    persist(loadOrders().filter((o) => o.id !== id))
  }, [])

  return { orders, saveOrder, deleteOrder }
}
