// Toàn bộ công thức tính của báo giá mới. Một nguồn duy nhất cho editor, preview, thống kê.

const num = (v) => Number(v) || 0

export function calcQuote(quote) {
  const items = quote?.items || []
  const d = Math.min(100, Math.max(0, num(quote?.discountPercent)))
  const taxRate = num(quote?.taxRate)
  const minMargin = num(quote?.minMargin)

  const lines = items.map((it) => {
    const qty = num(it.quantity)
    const revenue = qty * num(it.unitPrice)
    const cost = qty * num(it.unitCost)
    const revenueAfter = revenue * (1 - d / 100)
    const profitAfter = revenueAfter - cost
    return {
      ...it,
      revenue,
      cost,
      profitUnit: num(it.unitPrice) - num(it.unitCost),
      profit: revenue - cost,
      revenueAfter,
      profitAfter,
      marginAfter: revenueAfter > 0 ? (profitAfter / revenueAfter) * 100 : 0,
    }
  })

  const subtotal = lines.reduce((s, l) => s + l.revenue, 0)
  const totalCost = lines.reduce((s, l) => s + l.cost, 0)
  const discountAmount = subtotal * (d / 100)
  const afterDiscount = subtotal - discountAmount
  const taxAmount = afterDiscount * (taxRate / 100)
  const grandTotal = afterDiscount + taxAmount // thuế thu hộ: KHÔNG tính vào lời

  const profitBefore = subtotal - totalCost
  const marginBefore = subtotal > 0 ? (profitBefore / subtotal) * 100 : 0
  const profitAfter = afterDiscount - totalCost
  const marginAfter = afterDiscount > 0 ? (profitAfter / afterDiscount) * 100 : 0

  // Để đạt biên tối thiểu: doanh thu sau CK phải >= cost / (1 - min%)
  const requiredAfter = minMargin < 100 ? totalCost / (1 - minMargin / 100) : Infinity
  const maxDiscount = subtotal > 0 ? Math.max(0, (1 - requiredAfter / subtotal) * 100) : 0
  const shortfall = Math.max(0, requiredAfter - afterDiscount)
  // true nếu chỉ cần giảm chiết khấu là đạt biên (giá trước CK đã đủ cao)
  const reachableByDiscount = subtotal > 0 && subtotal >= requiredAfter

  const hasCost = totalCost > 0
  const passes = afterDiscount > 0 && hasCost && marginAfter + 1e-9 >= minMargin

  return {
    lines, discountPercent: d, taxRate, minMargin,
    subtotal, totalCost, discountAmount, afterDiscount, taxAmount, grandTotal,
    profitBefore, marginBefore, profitAfter, marginAfter,
    requiredAfter, maxDiscount, shortfall, reachableByDiscount, hasCost, passes,
    // 🌟 Sửa ở đây: Tính tổng quantity của tất cả các dòng thay vì chỉ đếm số dòng (lines.length)
    itemCount: lines.reduce((sum, l) => sum + num(l.quantity), 0),
  }
}

const rand = (n) => {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // bỏ I, O, 0, 1 cho dễ đọc
  let s = ''
  for (let i = 0; i < n; i++) s += abc[Math.floor(Math.random() * abc.length)]
  return s
}
export const genQuoteCode = (date = new Date()) => {
  const yy = String(date.getFullYear()).slice(2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `BG${yy}${mm}${dd}-${rand(4)}`
}
export const genTempPassword = () => rand(8)

export const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)

export const newItem = (position = 0) => ({
  id: uid(), position, name: '', size: '', quantity: 1, unitCost: 0, unitPrice: 0,
})

export const newQuote = (user, defaults = {}) => ({
  id: null, // null = chưa lưu vào DB
  code: genQuoteCode(),
  customerName: '', customerPhone: '',
  discountPercent: 0,
  taxRate: defaults.taxRate ?? 8,
  minMargin: defaults.minMargin ?? 40,
  status: 'pending', lostReason: '', note: '',
  previewOverrides: {},
  ownerId: user ? String(user.id) : '',
  ownerName: user ? (user.full_name || user.user || '') : '',
  createdAt: new Date().toISOString(),
  items: [newItem(0)],
})

export const cloneQuote = (q, user) => ({
  ...q,
  id: null,
  code: genQuoteCode(),
  status: 'pending', lostReason: '',
  ownerId: user ? String(user.id) : q.ownerId,
  ownerName: user ? (user.full_name || user.user || '') : q.ownerName,
  createdAt: new Date().toISOString(),
  items: q.items.map((it, i) => ({ ...it, id: uid(), position: i })),
})