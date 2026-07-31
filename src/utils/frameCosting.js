// Tính bảng định mức giá thành (giống ảnh mẫu) từ chiều rộng/chiều dài (cm),
// các thành phần được bật/tắt, và bộ cài đặt mặc định (đơn giá + hệ số hao hụt).
//
// Lưu ý: một số định mức trong file mẫu gốc (móc treo, dây treo, vật tư đóng
// gói) không có công thức rõ ràng theo kích thước nên được giữ là số lượng
// mặc định cố định — admin có thể chỉnh tay nếu cần chính xác hơn.
// isKinh: true nếu loại đang chọn ở trường "Mica/Kính" là kính (dùng kinhPerM2),
// false (mặc định) nếu là mica (dùng micaPerM2). Trường mica & kính đã được
// gộp làm một (toggles.micaKinh) theo yêu cầu — chỉ còn 1 dòng chi phí duy
// nhất, đơn giá được chọn dựa trên loại vật liệu đang chọn.
//
// khungPerMOverride: đơn giá khung (VND/m) riêng theo LOẠI KHUNG đang chọn —
// nếu có sẽ dùng thay cho s.khungPerM chung. Cho phép mỗi loại khung có 1 đơn
// giá mặc định khác nhau, áp dụng cho cả chế độ Khung tiêu chuẩn lẫn Custom.
// khungNameMultiplier: hệ số nhân thêm theo TÊN KHUNG (chỉ dùng ở chế độ
// Khung tiêu chuẩn, ví dụ khung để bàn tốn thêm công/vật tư chân đế).
// isNhom: true nếu LOẠI KHUNG đang chọn là khung nhôm — chỉ khung nhôm mới
// phát sinh chi phí "Bộ ke góc" (các loại khung khác — gỗ, nhựa, composite,
// gương... — không dùng ke góc nên không tính khoản này).
// tranhInPerM2Override: đơn giá in tranh (VND/m²) riêng theo LOẠI IN TRANH
// đang chọn — nếu có sẽ dùng thay cho s.tranhInPerM2 chung. Cần thiết để
// tính đúng giá vốn cho các size Custom quá khổ (>1m), vì các size này không
// tra được giá niêm yết theo khổ chuẩn nên phải tính hoàn toàn theo công
// thức + đúng đơn giá của loại tranh in đang chọn.
// Sắt xi vẫn dùng chung 1 đơn giá duy nhất (s.satXiPerM, không phân theo loại).
export function computeFrameCost(
  widthCm,
  heightCm,
  toggles,
  s,
  isKinh = false,
  khungPerMOverride = null,
  khungNameMultiplier = 1,
  isNhom = false,
  tranhInPerM2Override = null
) {
  const w = Number(widthCm) || 0
  const h = Number(heightCm) || 0
  const areaM2 = (w * h) / 10000
  const chuViM = (2 * (w + h)) / 100
  const chieuDaiKhungCanM = chuViM + s.haoHutKhung_cm / 100
  const tongSatXiM = chuViM + s.haoHutSatXi_cm / 100

  const rows = []
  const addRow = (label, unit, qty, unitPrice) => {
    const total = qty * unitPrice
    rows.push({ label, unit, qty, unitPrice, total })
    return total
  }

  const khungPerM = (khungPerMOverride != null ? khungPerMOverride : s.khungPerM) * khungNameMultiplier
  const tranhInPerM2 = tranhInPerM2Override != null ? tranhInPerM2Override : s.tranhInPerM2

  let nvlTotal = 0
  
  // 1. CÁC VẬT TƯ CHÍNH
  nvlTotal += toggles.khung ? addRow('Khung', 'm', chieuDaiKhungCanM, khungPerM) : addRow('Khung', 'm', 0, khungPerM)
  nvlTotal += toggles.tranhIn ? addRow('Tranh in', 'Tấm', 1, tranhInPerM2 * areaM2) : addRow('Tranh in', 'Tấm', 0, tranhInPerM2 * areaM2)
  
  const micaKinhUnitPrice = isKinh ? s.kinhPerM2 : s.micaPerM2
  const micaKinhLabel = isKinh ? 'Kính (tùy chọn)' : 'Mica (tùy chọn)'
  nvlTotal += toggles.micaKinh
    ? addRow(micaKinhLabel, 'm²', areaM2, micaKinhUnitPrice)
    : addRow(micaKinhLabel, 'm²', 0, micaKinhUnitPrice)
    
  nvlTotal += toggles.van ? addRow('Ván lót (tùy chọn)', 'm²', areaM2, s.vanPerM2) : addRow('Ván lót (tùy chọn)', 'm²', 0, s.vanPerM2)
  nvlTotal += toggles.giayBo ? addRow('Giấy bo (tùy chọn)', 'm²', areaM2, s.giayBoPerM2) : addRow('Giấy bo (tùy chọn)', 'm²', 0, s.giayBoPerM2)
  nvlTotal += toggles.satXi ? addRow('Sắt xi (tùy chọn)', 'm', tongSatXiM, s.satXiPerM) : addRow('Sắt xi (tùy chọn)', 'm', 0, s.satXiPerM)
  nvlTotal += addRow('Ke góc (khung nhôm)', 'Bộ', toggles.khung && isNhom ? 1 : 0, s.keGocPerBo)

  // ----------------------------------------------------------------------
  // 2. NHÓM PHỤ KIỆN & PE CUỘN (Tính khi có ĐÓNG KHUNG hoặc SẮT XI)
  // ----------------------------------------------------------------------
  const hasBaseAccessories = toggles.khung || toggles.satXi;
  
  nvlTotal += addRow('Móc treo', 'Cái', hasBaseAccessories ? s.mocTreoMacDinh_cai : 0, s.mocTreoPerCai)
  
  // Công thức Dây treo: (chiều rộng + 20) / 100
  const dayTreoQty = hasBaseAccessories ? ((w + 20) / 100) : 0;
  nvlTotal += addRow('Dây treo', 'm', dayTreoQty, s.dayTreoPerM)

  // Công thức Đinh ghim/ốc vít: 1 cái / 10cm chu vi => (chu vi theo cm) / 10
  const soDinhGhim = hasBaseAccessories ? ((chuViM * 100) / 10) : 0;
  nvlTotal += addRow('Đinh/ghim/ốc vít/NVL khác', 'Cái', soDinhGhim, s.dinhGhimPerCai)
  
  // Công thức tính PE cuộn: (((diện tích * 1.5 * 1.2) * 3.5) / 171)
  const peCuonQty = hasBaseAccessories ? (((areaM2 * 1.5 * 1.2) * 3.5) / 171) : 0
  nvlTotal += addRow('Pe cuộn', 'kg', peCuonQty, s.peCuonPerKg)


  // ----------------------------------------------------------------------
  // 3. NHÓM VẬT TƯ ĐÓNG GÓI CHUYÊN SÂU (Chỉ tính khi bật ĐÓNG GÓI)
  // ----------------------------------------------------------------------
  const xopBongKhiQty = toggles.dongGoi ? ((areaM2 * 2 * 1.2) / 140) : 0;
  const cartonQty = toggles.dongGoi ? ((areaM2 * 2 * 1.2) / 2) : 0;
  const bangKeoQty = toggles.dongGoi ? ((areaM2 * 1.1) / 9.6) : 0;

  nvlTotal += addRow('Xốp bóng khí', 'Cây', xopBongKhiQty, s.xopBongKhiPerCay)
  nvlTotal += addRow('Carton', 'kg', cartonQty, s.cartonPerKg)
  nvlTotal += addRow('Băng keo trong', 'Cây', bangKeoQty, s.bangKeoPerCay)


  // ----------------------------------------------------------------------
  // 4. CHI PHÍ NHÂN CÔNG
  // ----------------------------------------------------------------------
  const laborRows = []
  const addLabor = (label, hours) => {
    const total = hours * s.luongNhanCongPerGio
    laborRows.push({ label, unit: 'giờ', qty: hours, unitPrice: s.luongNhanCongPerGio, total })
    return total
  }

  let laborTotal = 0
  laborTotal += addLabor('Chi phí giờ công làm khung', toggles.khung ? chieuDaiKhungCanM * s.gioLam1mKhung : 0)
  laborTotal += addLabor(
    'Chi phí giờ công làm mica/kính/ván',
    (toggles.micaKinh || toggles.van) ? areaM2 * s.gioLam1m2MicaKinhVan : 0
  )
  laborTotal += addLabor('Chi phí giờ công làm giấy bo', toggles.giayBo ? areaM2 * s.gioLam1m2GiayBo : 0)
  laborTotal += addLabor('Chi phí giờ công sơn', toggles.son ? chuViM * s.gioSon1mKhung : 0)
  laborTotal += addLabor('Chi phí giờ công đóng gói', toggles.dongGoi ? areaM2 * s.gioDongGoi1m2 : 0)

  const sxc = laborTotal * (s.tyLeSXC / 100)
  const grandTotal = nvlTotal + laborTotal + sxc

  return {
    areaM2,
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