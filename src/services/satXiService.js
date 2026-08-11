/**
 * Lấy đơn giá và tên của Sắt xi trực tiếp từ bảng material trên Supabase
 */
export function getSatXiDetail(dbMaterialsList = [], settings = {}) {
  if (dbMaterialsList.length) {
    const found = dbMaterialsList.find(
      (m) =>
        String(m.id_material || '').trim().toLowerCase() === 'sat_xi' ||
        String(m.name_material || '').trim().toLowerCase().includes('sắt xi')
    );

    if (found) {
      return {
        price: Number(found.price_cost) || 0,
        label: found.name_material || 'Sắt xi',
        id: found.id_material,
        youtubeUrl: found.youtube_url || '',
      };
    }
  }

  // Dự phòng từ settings nếu chưa có trong bảng material
  const priceFromSettings = Number(settings['sat_xi'] || settings.satXiPerM) || 0;
  return { price: priceFromSettings, label: 'Sắt xi' };
}