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