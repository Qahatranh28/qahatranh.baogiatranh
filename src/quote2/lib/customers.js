// Khách hàng KHÔNG có bảng riêng: được gom tự động từ các báo giá (theo SĐT nếu có, không thì theo tên).
// Ưu điểm: không bao giờ lệch dữ liệu giữa "khách" và "báo giá".
import { calcQuote } from './calc.js'

export const phoneDigits = (p) => String(p || '').replace(/\D/g, '')
export const customerKey = (name, phone) => {
  const d = phoneDigits(phone)
  return d.length >= 8 ? `p:${d}` : `n:${String(name || '').trim().toLowerCase()}`
}

export function buildCustomers(quotes) {
  const map = new Map()
  for (const q of quotes) {
    if (!String(q.customerName || '').trim() && !phoneDigits(q.customerPhone)) continue
    const key = customerKey(q.customerName, q.customerPhone)
    let c = map.get(key)
    if (!c) {
      c = { key, name: q.customerName || '', phone: q.customerPhone || '', firstAt: q.createdAt, quotes: [] }
      map.set(key, c)
    }
    c.quotes.push(q)
    if (new Date(q.createdAt) < new Date(c.firstAt)) c.firstAt = q.createdAt
    // lấy tên/SĐT từ báo giá mới nhất có giá trị
    if (!c.phone && q.customerPhone) c.phone = q.customerPhone
  }
  return [...map.values()]
    .map((c) => {
      c.quotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      const won = c.quotes.filter((q) => q.status === 'won')
      return {
        ...c,
        total: c.quotes.length,
        won: won.length,
        lost: c.quotes.filter((q) => q.status === 'lost').length,
        revenueWon: won.reduce((s, q) => s + calcQuote(q).grandTotal, 0),
        lastAt: c.quotes[0]?.createdAt,
      }
    })
    .sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt))
}
