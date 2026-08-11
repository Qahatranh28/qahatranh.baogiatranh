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