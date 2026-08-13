// Helper dùng chung: tách chiều rộng/chiều cao (số, cho phép số thập phân như
// 59.4) từ TÊN SIZE (ví dụ "50 x 70 cm", "42 x 59.4 cm(A2)", "40 x 60 cm (9 ảnh)").
//
// Vì sao cần file này: bảng `frame_size` trên Database chỉ có cột `size_name`
// (+ `price`) — KHÔNG có cột width/height được nhập tay cho từng size cố định.
// Trước đây, mọi nơi đọc size chuẩn từ DB đều lấy thẳng `s.width`/`s.height`
// (mặc định về 0 khi DB không có), khiến các hàm so khớp "size gần nhất"
// (findRoundUpStandardSize) luôn bị loại vì điều kiện width>0 && height>0
// không bao giờ đúng. Hệ quả: khách tùy chỉnh size lẻ ở khung tiêu chuẩn sẽ
// không bao giờ tìm được size chuẩn gần nhất để áp giá.
//
// Hàm bên dưới dùng làm phương án dự phòng: nếu DB đã có sẵn width/height hợp
// lệ (> 0) thì ưu tiên dùng đúng số đó; nếu không, tự suy ra từ size_name.
export function parseDimensionsFromSizeName(label) {
  if (!label) return { width: 0, height: 0 }
  // Bắt tối đa 2 số đầu tiên trong tên size, cho phép phần thập phân (vd 59.4)
  const matches = String(label).match(/(\d+(?:[.,]\d+)?)/g)
  if (!matches || matches.length < 2) return { width: 0, height: 0 }

  const toNumber = (s) => Number(String(s).replace(',', '.')) || 0
  return {
    width: toNumber(matches[0]),
    height: toNumber(matches[1]),
  }
}

// Trả về {width, height} ưu tiên dữ liệu đã có sẵn trên DB (nếu hợp lệ, > 0),
// nếu không thì tự suy ra từ size_name/label bằng parseDimensionsFromSizeName.
export function resolveSizeDimensions(sizeRow) {
  const dbWidth = Number(sizeRow?.width) || 0
  const dbHeight = Number(sizeRow?.height) || 0
  if (dbWidth > 0 && dbHeight > 0) {
    return { width: dbWidth, height: dbHeight }
  }

  const label = sizeRow?.size_name || sizeRow?.label || ''
  const parsed = parseDimensionsFromSizeName(label)
  return {
    width: parsed.width > 0 ? parsed.width : dbWidth,
    height: parsed.height > 0 ? parsed.height : dbHeight,
  }
}
