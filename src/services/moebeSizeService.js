import { supabase } from '../supabaseClient'

/**
 * Tải danh sách loại khung Moebe (category = "nhom") từ frame_catalog.
 */
export async function fetchMoebeFrameTypes() {
  const { data, error } = await supabase
    .from('frame_catalog')
    .select('frame_id, name, price_cost, category, image_url')
    .eq('category', 'nhom')

  if (error) throw error
  return data || []
}

/**
 * Tải toàn bộ size Moebe từ bảng frame_size_moebe.
 */
export async function fetchMoebeSizes() {
  const { data, error } = await supabase.from('frame_size_moebe').select('*')
  if (error) throw error
  return data || []
}

/**
 * Lọc size theo frame_id (nếu bảng có cột frame_id).
 */
export function filterMoebeSizesByFrame(sizes, frameId) {
  if (!Array.isArray(sizes)) return []
  const hasFrameIdColumn = sizes.some((s) => s && Object.prototype.hasOwnProperty.call(s, 'frame_id'))

  if (!frameId || !hasFrameIdColumn) return sizes

  const filtered = sizes.filter((s) => String(s.frame_id) === String(frameId))
  return filtered.length > 0 ? filtered : sizes
}

export function formatMoebeSizeOption(row) {
  const id = row.id != null ? String(row.id) : `${row.frame_id}_${row.size_label}`
  return {
    id,
    label: row.size_label || `${row.width} x ${row.height} cm`,
    width: Number(row.width) || 0,
    height: Number(row.height) || 0,
    innerWidth: Number(row.inner_width) || 0,
    innerHeight: Number(row.inner_height) || 0,
    price: Number(row.price) || 0,
    pricePrint: Number(row.price_print) || 0,
    frameId: row.frame_id ?? null,
  }
}
