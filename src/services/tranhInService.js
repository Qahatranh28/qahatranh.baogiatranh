// src/services/tranhInService.js

/**
 * Lấy danh sách các loại Tranh in cho Dropdown
 */
export function getTranhInOptions(dbMaterialsList = []) {
  const list = dbMaterialsList
    .filter((m) => {
      const id = String(m.id_material || '').toLowerCase()
      const name = String(m.name_material || m.name || '').toLowerCase()
      return id.startsWith('tranh_in_') || id.includes('canvas') || name.includes('tranh in')
    })
    .map((m) => ({
      value: m.id_material,
      label: m.name_material || m.name || m.id_material, // 🌟 Lấy Tên hiển thị
    }))

  return list.length > 0
    ? list
    : [
        { value: 'tranh_in_giay_my_thuat', label: 'Tranh in giấy mỹ thuật' },
        { value: 'tranh_in_canvas', label: 'Tranh in Canvas' },
      ]
}

/**
 * Lấy thông tin giá vốn và tên hiển thị chính xác của Tranh In
 */
export function getTranhInDetail(selectedId, dbMaterialsList = []) {
  if (!dbMaterialsList || dbMaterialsList.length === 0) {
    return { price: 0, label: 'Tranh in' }
  }

  const query = String(selectedId || '').trim().toLowerCase()

  // 1. Tìm khớp chính xác id_material (VD: 'tranh_in_giay_my_thuat')
  let found = dbMaterialsList.find(
    (m) => String(m.id_material || '').trim().toLowerCase() === query
  )

  // 2. Tìm khớp theo name_material
  if (!found) {
    found = dbMaterialsList.find(
      (m) => String(m.name_material || '').trim().toLowerCase() === query
    )
  }

  // 3. Nếu vẫn chưa thấy, tìm theo từ khóa thông minh
  if (!found) {
    if (query.includes('canvas')) {
      found = dbMaterialsList.find(
        (m) =>
          String(m.id_material || '').toLowerCase().includes('canvas') ||
          String(m.name_material || '').toLowerCase().includes('canvas')
      )
    } else {
      found = dbMaterialsList.find(
        (m) =>
          String(m.id_material || '').toLowerCase().includes('giay_my_thuat') ||
          String(m.id_material || '').toLowerCase().includes('my_thuat') ||
          String(m.name_material || '').toLowerCase().includes('mỹ thuật')
      )
    }
  }

  if (found) {
    return {
      price: Number(found.price_cost) || 0,
      label: found.name_material || 'Tranh in',
      id: found.id_material,
      youtubeUrl: found.youtube_url || ''
    }
  }

  // Dự phòng nếu không tìm thấy thì trả về 0đ chứ không lấy nhầm giá vật tư khác
  return { price: 0, label: 'Tranh in', youtubeUrl: '' }
}