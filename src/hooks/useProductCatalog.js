import { useMemo } from 'react'

// Xây danh sách tên sản phẩm đã từng nhập (từ lịch sử báo giá đã lưu) để
// gợi ý lại khi người dùng gõ tên sản phẩm.
export function useProductCatalog(orders) {
  return useMemo(() => {
    const names = []
    const seen = new Set()

    // Duyệt từ đơn mới nhất -> cũ nhất để tên gần đây luôn được ưu tiên
    for (const order of orders) {
      for (const item of order.items ?? []) {
        const key = item.name.trim().toLowerCase()
        if (!key) continue
        if (!seen.has(key)) {
          seen.add(key)
          names.push(item.name.trim())
        }
      }
    }

    return { names }
  }, [orders])
}
