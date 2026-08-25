// src/utils/frameCosting.js

import { computeSilkScarfCost } from './silkScarfCosting.js'

export function computeFrameCost(
  widthCm, heightCm, toggles = {}, settings = {}, isKinh = true,
  khungPerMOverride = null, khungNameMultiplier = 1, isNhom = false,
  customTranhInPrice = 0, customTranhInLabel = 'Tranh in',
  customGlassPrice = 0, customGlassLabel = 'Kính/Mica',
  customVanPrice = 0, customVanLabel = 'Ván lót',
  customGiayBoPrice = 0, customGiayBoLabel = 'Giấy bo',
  customSatXiPrice = 0, customSatXiLabel = 'Sắt xi',
  mode = 'simple', innerWidthCm = 0, innerHeightCm = 0,
  moebeGlassPrice = 0, moebeGlassLabel = '',
  moebeCorePrice = 0, moebeCoreLabel = '',
  khungCategory = '',
  glassSheetMultiplier = 1,
  // 🌟 Thêm tham số nhận cấu hình từ form Custom
  customTierOption = '1',
  customFomexPrice = 0,
  customFomexLabel = 'Viền Fomex'
) {
  // 🌟 Đẩy luồng tính Khăn Lụa sang file riêng
  const isKhanLua = typeof khungCategory === 'string' && khungCategory.includes('Khăn Lụa')
  
  if (isKhanLua) {
    return computeSilkScarfCost(
      widthCm, heightCm, toggles, settings, isKinh, khungPerMOverride, khungNameMultiplier, isNhom,
      customTranhInPrice, customTranhInLabel, customGlassPrice, customGlassLabel,
      customVanPrice, customVanLabel, customGiayBoPrice, customGiayBoLabel,
      customSatXiPrice, customSatXiLabel, mode, innerWidthCm, innerHeightCm,
      moebeGlassPrice, moebeGlassLabel, moebeCorePrice, moebeCoreLabel, khungCategory,
      customFomexPrice,
      customFomexLabel
    )
  }

  // ==========================================
  // LOGIC TÍNH KHUNG TRANH BÌNH THƯỜNG
  // ==========================================
  const w = Number(widthCm) || 0
  const h = Number(heightCm) || 0
  const areaM2 = (w * h) / 10000
  const chuViM = (2 * (w + h)) / 100
  
  const inW = Number(innerWidthCm) || 0
  const inH = Number(innerHeightCm) || 0
  const innerAreaM2 = (inW * inH) / 10000

  const isLarge = Math.max(w, h) > 40
  
  const tyLeHaoHutKhung = isNhom ? 0.1 : 0.2
  const chieuDaiKhungCanM = chuViM * (1 + tyLeHaoHutKhung)

  const tyLeHaoHutSatXi = 0.1
  const tongSatXiM = chuViM * (1 + tyLeHaoHutSatXi)

  const rows = []
  const addRow = (label, unit, qty, unitPrice) => {
    const total = qty * unitPrice
    rows.push({ label, unit, qty, unitPrice, total })
    return total
  }

  let khungPerM = Number(khungPerMOverride) > 0 ? Number(khungPerMOverride) : 0
  
  // 🌟 YÊU CẦU 1: NẾU CHỌN KIỂU 2 THÌ GIÁ VỐN KHUNG NHÂN ĐÔI (x2)
  if (String(customTierOption) === '2') {
    khungPerM = khungPerM * 2
  }

  khungPerM = khungPerM * khungNameMultiplier

  const priceKeGoc = Number(settings['ke_goc'] || settings.keGocPerBo) || 0
  const priceMocTreo = Number(settings['moc_treo'] || settings.mocTreoPerCai) || 0
  const priceDinhGhim = Number(settings['dinh_ghim'] || settings.dinhGhimPerCai) || 0
  const pricePeCuon = Number(settings['pe_cuon'] || settings.peCuonPerKg) || 0
  const priceXop = Number(settings['xop_bong_khi'] || settings.xopBongKhiPerCay) || 0
  const priceCarton = Number(settings['carton'] || settings.cartonPerKg) || 0
  const priceBangKeo = Number(settings['bang_keo'] || settings.bangKeoPerCay) || 0

  let nvlTotal = 0

  const isMakingFrame = (toggles?.khung !== false) && (khungPerM > 0)

  if (isMakingFrame) {
    nvlTotal += addRow('Khung', 'm', chieuDaiKhungCanM, khungPerM)
  }

  // VẬT TƯ CHÍNH
  if (mode === 'moebe') {
    if (moebeGlassPrice > 0) {
      const glassLabel = (moebeGlassLabel || 'Kính/Mica') + ' (Kẹp 2 mặt)'
      nvlTotal += addRow(glassLabel, 'm²', areaM2 * 2, moebeGlassPrice)
    }
    if (moebeCorePrice > 0) {
      const coreLabel = moebeCoreLabel || 'Vật liệu ruột Moebe'
      nvlTotal += addRow(coreLabel, 'm²', innerAreaM2, moebeCorePrice)
    }
    nvlTotal += addRow('Viền Fomex (Moebe)', 'Bộ', 1, 10000)
  } else {
    if (toggles?.tranhIn && customTranhInPrice > 0) {
      nvlTotal += addRow(customTranhInLabel, 'm²', areaM2, customTranhInPrice)
    }
    if (toggles?.micaKinh && customGlassPrice > 0) {
      const sheets = Number(glassSheetMultiplier) === 2 ? 2 : 1
      const glassQty = areaM2 * sheets
      const glassLbl = sheets === 2 ? `${customGlassLabel} (2 tấm)` : customGlassLabel
      nvlTotal += addRow(glassLbl, 'm²', glassQty, customGlassPrice)
    }
    if (toggles?.van && customVanPrice > 0) {
      nvlTotal += addRow(customVanLabel, 'm²', areaM2, customVanPrice)
    }
    
    // 🌟 YÊU CẦU 2: TÍNH VIỀN FOMEX (BẢN RỘNG 2CM, CHIỀU DÀI THEO CHU VI KHUNG HOẶC DIỆN TÍCH)
    // Bản rộng cố định 2cm = 0.02 mét. Diện tích viền fomex = Chu vi (mét) * 0.02 (mét)
    const fomexAreaM2 = chuViM * 0.02
    if (toggles?.vienFomex && String(customTierOption) === '1' && customFomexPrice > 0 && fomexAreaM2 > 0) {
      nvlTotal += addRow(customFomexLabel || 'Viền Fomex', 'm²', fomexAreaM2, customFomexPrice)
    }

    if (toggles?.giayBo && customGiayBoPrice > 0) {
      nvlTotal += addRow(customGiayBoLabel, 'm²', areaM2, customGiayBoPrice)
    }
    if (toggles?.satXi && customSatXiPrice > 0) {
      nvlTotal += addRow(customSatXiLabel, 'm', tongSatXiM, customSatXiPrice)
    }
  }

  // ==========================================
  // PHỤ KIỆN
  // ==========================================
  if (isMakingFrame) {
    if (isNhom) {
      if (priceKeGoc > 0) nvlTotal += addRow('Bộ ke góc (khung nhôm)', 'Bộ', 1, priceKeGoc)
    } else {
      const soDinhGhim = ((chuViM * 100) / 10) + 12
      if (priceDinhGhim > 0) nvlTotal += addRow('Đinh/ghim/ốc vít/NVL khác', 'Cái', soDinhGhim, priceDinhGhim)
    }

    let mocTreoQty = isLarge ? 2 : 1
    let dayTreoQty = isLarge ? ((w + 20) / 100) : 0

    if (mode === 'moebe') {
      mocTreoQty = 2
      dayTreoQty = 0
    }

    if (mocTreoQty > 0 && priceMocTreo > 0) nvlTotal += addRow('Móc treo', 'Cái', mocTreoQty, priceMocTreo)
    if (dayTreoQty > 0) nvlTotal += addRow('Dây treo', 'm', dayTreoQty, 500)
  }

  // ĐÓNG GÓI
  const hasDongGoi = toggles?.dongGoi === true
  if (hasDongGoi) {
    if (pricePeCuon > 0) nvlTotal += addRow('Pe cuộn', 'kg', ((areaM2 * 1.5 * 1.2) * 3.5) / 171, pricePeCuon)
    if (priceXop > 0) nvlTotal += addRow('Xốp bóng khí', 'Cây', (areaM2 * 2 * 1.2) / 140, priceXop)
    if (priceCarton > 0) nvlTotal += addRow('Carton', 'kg', areaM2 * 0.96, priceCarton)
    if (priceBangKeo > 0) nvlTotal += addRow('Băng keo trong', 'Cây', (areaM2 * 1.1) / 9.6, priceBangKeo)
  }

  // NHÂN CÔNG
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
  
  const hasGlassOrBoard = mode === 'moebe' || toggles?.micaKinh || toggles?.van
  if (hasGlassOrBoard) {
    const sheets = Number(glassSheetMultiplier) === 2 ? 2 : 1
    const glassLaborArea = mode === 'moebe' ? areaM2 * 2 : areaM2 * (toggles?.micaKinh ? sheets : 1)
    laborTotal += addLabor('Chi phí giờ công làm mica/kính/ván', glassLaborArea * 0.2)
  }

  // 🌟 YÊU CẦU 3: CHI PHÍ CÔNG NHÂN LÀM FOMEX (TƯƠNG TỰ CÔNG NHÂN LÀM VÁN LÓT)
  const fomexAreaM2ForLabor = chuViM * 0.02
  if (toggles?.vienFomex && String(customTierOption) === '1' && fomexAreaM2ForLabor > 0) {
    laborTotal += addLabor('Chi phí giờ công làm viền fomex', fomexAreaM2ForLabor * 0.2)
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
    areaM2, innerAreaM2, chuViM, chieuDaiKhungCanM,
    materialRows: rows, laborRows, nvlTotal, laborTotal, sxc, grandTotal,
  }
}