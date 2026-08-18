// src/utils/silkScarfCosting.js

// 🌟 ĐỊNH MỨC GIỜ LÀM CHO TỪNG DÒNG KHĂN LỤA (Khai báo trực tiếp, không gọi từ defaults)
const GIO_LAM_KHAN_RATES = {
  'Khăn Lụa Khung Classic': 2.5,
  'Khăn Lụa Khung Moebe': 4.0,
  'Khăn Lụa Khung Matboard': 3.0,
  'Khăn Lụa Khung Mirror': 2.5,
}
const MOEBE_SILK_INNER_SIZES = {
  '60x60': { innerW: 40, innerH: 40 },
  '85x85': { innerW: 70, innerH: 70 },
  '100x100': { innerW: 90, innerH: 90 },
}

export function computeSilkScarfCost(
  widthCm, heightCm, toggles, settings, isKinh, khungPerMOverride, khungNameMultiplier, isNhom,
  customTranhInPrice, customTranhInLabel, customGlassPrice, customGlassLabel,
  customVanPrice, customVanLabel, customGiayBoPrice, customGiayBoLabel,
  customSatXiPrice, customSatXiLabel, mode, innerWidthCm, innerHeightCm,
  moebeGlassPrice, moebeGlassLabel, moebeCorePrice, moebeCoreLabel, khungCategory
) {
  const w = Number(widthCm) || 0
  const h = Number(heightCm) || 0
  const areaM2 = (w * h) / 10000
  const chuViM = (2 * (w + h)) / 100
  
  const inW = Number(innerWidthCm) || 0
  const inH = Number(innerHeightCm) || 0
  const innerAreaM2 = (inW * inH) / 10000

  const isLarge = Math.max(w, h) > 40
  
  // Khăn lụa mặc định dùng viền nhôm, hao hụt +10%
  const tyLeHaoHutKhung = 0.1 
  const chieuDaiKhungCanM = chuViM * (1 + tyLeHaoHutKhung)

  const rows = []
  const addRow = (label, unit, qty, unitPrice) => {
    const total = qty * unitPrice
    rows.push({ label, unit, qty, unitPrice, total })
    return total
  }

  // Đơn giá khung
  let khungPerM = Number(khungPerMOverride) > 0 ? Number(khungPerMOverride) : 0
  khungPerM = khungPerM * khungNameMultiplier

  let nvlTotal = 0
  const isMakingFrame = (toggles?.khung !== false) && (khungPerM > 0)

  if (isMakingFrame) {
    nvlTotal += addRow('Khung (Khăn lụa)', 'm', chieuDaiKhungCanM, khungPerM)
  }

  // 1. VÁN LÓT
  let dienTichVanM2 = areaM2
  if (khungCategory === 'Khăn Lụa Khung Moebe') {
    const sizeKey = `${w}x${h}`
    const mappedSize = MOEBE_SILK_INNER_SIZES[sizeKey]
    if (mappedSize) {
      dienTichVanM2 = (mappedSize.innerW * mappedSize.innerH) / 10000
    } else if (inW > 0 && inH > 0) {
      dienTichVanM2 = innerAreaM2
    }
  }
  if (customVanPrice > 0) {
    nvlTotal += addRow(customVanLabel, 'm²', dienTichVanM2, customVanPrice)
  }

  // 2. KÍNH/MICA (X2 mặt cho Moebe)
  if (customGlassPrice > 0) {
    const isMoebe = khungCategory === 'Khăn Lụa Khung Moebe'
    const glassQty = isMoebe ? areaM2 * 2 : areaM2
    const glassLbl = isMoebe ? `${customGlassLabel} (Kẹp 2 mặt)` : customGlassLabel
    nvlTotal += addRow(glassLbl, 'm²', glassQty, customGlassPrice)
  }

  // 3. GIẤY BO
  if (khungCategory === 'Khăn Lụa Khung Matboard' && customGiayBoPrice > 0) {
    nvlTotal += addRow(customGiayBoLabel, 'm²', areaM2, customGiayBoPrice)
  }

  // 4. PHỤ KIỆN & ĐÓNG GÓI
  const priceKeGoc = Number(settings['ke_goc'] || settings.keGocPerBo) || 0
  const priceMocTreo = Number(settings['moc_treo'] || settings.mocTreoPerCai) || 0
  const pricePeCuon = Number(settings['pe_cuon'] || settings.peCuonPerKg) || 0
  const priceXop = Number(settings['xop_bong_khi'] || settings.xopBongKhiPerCay) || 0
  const priceCarton = Number(settings['carton'] || settings.cartonPerKg) || 0
  const priceBangKeo = Number(settings['bang_keo'] || settings.bangKeoPerCay) || 0

  if (isMakingFrame) {
    if (priceKeGoc > 0) nvlTotal += addRow('Bộ ke góc (khung nhôm)', 'Bộ', 1, priceKeGoc)

    // 🌟 Mặc định cho Khăn lụa (Vẫn tính dây treo nếu là khung lớn)
    let mocTreoQty = isLarge ? 2 : 1
    let dayTreoQty = isLarge ? ((w + 20) / 100) : 0

    // 🌟 Luật riêng: Khăn lụa Moebe luôn có 2 móc và KHÔNG dây treo
    if (khungCategory === 'Khăn Lụa Khung Moebe') {
      mocTreoQty = 2
      dayTreoQty = 0
    }

    if (mocTreoQty > 0 && priceMocTreo > 0) nvlTotal += addRow('Móc treo', 'Cái', mocTreoQty, priceMocTreo)
    if (dayTreoQty > 0) nvlTotal += addRow('Dây treo', 'm', dayTreoQty, 500)
  }

  const hasDongGoi = toggles?.dongGoi === true
  if (hasDongGoi) {
    if (pricePeCuon > 0) nvlTotal += addRow('Pe cuộn', 'kg', ((areaM2 * 1.5 * 1.2) * 3.5) / 171, pricePeCuon)
    if (priceXop > 0) nvlTotal += addRow('Xốp bóng khí', 'Cây', (areaM2 * 2 * 1.2) / 140, priceXop)
    if (priceCarton > 0) nvlTotal += addRow('Carton', 'kg', areaM2 * 0.96, priceCarton)
    if (priceBangKeo > 0) nvlTotal += addRow('Băng keo trong', 'Cây', (areaM2 * 1.1) / 9.6, priceBangKeo)
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
  
  if (isMakingFrame) {
    laborTotal += addLabor('Chi phí giờ công làm khung', chieuDaiKhungCanM * 0.1)
  }
  
  const glassLaborArea = (khungCategory === 'Khăn Lụa Khung Moebe') ? areaM2 * 2 : areaM2
  laborTotal += addLabor('Chi phí giờ công làm mica/kính/ván', glassLaborArea * 0.2)

  if (hasDongGoi) {
    laborTotal += addLabor('Chi phí giờ công đóng gói', areaM2 * 0.5)
  }

  // 🌟 GIỜ CÔNG LÀM KHĂN LỤA
  const soGioLamKhan = GIO_LAM_KHAN_RATES[khungCategory] || 0
  if (soGioLamKhan > 0) {
    laborTotal += addLabor(`Công nhân làm khăn (${khungCategory})`, soGioLamKhan)
  }

  const sxc = laborTotal * 0.3
  const grandTotal = nvlTotal + laborTotal + sxc

  return {
    areaM2, innerAreaM2, chuViM, chieuDaiKhungCanM,
    materialRows: rows, laborRows, nvlTotal, laborTotal, sxc, grandTotal,
  }
}