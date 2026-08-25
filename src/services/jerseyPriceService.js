import { supabase } from '../supabaseClient'

const JERSEY_FRAME_CATEGORIES = ['composite_2x3', 'nhom', 'nhom_day']

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
  if (normalized.includes('nhom_day') || normalized.includes('day') || normalized.includes('3,5')) return 'nhom_day'
  if (normalized.includes('nhom') || normalized.includes('aluminium') || normalized.includes('aluminum')) return 'nhom'
  if (normalized.includes('composite') || normalized.includes('2x3')) return 'composite_2x3'

  return ''
}

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

  ;(exactResult.data || []).forEach((row) => {
    byFrameId.set(row.frame_id, {
      ...row,
      category: row.category,
      image_url: row.image_url || null,
    })
  })

  ;(allResult.data || []).forEach((row) => {
    if (byFrameId.has(row.frame_id)) return
    const mapped = mapJerseyCategory(row.category)
    if (JERSEY_FRAME_CATEGORIES.includes(mapped)) {
      byFrameId.set(row.frame_id, {
        ...row,
        category: mapped,
        image_url: row.image_url || null,
      })
    }
  })

  return Array.from(byFrameId.values())
}

/**
 * Tải bảng giá size áo đấu (bao gồm cả mức giá 2 mặt cao cấp).
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
    price2FacesPremium: Number(row.price_2_faces_premium) || 0, // 🌟 Map đúng cột giá 2 mặt cao cấp từ DB
  }))
}

export { JERSEY_FRAME_CATEGORIES }