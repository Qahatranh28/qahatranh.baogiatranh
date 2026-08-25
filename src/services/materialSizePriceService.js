import { supabase } from '../supabaseClient'

// 🌟 Bảng giá giấy bo (và các vật tư có bảng giá theo size khác trong tương
// lai) theo từng SIZE cụ thể — dùng để cộng thêm vào GIÁ BÁN (không phải giá
// vốn) khi khách chọn "Giấy bo" ở form Custom.
//
// ⚠️ Giả định cấu trúc bảng `material_size_prices` (đặt tên đúng chính tả,
// khác với "metarial_size_prices" gõ nhầm trong yêu cầu) gồm các cột:
//   - id_material (text, khớp với material.id_material của loại giấy bo)
//   - size_name (text)
//   - width, height (numeric, cm)
//   - price (numeric, VNĐ)
// Nếu tên bảng/cột thực tế trên Supabase khác, chỉ cần sửa lại đúng 4 chỗ
// bên dưới (.from(...) và các field width/height/price/size_name).
export async function fetchMaterialSizePrices(idMaterial) {
  if (!idMaterial) return []
  try {
    const { data, error } = await supabase
      .from('material_size_prices')
      .select('*')
      .eq('id_material', idMaterial)

    if (error) throw error

    return (data || [])
      .map((row) => ({
        label: row.size_name || `${Number(row.width) || 0} x ${Number(row.height) || 0} cm`,
        width: Number(row.width) || 0,
        height: Number(row.height) || 0,
        price: row.price != null ? Number(row.price) : null,
      }))
      .filter((s) => s.width > 0 && s.height > 0 && s.price > 0)
  } catch (err) {
    console.error(
      '[Giấy bo] Lỗi tải bảng giá theo size (material_size_prices) — kiểm tra lại tên bảng/cột trên Supabase:',
      err.message
    )
    return []
  }
}