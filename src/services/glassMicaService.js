export function getGlassMicaOptions(dbMaterialsList = []) {
  const list = dbMaterialsList
    .filter((m) => {
      const id = String(m.id_material || '').toLowerCase()
      const name = String(m.name_material || m.name || '').toLowerCase()
      return id.includes('kinh') || id.includes('mica') || name.includes('kính') || name.includes('mica')
    })
    .map((m) => ({
      value: m.id_material,
      label: m.name_material || m.name || m.id_material, // 🌟 Lấy Tên hiển thị
    }))

  return list.length > 0
    ? list
    : [{ value: 'kinh', label: 'Kính 2mm trong' }]
}

export function getGlassMicaDetail(selectedId, dbMaterialsList = []) {
  const options = getGlassMicaOptions(dbMaterialsList)
  if (!dbMaterialsList.length) return { price: 0, label: 'Kính/Mica' }

  const query = String(selectedId || '').trim().toLowerCase()
  let found = dbMaterialsList.find(m =>
    String(m.id_material || '').trim().toLowerCase() === query ||
    String(m.name_material || '').trim().toLowerCase() === query
  )

  if (!found && options.length > 0) found = dbMaterialsList.find(m => m.id_material === options[0].value)

  if (found) return { price: Number(found.price_cost) || 0, label: found.name_material || 'Kính/Mica', id: found.id_material, youtubeUrl: found.youtube_url || '' }
  return { price: 0, label: 'Kính/Mica', youtubeUrl: ''}
}

// 🌟 Bỏ chuẩn hoá dấu/khoảng trắng để dò tên/ID vật tư linh hoạt hơn (VD:
// "Mica 2 ly", "mica_2li", "Mica2Ly" đều nhận diện được).
function normalizeMaterialText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Tìm vật tư "Mica <n> ly/li" trong bảng material (DB) — dùng làm mặc định
 * thay cho "Kính" ở các form Khung tiêu chuẩn / Moebe / Áo đấu.
 * Nếu không tìm thấy đúng độ dày, tạm dùng vật tư Mica đầu tiên tìm được
 * (và log cảnh báo ra console để admin biết cần bổ sung/đổi tên vật tư).
 */
export function getMicaByThicknessDetail(dbMaterialsList = [], thicknessNumber = 2) {
  const fallbackLabel = `Mica ${thicknessNumber} ly`
  if (!Array.isArray(dbMaterialsList) || dbMaterialsList.length === 0) {
    return { price: 0, label: fallbackLabel, id: null, youtubeUrl: '' }
  }

  const thicknessRe = new RegExp(`\\b${thicknessNumber}\\s*l(y|i)\\b`)
  const textOf = (m) => `${normalizeMaterialText(m.id_material)} ${normalizeMaterialText(m.name_material || m.name)}`

  let found = dbMaterialsList.find((m) => {
    const text = textOf(m)
    return text.includes('mica') && thicknessRe.test(text)
  })

  if (!found) {
    found = dbMaterialsList.find((m) => textOf(m).includes('mica'))
    if (found && typeof console !== 'undefined') {
      console.warn(
        `[${fallbackLabel}] Không tìm thấy đúng vật tư "${fallbackLabel}" trong bảng material — đang tạm dùng "${
          found.name_material || found.id_material
        }" thay thế. Vào Supabase kiểm tra lại tên/ID vật tư Mica ${thicknessNumber} ly.`
      )
    }
  }

  if (!found) {
    if (typeof console !== 'undefined') {
      console.warn(`[${fallbackLabel}] Chưa có vật tư Mica nào trong bảng material.`)
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

// 🌟 Mặc định mới cho Moebe / Khung tiêu chuẩn / Áo đấu: Mica 2 ly (thay "Kính").
export function getMica2LiDetail(dbMaterialsList = []) {
  return getMicaByThicknessDetail(dbMaterialsList, 2)
}

// 🌟 Riêng Khăn Lụa khổ lớn (> 85x85cm) ở Khung tiêu chuẩn: Mica 4 ly.
export function getMica4LiDetail(dbMaterialsList = []) {
  return getMicaByThicknessDetail(dbMaterialsList, 4)
}