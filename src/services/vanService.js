export function getVanOptions(dbMaterialsList = []) {
  const list = dbMaterialsList
    .filter((m) => {
      const id = String(m.id_material || '').toLowerCase()
      const name = String(m.name_material || m.name || '').toLowerCase()
      
      // 🌟 ĐIỀU KIỆN CHẶN: Bỏ qua tất cả những mục thuộc về "Tranh in"
      const isTranhIn = id.includes('tranh') || name.includes('tranh') || name.includes('in')
      if (isTranhIn) {
        return false // Loại bỏ ngay lập tức
      }

      // 🌟 Kiểm tra vật liệu có phải là Ván hoặc Fomex/Formex thô không
      const isVan = id.includes('van') || name.includes('ván')
      const isFomex = id.includes('fomex') || id.includes('formex') || name.includes('fomex') || name.includes('formex')
      
      return isVan || isFomex
    })
    .map((m) => ({
      value: m.id_material,
      label: m.name_material || m.name || m.id_material,
    }))

  return list.length > 0
    ? list
    : [{ value: 'van_4ly', label: 'Ván 4 ly' }]
}

export function getVanDetail(selectedId, dbMaterialsList = []) {
  const options = getVanOptions(dbMaterialsList)
  if (!dbMaterialsList.length) return { price: 0, label: 'Ván/Fomex', youtubeUrl: '' }
  
  const query = String(selectedId || '').trim().toLowerCase()
  let found = dbMaterialsList.find(m =>
    String(m.id_material || '').trim().toLowerCase() === query ||
    String(m.name_material || '').trim().toLowerCase() === query
  )

  if (!found && options.length > 0) found = dbMaterialsList.find(m => m.id_material === options[0].value)

  if (found) {
    return { 
      price: Number(found.price_cost) || 0, 
      label: found.name_material || 'Ván/Fomex', 
      id: found.id_material, 
      youtubeUrl: found.youtube_url || '' 
    }
  }
  
  return { price: 0, label: 'Ván/Fomex', youtubeUrl: '' }
}

function normalizeVanText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Tìm vật tư "Ván <n> ly/li" trong bảng material (DB) — dùng làm mặc định
 * cho Khung tiêu chuẩn khi TẮT in tranh (thay ván lót cho tranh in).
 */
export function getVanByThicknessDetail(dbMaterialsList = [], thicknessNumber = 4) {
  const fallbackLabel = `Ván ${thicknessNumber} ly`
  if (!Array.isArray(dbMaterialsList) || dbMaterialsList.length === 0) {
    return { price: 0, label: fallbackLabel, id: null, youtubeUrl: '' }
  }

  const thicknessRe = new RegExp(`\\b${thicknessNumber}\\s*l(y|i)\\b`)
  const textOf = (m) => `${normalizeVanText(m.id_material)} ${normalizeVanText(m.name_material || m.name)}`
  const isVanLike = (text) => text.includes('van') || text.includes('fomex') || text.includes('formex')

  let found = dbMaterialsList.find((m) => {
    const text = textOf(m)
    return isVanLike(text) && thicknessRe.test(text)
  })

  if (!found) {
    found = dbMaterialsList.find((m) => isVanLike(textOf(m)))
    if (found && typeof console !== 'undefined') {
      console.warn(
        `[${fallbackLabel}] Không tìm thấy đúng vật tư "${fallbackLabel}" trong bảng material — đang tạm dùng "${
          found.name_material || found.id_material
        }" thay thế. Vào Supabase kiểm tra lại tên/ID vật tư Ván ${thicknessNumber} ly.`
      )
    }
  }

  if (!found) {
    if (typeof console !== 'undefined') {
      console.warn(`[${fallbackLabel}] Chưa có vật tư Ván/Fomex nào trong bảng material.`)
    }
    return { price: 0, label: fallbackLabel, id: null, youtubeUrl: '' }
  }

  return {
    price: Number(found.price_cost) || 0,
    label: found.name_material || found.name || fallbackLabel,
    id: found.id_material,
    youtubeUrl: found.youtube_url || '',
  }
}

// 🌟 Mặc định mới cho Khung tiêu chuẩn khi TẮT in tranh: Ván 4 ly.
export function getVan4LyDetail(dbMaterialsList = []) {
  return getVanByThicknessDetail(dbMaterialsList, 4)
}