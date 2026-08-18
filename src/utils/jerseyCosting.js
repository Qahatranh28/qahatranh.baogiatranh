import { getTranhInDetail } from '../services/tranhInService.js'
import { getGlassMicaDetail } from '../services/glassMicaService.js'

const DEFAULT_FORMEX_ID = 'tranh_in_formex_10ly_mo'
const DEFAULT_GLASS_ID = 'kinh'
const JERSEY_LABOR_HOURS = 3

/**
 * Tính giá vốn khung áo đấu:
 * - Khung: chu vi × đơn giá khung/m (hao hụt 10% cho nhôm)
 * - In tranh: mặc định Formex 10ly mờ
 * - Kính: theo diện tích khung
 * - Nhân công: cố định 3 giờ làm áo
 * - Đóng gói + SXC: theo công thức chung
 */
export function computeJerseyCost(
  widthCm,
  heightCm,
  khungRatePerM,
  isNhom,
  settings = {},
  dbMaterialsList = [],
  toggles = {}
) {
  const w = Number(widthCm) || 0
  const h = Number(heightCm) || 0
  const areaM2 = (w * h) / 10000
  const chuViM = (2 * (w + h)) / 100
  const tyLeHaoHut = isNhom ? 0.1 : 0.2
  const chieuDaiKhungM = chuViM * (1 + tyLeHaoHut)

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
    nvlTotal += addRow(formexMat.label || 'In Formex 10ly mờ', 'm²', areaM2, formexMat.price)
  }

  const glassMat = getGlassMicaDetail(DEFAULT_GLASS_ID, dbMaterialsList)
  if (glassMat.price > 0) {
    nvlTotal += addRow(glassMat.label || 'Kính', 'm²', areaM2, glassMat.price)
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

  let laborTotal = addLabor('Tiền công nhân làm áo đấu', JERSEY_LABOR_HOURS)
  laborTotal += addLabor('Chi phí giờ công làm khung', chieuDaiKhungM * 0.1)
  laborTotal += addLabor('Chi phí giờ công làm kính', areaM2 * 0.2)

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
