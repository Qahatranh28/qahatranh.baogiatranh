/**
 * Lấy toàn bộ đơn giá phụ kiện & đóng gói (Móc treo, Đinh, Pe cuộn, Xốp bóng khí, Carton, Băng keo, Ke góc)
 * Ưu tiên tra cứu từ bảng material trên Supabase, nếu không thấy sẽ đọc từ bảng settings
 */
export function getPackagingPrices(dbMaterialsList = [], settings = {}) {
  const getItemPrice = (idKey, settingKey) => {
    if (dbMaterialsList.length) {
      const found = dbMaterialsList.find(
        (m) => String(m.id_material || '').trim().toLowerCase() === idKey
      );
      if (found && Number(found.price_cost) > 0) {
        return Number(found.price_cost);
      }
    }
    return Number(settings[settingKey] || 0) || 0;
  };

  return {
    priceKeGoc: getItemPrice('ke_goc', 'keGocPerBo'),
    priceMocTreo: getItemPrice('moc_treo', 'mocTreoPerCai'),
    priceDinhGhim: getItemPrice('dinh_ghim', 'dinhGhimPerCai'),
    pricePeCuon: getItemPrice('pe_cuon', 'peCuonPerKg'),
    priceXop: getItemPrice('xop_bong_khi', 'xopBongKhiPerCay'),
    priceCarton: getItemPrice('carton', 'cartonPerKg'),
    priceBangKeo: getItemPrice('bang_keo', 'bangKeoPerCay'),
  };
}