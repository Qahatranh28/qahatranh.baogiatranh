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
 */
export async function fetchJerseyFrameTypes() {
  const { data, error } = await supabase
    .from('frame_catalog')
    .select('frame_id, name, price_cost, category, image_url')
    .order('name')

  if (error) throw error

  const rows = (data || [])
    .map((row) => {
      const category = mapJerseyCategory(row.category)
      return {
        ...row,
        category,
        image_url: row.image_url || null,
      }
    })
    .filter((row) => JERSEY_FRAME_CATEGORIES.includes(row.category))

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
