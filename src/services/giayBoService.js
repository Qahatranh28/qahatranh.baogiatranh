export function getGiayBoOptions(dbMaterialsList = []) {
  const list = dbMaterialsList
    .filter((m) => {
      const id = String(m.id_material || '').toLowerCase()
      const name = String(m.name_material || m.name || '').toLowerCase()
      return id.includes('giay_bo') || name.includes('giấy bo')
    })
    .map((m) => ({
      value: m.id_material,
      label: m.name_material || m.name || m.id_material, // 🌟 Lấy Tên hiển thị
    }))

  return list.length > 0
    ? list
    : [{ value: 'giay_bo_mau_0_8ly', label: 'Giấy bo trắng 0.8 ly' }]
}
export function getGiayBoDetail(selectedId, dbMaterialsList = []) {
  const options = getGiayBoOptions(dbMaterialsList)
  if (!dbMaterialsList.length) return { price: 0, label: 'Giấy bo', youtubeUrl: '' }

  const query = String(selectedId || '').trim().toLowerCase()
  let found = dbMaterialsList.find(m =>
    String(m.id_material || '').trim().toLowerCase() === query ||
    String(m.name_material || '').trim().toLowerCase() === query
  )

  if (!found && options.length > 0) found = dbMaterialsList.find(m => m.id_material === options[0].value)

  if (found) return { price: Number(found.price_cost) || 0, label: found.name_material || 'Giấy bo', id: found.id_material, youtubeUrl: found.youtube_url || '' }
  return { price: 0, label: 'Giấy bo', youtubeUrl: '' }
}