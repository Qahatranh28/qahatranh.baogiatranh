import { getTranhInDetail } from '../services/tranhInService.js'
import { getMica2LiDetail } from '../services/glassMicaService.js'

const DEFAULT_FORMEX_ID = 'tranh_in_formex_10ly_mo'
// 🌟 Khung áo đấu: mặc định vật tư mặt kính/mica là Mica 2 ly lấy giá từ DB.
const JERSEY_LABOR_HOURS = 3

/**
 * Tính giá vốn khung áo đấu:
 * - Khung: chu vi × đơn giá khung/m (hao hụt 10% cho nhôm)
 * - In tranh: mặc định Formex 10ly mờ (x2 nếu là 2 mặt cao cấp)
 * - Kính (Mica 2 ly): theo diện tích khung (x2 nếu là 2 mặt cao cấp)
 * - Nhân công: cố định 3 giờ làm áo (x2 nếu là 2 mặt cao cấp)
 * - Đóng gói + SXC: theo công thức chung
 */
export function computeJerseyCost(
  widthCm,
  heightCm,
  khungRatePerM,
  isNhom,
  settings = {},
  dbMaterialsList = [],
  toggles = {},
  tier = 'basic' // 🌟 Nhận thêm tham số tier để phân biệt gói áo đấu
) {
  const w = Number(widthCm) || 0
  const h = Number(heightCm) || 0
  const areaM2 = (w * h) / 10000
  const chuViM = (2 * (w + h)) / 100
  const tyLeHaoHut = isNhom ? 0.1 : 0.2
  const chieuDaiKhungM = chuViM * (1 + tyLeHaoHut)

  // 🌟 Nếu là 2 mặt cao cấp (2_faces_premium), hệ số nhân vật tư/công nhân liên quan là 2
  const is2Faces = tier === '2_faces_premium'
  const multiplier = is2Faces ? 2 : 1

  const rows = []
  const addRow = (label, unit, qty, unitPrice) => {
    const total = qty * unitPrice
    rows.push({ label, unit, qty, unitPrice, total })
    return total
  }

  let nvlTotal = 0
  const khungRate = Number(khungRatePerM) || 0

  if (khungRate > 0) {
    nvlTotal += addRow('Khung', 'm', chieuDaiKhungM, khungRate)
  }

  const formexMat = getTranhInDetail(DEFAULT_FORMEX_ID, dbMaterialsList)
  if (formexMat.price > 0) {
    // 🌟 In tranh x2 nếu là 2 mặt cao cấp
    const qtyInTranh = areaM2 * multiplier
    const labelSuffix = is2Faces ? ' (2 mặt)' : ''
    nvlTotal += addRow((formexMat.label || 'In Formex 10ly mờ') + labelSuffix, 'm²', qtyInTranh, formexMat.price)
  }

  const glassMat = getMica2LiDetail(dbMaterialsList)
  if (glassMat.price > 0) {
    const qtyMica = areaM2 * multiplier
    const labelSuffix = is2Faces ? ' x2' : '' // 🌟 Sửa x2 thành chuỗi ' x2'
    nvlTotal += addRow((glassMat.label || 'Mica 2 ly') + labelSuffix, 'm²', qtyMica, glassMat.price)
  }

  const priceDinhGhim = Number(settings.dinhGhimPerCai) || 0
  if (!isNhom && priceDinhGhim > 0) {
    const soDinhGhim = ((chuViM * 100) / 10) + 12
    nvlTotal += addRow('Đinh/ghim/ốc vít/NVL khác', 'Cái', soDinhGhim, priceDinhGhim)
  }

  if (isNhom) {
    const keGoc = Number(settings.keGocPerBo) || 0
    if (keGoc > 0) nvlTotal += addRow('Bộ ke góc (khung nhôm)', 'Bộ', 1, keGoc)
  }

  const mocTreo = Number(settings.mocTreoPerCai) || 0
  if (mocTreo > 0) nvlTotal += addRow('Móc treo', 'Cái', 2, mocTreo)

  const isLarge = Math.max(w, h) > 40
  const dayTreoPerM = Number(settings.dayTreoPerM) || 500
  const dayTreoQty = isLarge ? (w + 20) / 100 : 0
  if (dayTreoQty > 0 && dayTreoPerM > 0) {
    nvlTotal += addRow('Dây treo', 'm', dayTreoQty, dayTreoPerM)
  }

  if (toggles.dongGoi) {
    const peCuon = Number(settings.peCuonPerKg) || 0
    const xop = Number(settings.xopBongKhiPerCay) || 0
    const carton = Number(settings.cartonPerKg) || 0
    const bangKeo = Number(settings.bangKeoPerCay) || 0
    if (peCuon > 0) nvlTotal += addRow('Pe cuộn', 'kg', ((areaM2 * 1.5 * 1.2) * 3.5) / 171, peCuon)
    if (xop > 0) nvlTotal += addRow('Xốp bóng khí', 'Cây', (areaM2 * 2 * 1.2) / 140, xop)
    if (carton > 0) nvlTotal += addRow('Carton', 'kg', areaM2 * 0.96, carton)
    if (bangKeo > 0) nvlTotal += addRow('Băng keo trong', 'Cây', (areaM2 * 1.1) / 9.6, bangKeo)
  }

  const laborRows = []
  const luongNC = Number(settings.luongNhanCongPerGio) || 40000
  const addLabor = (label, hours) => {
    const total = hours * luongNC
    laborRows.push({ label, unit: 'giờ', qty: hours, unitPrice: luongNC, total })
    return total
  }

  // 🌟 Tiền công nhân làm áo đấu x2 nếu là 2 mặt cao cấp
  let laborTotal = addLabor('Tiền công nhân làm áo đấu' + (is2Faces ? ' x2' : ''), JERSEY_LABOR_HOURS * multiplier)
  
  laborTotal += addLabor('Chi phí giờ công làm khung', chieuDaiKhungM * 0.1)
  
  // 🌟 Chi phí giờ công làm mica x2 nếu là 2 mặt cao cấp
  laborTotal += addLabor('Chi phí giờ công làm mica' + (is2Faces ? ' x2' : ''), (areaM2 * 0.2) * multiplier)

  if (toggles.dongGoi) {
    laborTotal += addLabor('Chi phí giờ công đóng gói', areaM2 * 0.5)
  }

  const sxc = laborTotal * 0.3
  const grandTotal = nvlTotal + laborTotal + sxc

  return {
    areaM2,
    chuViM,
    materialRows: rows,
    laborRows,
    nvlTotal,
    laborTotal,
    sxc,
    grandTotal,
  }
}