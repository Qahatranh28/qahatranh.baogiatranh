// Phiếu báo giá & phiếu giao hàng: dữ liệu lưu dạng "ảnh chụp" (snapshot) tại thời điểm tạo,
// sau đó sửa độc lập, không ảnh hưởng báo giá gốc.
import { calcQuote, uid } from './calc.js'
import { parseTerms, stripBold } from './richText.js'
import { fmtMoney, fmtNum, fmtDate } from './format.js'

// Trạng thái của "đơn" (1 báo giá = 1 đơn gồm phiếu báo giá + phiếu giao hàng)
export const ORDER_STATUS = {
  quoted: { label: 'Đã báo giá', cls: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Đã chốt đơn', cls: 'bg-emerald-100 text-emerald-700' },
  delivering: { label: 'Đang giao hàng', cls: 'bg-sky-100 text-sky-700' },
  delivered: { label: 'Đã giao hàng', cls: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Đã huỷ', cls: 'bg-gray-200 text-gray-600' },
}

export const DOC_TYPES = {
  quote: { label: 'Phiếu báo giá', cls: 'bg-orange-100 text-[#c2410c]' },
  delivery: { label: 'Phiếu giao hàng', cls: 'bg-sky-100 text-sky-700' },
}

const rand = (n) => {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: n }, () => abc[Math.floor(Math.random() * abc.length)]).join('')
}
export const genDeliveryCode = (d = new Date()) =>
  `PGH${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${rand(4)}`

// yyyy-mm-dd <-> ISO (dùng cho <input type="date">)
export const toYmd = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const fromYmd = (ymd) => {
  const [y, m, d] = String(ymd).split('-').map(Number)
  return y ? new Date(y, m - 1, d, 12).toISOString() : ''
}
export const fmtYmd = (ymd) => (ymd ? `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}/${ymd.slice(0, 4)}` : '')

const n = (v) => Number(v) || 0
const usable = (i) => (i.name || '').trim() || n(i.unitPrice) > 0

export const DEFAULT_ORDER_QUOTE_CONTENT = {
  orderTitle: 'ĐƠN ĐẶT HÀNG',
  customerTaxCode: '',
  introText: 'Lời đầu tiên, Công ty chúng tôi xin trân trọng cảm ơn Quý khách hàng đã quan tâm đến sản phẩm/dịch vụ của Công ty. Chúng tôi xin gửi đến Quý khách hàng bảng báo giá như sau:',
  orderNotes: [
    '- Bên Mua đặt cọc Đợt 1 cho Bên Bán để Bên Bán xác nhận sản xuất.',
    '- Sau khi sản xuất, Bên Bán gửi hình ảnh thành phẩm cho Bên Mua.',
    '- Bên Mua thanh toán phần còn lại trước khi Bên Bán vận chuyển hàng.',
    '+ Báo giá có hiệu lực trong vòng 7 ngày kể từ ngày lập.',
    '+ Báo giá chưa phải là xác nhận đơn hàng chính thức.',
  ].join('\n'),
  paymentMethod: 'Bên Mua thanh toán cho Bên Bán bằng hình thức chuyển khoản, tất cả các khoản thanh toán được thực hiện bằng Việt Nam Đồng. Thanh toán chia làm 2 đợt:',
  depositPercent: 60,
  depositNote: 'Bên Mua đặt cọc để được Bên Bán xác nhận sản xuất.',
  remainingNote: 'Bên Mua thanh toán phần còn lại để được Bên Bán xác nhận giao hàng hóa.',
  paymentInfo: 'Quý khách vui lòng chuyển khoản vào STK Công ty TNHH Quang Hà Tranh từ tài khoản công ty của Quý khách. Chúng tôi không nhận thanh toán từ tài khoản cá nhân. Sau khi chuyển khoản, vui lòng gửi hình ảnh giao dịch hoặc ủy nhiệm chi cho Bên Bán.',
  qrCaption: 'Quét mã để đặt cọc Đợt 1',
  paymentFootnote: '*Ghi chú: Đối với khoản tiền khách hàng thanh toán trước (nếu có) được xem là tiền đặt cọc để xác nhận sản xuất và chuẩn bị đơn hàng, chưa phát sinh giao hàng và chưa chuyển giao quyền sở hữu hàng hóa, do đó chưa thuộc thời điểm lập hóa đơn. Hóa đơn sẽ được xuất khi hàng hóa được bàn giao thành công, đầy đủ cho khách hàng.',
  deliveryNote: '+ Bên Mua vui lòng đồng kiểm kê hàng hóa, số lượng và chất lượng khi nhận hàng.',
  finalNote: '+ Hàng sản xuất riêng theo nhu cầu, hàng mua rồi miễn đổi trả. Mọi thắc mắc hay bất kỳ khiếu nại/phát sinh nào về đơn hàng sau khi đã thanh toán/bàn giao, Bên Bán không chịu trách nhiệm.',
  thankYou: 'Cảm ơn Quý khách!',
}

export function buildQuoteDoc(quote, company, terms) {
  const ov = quote.previewOverrides || {}
  return {
    title: company.docTitle || 'BÁO GIÁ',
    ...DEFAULT_ORDER_QUOTE_CONTENT,
    company: { ...company },
    terms: { ...terms, ...(ov.terms || {}) },
    code: quote.code,
    date: quote.createdAt,
    customerName: quote.customerName || '',
    customerPhone: quote.customerPhone || '',
    discountPercent: n(quote.discountPercent),
    taxRate: n(quote.taxRate),
    note: quote.note || '',
    items: quote.items.filter(usable).map((i) => ({ id: uid(), name: i.name, size: i.size, unit: 'Tấm', quantity: n(i.quantity), unitPrice: n(i.unitPrice) })),
  }
}

export function buildDeliveryDoc(quote, company) {
  return {
    title: 'PHIẾU GIAO HÀNG',
    company: { ...company },
    code: genDeliveryCode(),
    date: new Date().toISOString(),
    refCode: quote.code,
    customerName: quote.customerName || '',
    customerPhone: quote.customerPhone || '',
    customerTaxCode: quote.customerTaxCode || quote.taxCode || '',
    deliveryAddress: '',
    deliveryDate: '',
    introText: 'Bên Mua xác nhận Bên Bán đã giao thành công, đầy đủ đơn hàng cụ thể như sau:',
    receiver: '',
    items: quote.items.filter((i) => (i.name || '').trim()).map((i) => ({ id: uid(), name: i.name, size: i.size, unit: i.unit || 'Tấm', quantity: n(i.quantity), unitPrice: n(i.unitPrice), note: '' })),
    taxRate: n(quote.taxRate),
    collectAmount: 0,
    note: '',
    confirmText: 'Quý khách vui lòng kiểm tra số lượng, quy cách và tình trạng sản phẩm khi nhận hàng.',
  }
}

// Số tiền hiển thị ở danh sách: phiếu báo giá = tổng thanh toán, phiếu giao hàng = tiền thu hộ
export function docAmount(type, data) {
  if (type === 'delivery') return n(data.collectAmount)
  return docTotals(data).grand
}

// Các con số của phiếu báo giá. Mỗi số có thể bị GHI ĐÈ tay (data.overrides) — kể cả tổng thanh toán.
export const OVERRIDE_KEYS = ['subtotal', 'afterDiscount', 'tax', 'grand']
export function docTotals(data) {
  const calc = calcQuote({ items: data.items || [], discountPercent: data.discountPercent, taxRate: data.taxRate })
  const o = data.overrides || {}
  const has = (k) => o[k] !== undefined && o[k] !== null
  const pick = (k, v) => (has(k) ? n(o[k]) : v)
  return {
    calc,
    subtotal: pick('subtotal', calc.subtotal),
    discountAmount: calc.discountAmount,
    afterDiscount: pick('afterDiscount', calc.afterDiscount),
    tax: pick('tax', calc.taxAmount),
    grand: pick('grand', calc.grandTotal),
    overridden: Object.fromEntries(OVERRIDE_KEYS.map((k) => [k, has(k)])),
  }
}

export function newDocItem(type) {
  return type === 'delivery'
    ? { id: uid(), name: '', size: '', unit: 'Tấm', quantity: 1, unitPrice: 0, note: '' }
    : { id: uid(), name: '', size: '', quantity: 1, unitPrice: 0 }
}

// Nội dung chữ để dán Zalo (dùng chung cho xem trước báo giá & phiếu báo giá)
export function buildQuoteText(q, company, terms) {
  const t = docTotals(q)
  const calc = t.calc
  const lines = [
    `${company.brandName || company.name || ''} — BÁO GIÁ ${q.code}`,
    `Ngày: ${fmtDate(q.date ?? q.createdAt)}`,
    `Khách hàng: ${q.customerName || '—'}`,
    '',
    ...calc.lines.filter((l) => l.name || l.unitPrice).map((l, i) => `${i + 1}. ${l.name || 'Sản phẩm'}${l.size ? ` (${l.size})` : ''} × ${fmtNum(l.quantity)} — ${fmtMoney(l.unitPrice)} = ${fmtMoney(l.revenue)}`),
    '',
    `Tổng tiền: ${fmtMoney(t.subtotal)}`,
    ...(calc.discountPercent > 0 ? [`Chiết khấu ${fmtNum(calc.discountPercent)}%: -${fmtMoney(calc.discountAmount)}`] : []),
    ...(calc.taxRate > 0 ? [`VAT ${calc.taxRate}%: ${fmtMoney(t.tax)}`] : []),
    `TỔNG THANH TOÁN: ${fmtMoney(t.grand)}`,
  ]
  if (q.note?.trim()) lines.push('', `Ghi chú: ${q.note.trim()}`)
  const tr = parseTerms(terms?.body)
  if (tr.length) lines.push('', `${terms.title || 'Điều khoản'}:`, ...tr.map((r) => `${r.level === 2 ? '    ◦' : '•'} ${stripBold(r.text)}`))
  if (company.bankAccount) lines.push('', `Thanh toán: ${[company.bankName, company.bankAccount, company.bankHolder].filter(Boolean).join(' - ')}`, `Nội dung CK: ${q.transferNote || q.code}`)
  return lines.join('\n')
}
