export function computeFrameCost(
  widthCm,
  heightCm,
  toggles = {},
  settings = {},
  isKinh = true,
  khungPerMOverride = null,
  khungNameMultiplier = 1,
  isNhom = false,
  customTranhInPrice = 0,
  customTranhInLabel = 'Tranh in',
  customGlassPrice = 0,
  customGlassLabel = 'Kính/Mica',
  customVanPrice = 0,
  customVanLabel = 'Ván lót',
  customGiayBoPrice = 0,
  customGiayBoLabel = 'Giấy bo',
  customSatXiPrice = 0,
  customSatXiLabel = 'Sắt xi',
  mode = 'simple',
  innerWidthCm = 0,
  innerHeightCm = 0,
  moebeGlassPrice = 0,
  moebeGlassLabel = '',
  moebeCorePrice = 0,
  moebeCoreLabel = ''
) {
  const w = Number(widthCm) || 0
  const h = Number(heightCm) || 0
  const areaM2 = (w * h) / 10000
  const chuViM = (2 * (w + h)) / 100
  
  const inW = Number(innerWidthCm) || 0
  const inH = Number(innerHeightCm) || 0
  const innerAreaM2 = (inW * inH) / 10000

 const isLarge = Math.max(w, h) > 40
  
  // 🌟 1. TÍNH HAO HỤT KHUNG (Nhôm: +10% | Các loại khung khác: +20%)
  const tyLeHaoHutKhung = isNhom ? 0.1 : 0.2
  const chieuDaiKhungCanM = chuViM * (1 + tyLeHaoHutKhung)

  // 🌟 2. TÍNH HAO HỤT SẮT XI (Mặc định: +10%)
  const tyLeHaoHutSatXi = 0.1
  const tongSatXiM = chuViM * (1 + tyLeHaoHutSatXi)

  const rows = []
  const addRow = (label, unit, qty, unitPrice) => {
    const total = qty * unitPrice
    rows.push({ label, unit, qty, unitPrice, total })
    return total
  }

  // Đơn giá khung
  let khungPerM = Number(khungPerMOverride) > 0 ? Number(khungPerMOverride) : 0
  khungPerM = khungPerM * khungNameMultiplier

  const priceKeGoc = Number(settings['ke_goc'] || settings.keGocPerBo) || 0
  const priceMocTreo = Number(settings['moc_treo'] || settings.mocTreoPerCai) || 0
  const priceDinhGhim = Number(settings['dinh_ghim'] || settings.dinhGhimPerCai) || 0
  const pricePeCuon = Number(settings['pe_cuon'] || settings.peCuonPerKg) || 0
  const priceXop = Number(settings['xop_bong_khi'] || settings.xopBongKhiPerCay) || 0
  const priceCarton = Number(settings['carton'] || settings.cartonPerKg) || 0
  const priceBangKeo = Number(settings['bang_keo'] || settings.bangKeoPerCay) || 0

  let nvlTotal = 0

  // 1. 🌟 LUẬT THÉP: CHỈ XÁC NHẬN LÀ "LÀM KHUNG" KHI CÔNG TẮC BẬT VÀ CÓ GIÁ KHUNG > 0
  const isMakingFrame = (toggles?.khung !== false) && (khungPerM > 0)

  if (isMakingFrame) {
    nvlTotal += addRow('Khung', 'm', chieuDaiKhungCanM, khungPerM)
  }

  // 2. CÁC VẬT TƯ CHÍNH (CUSTOM / MOEBE)
  if (mode === 'moebe') {
    if (moebeGlassPrice > 0) {
      const glassLabel = (moebeGlassLabel || 'Kính/Mica') + ' (Kẹp 2 mặt)'
      nvlTotal += addRow(glassLabel, 'm²', areaM2 * 2, moebeGlassPrice)
    }
    if (moebeCorePrice > 0) {
      const coreLabel = moebeCoreLabel || 'Vật liệu ruột Moebe'
      nvlTotal += addRow(coreLabel, 'm²', innerAreaM2, moebeCorePrice)
    }
  } else {
    if (toggles?.tranhIn && customTranhInPrice > 0) {
      nvlTotal += addRow(customTranhInLabel, 'm²', areaM2, customTranhInPrice)
    }
    if (toggles?.micaKinh && customGlassPrice > 0) {
      nvlTotal += addRow(customGlassLabel, 'm²', areaM2, customGlassPrice)
    }
    if (toggles?.van && customVanPrice > 0) {
      nvlTotal += addRow(customVanLabel, 'm²', areaM2, customVanPrice)
    }
    if (toggles?.giayBo && customGiayBoPrice > 0) {
      nvlTotal += addRow(customGiayBoLabel, 'm²', areaM2, customGiayBoPrice)
    }
    if (toggles?.satXi && customSatXiPrice > 0) {
      nvlTotal += addRow(customSatXiLabel, 'm', tongSatXiM, customSatXiPrice)
    }
  }

  // 3. 🌟 PHỤ KIỆN KHUNG (CHỈ TÍNH KHI THỰC SỰ LÀM KHUNG)
  if (isMakingFrame) {
    if (isNhom) {
      if (priceKeGoc > 0) nvlTotal += addRow('Bộ ke góc (khung nhôm)', 'Bộ', 1, priceKeGoc)
    } else {
      const soDinhGhim = ((chuViM * 100) / 10) + 12
      if (priceDinhGhim > 0) nvlTotal += addRow('Đinh/ghim/ốc vít/NVL khác', 'Cái', soDinhGhim, priceDinhGhim)
    }

    const mocTreoQty = isNhom ? 0 : (isLarge ? 2 : 1)
    if (mocTreoQty > 0 && priceMocTreo > 0) nvlTotal += addRow('Móc treo', 'Cái', mocTreoQty, priceMocTreo)
    
    const dayTreoQty = isNhom ? 0 : (isLarge ? ((w + 20) / 100) : 0)
    if (dayTreoQty > 0) nvlTotal += addRow('Dây treo', 'm', dayTreoQty, 500)
  }

  // 4. VẬT TƯ ĐÓNG GÓI (CHỈ TÍNH KHI BẬT CÔNG TẮC ĐÓNG GÓI)
  const hasDongGoi = toggles?.dongGoi === true
  if (hasDongGoi) {
    const peCuonQty = ((areaM2 * 1.5 * 1.2) * 3.5) / 171
    const xopBongKhiQty = (areaM2 * 2 * 1.2) / 140
    const cartonQty = areaM2 * 0.96
    const bangKeoQty = (areaM2 * 1.1) / 9.6

    if (pricePeCuon > 0) nvlTotal += addRow('Pe cuộn', 'kg', peCuonQty, pricePeCuon)
    if (priceXop > 0) nvlTotal += addRow('Xốp bóng khí', 'Cây', xopBongKhiQty, priceXop)
    if (priceCarton > 0) nvlTotal += addRow('Carton', 'kg', cartonQty, priceCarton)
    if (priceBangKeo > 0) nvlTotal += addRow('Băng keo trong', 'Cây', bangKeoQty, priceBangKeo)
  }

  // 5. CHI PHÍ NHÂN CÔNG
  const laborRows = []
  const luongNC = Number(settings.luongNhanCongPerGio) || 40000
  const addLabor = (label, hours) => {
    const total = hours * luongNC
    laborRows.push({ label, unit: 'giờ', qty: hours, unitPrice: luongNC, total })
    return total
  }

  let laborTotal = 0
  
  // 🌟 Giờ công làm khung chỉ tính khi thực sự làm khung
  if (isMakingFrame) {
    laborTotal += addLabor('Chi phí giờ công làm khung', chieuDaiKhungCanM * 0.1)
  }
  
  const hasGlassOrBoard = mode === 'moebe' || toggles?.micaKinh || toggles?.van
  if (hasGlassOrBoard) {
    const glassLaborArea = mode === 'moebe' ? areaM2 * 2 : areaM2
    laborTotal += addLabor('Chi phí giờ công làm mica/kính/ván', glassLaborArea * 0.2)
  }

  if (mode !== 'moebe') {
    if (toggles?.giayBo) {
      laborTotal += addLabor('Chi phí giờ công làm giấy bo', areaM2 * 0.25)
    }
    if (toggles?.son) {
      laborTotal += addLabor('Chi phí giờ công sơn', chuViM * 0.17)
    }
  }
  
  if (hasDongGoi) {
    laborTotal += addLabor('Chi phí giờ công đóng gói', areaM2 * 0.5)
  }

  const sxc = laborTotal * 0.3
  const grandTotal = nvlTotal + laborTotal + sxc

  return {
    areaM2,
    innerAreaM2,
    chuViM,
    chieuDaiKhungCanM,
    materialRows: rows,
    laborRows,
    nvlTotal,
    laborTotal,
    sxc,
    grandTotal,
  }
}