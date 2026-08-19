import { supabase } from '../supabaseClient'

const JERSEY_FRAME_CATEGORIES = ['composite_2x3', 'nhom']

const normalizeCategoryKey = (value) => {
  if (value == null) return ''
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export const mapJerseyCategory = (value) => {
  const raw = String(value ?? '').trim()
  const normalized = normalizeCategoryKey(raw)

  if (!normalized) return ''
  if (normalized.includes('nhom') || normalized.includes('aluminium') || normalized.includes('aluminum')) return 'nhom'
  if (normalized.includes('composite') || normalized.includes('2x3')) return 'composite_2x3'

  return ''
}

/**
 * Tải loại khung dùng cho Khung áo đấu từ dữ liệu thực tế trong frame_catalog.
 * Chỉ giữ những khung thuộc nhóm Jersey thực sự theo category thực tế: composite_2x3 hoặc nhom.
 *
 * 🌟 Cách lấy dữ liệu gồm 2 bước để đảm bảo LUÔN lấy đúng 2 loại khung này dù
 * category trong DB được lưu dưới dạng nào:
 *  1) Lấy trước theo đúng slug (giống hệt cách bảng Moebe đang dùng
 *     `.eq('category', 'nhom')`) — chắc chắn khớp nếu admin đã gắn category
 *     là chính xác 'composite_2x3' / 'nhom'.
 *  2) Lấy toàn bộ frame_catalog rồi dò thêm bằng mapJerseyCategory (nhận diện
 *     cả các biến thể có dấu/không dấu, có tiền tố khác như "Khung Composite",
 *     "Khung nhôm"...) để không bỏ sót khung nào admin đã đặt tên khác đi.
 * Kết quả 2 bước được gộp lại (loại trùng theo frame_id).
 */
export async function fetchJerseyFrameTypes() {
  const [exactResult, allResult] = await Promise.all([
    supabase
      .from('frame_catalog')
      .select('frame_id, name, price_cost, category, image_url')
      .in('category', JERSEY_FRAME_CATEGORIES)
      .order('name'),
    supabase
      .from('frame_catalog')
      .select('frame_id, name, price_cost, category, image_url')
      .order('name'),
  ])

  if (exactResult.error) throw exactResult.error
  if (allResult.error) throw allResult.error

  const byFrameId = new Map()

  // Bước 1: khớp chính xác (chắc ăn, giống cách Moebe đang dùng)
  ;(exactResult.data || []).forEach((row) => {
    byFrameId.set(row.frame_id, {
      ...row,
      category: row.category,
      image_url: row.image_url || null,
    })
  })

  // Bước 2: dò thêm bằng mapJerseyCategory trên toàn bộ danh mục khung, để
  // bắt luôn các khung có category dạng "Khung Composite", "Khung nhôm"...
  const unmatchedCategories = new Set()
  ;(allResult.data || []).forEach((row) => {
    if (byFrameId.has(row.frame_id)) return
    const mapped = mapJerseyCategory(row.category)
    if (JERSEY_FRAME_CATEGORIES.includes(mapped)) {
      byFrameId.set(row.frame_id, {
        ...row,
        category: mapped,
        image_url: row.image_url || null,
      })
    } else if (row.category) {
      unmatchedCategories.add(row.category)
    }
  })

  const rows = Array.from(byFrameId.values())

  // 🌟 Ghi log để admin/dev dễ dò khi 1 trong 2 loại khung vẫn trống —
  // không ảnh hưởng gì tới người dùng, chỉ hiện trong console.
  if (typeof console !== 'undefined') {
    JERSEY_FRAME_CATEGORIES.forEach((cat) => {
      const hasAny = rows.some((r) => r.category === cat)
      if (!hasAny) {
        console.warn(
          `[Khung áo đấu] Chưa tìm thấy khung nào thuộc category "${cat}" trong frame_catalog.` +
            (unmatchedCategories.size > 0
              ? ` Các category khác đang có trong DB: ${Array.from(unmatchedCategories).join(', ')}. ` +
                `Vào "Quản lý sản phẩm" và gán đúng danh mục "${cat}" cho khung áo đấu tương ứng.`
              : ' Chưa có khung nào trong frame_catalog được gắn danh mục phù hợp.')
        )
      }
    })
  }

  return rows
}

/**
 * Tải bảng giá size áo đấu.
 */
export async function fetchJerseyPrices() {
  const { data, error } = await supabase
    .from('jersey_frame_prices')
    .select('*')
    .order('size_label')

  if (error) throw error
  return (data || []).map((row) => ({
    id: row.id,
    sizeLabel: row.size_label,
    priceBasic: Number(row.price_basic) || 0,
    pricePremium: Number(row.price_premium) || 0,
  }))
}

export { JERSEY_FRAME_CATEGORIES }
