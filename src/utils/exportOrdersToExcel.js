import * as XLSX from 'xlsx'

// Xuất danh sách báo giá (đã lọc theo tháng) ra 1 file Excel.
// isAdmin quyết định có xuất kèm giá vốn/lợi nhuận hay chỉ thông tin công khai.
export function exportOrdersToExcel(orders, monthLabel, isAdmin) {
  const summaryRows = orders.map((order, index) => {
    const base = {
      STT: index + 1,
      'Ngày': new Date(order.createdAt).toLocaleDateString('vi-VN'),
      'Khách hàng': order.customerName || 'Khách lẻ',
      'Số sản phẩm': order.items.length,
      'Tạm tính (VND)': order.itemsSubtotal ?? order.itemsTotal,
      'Chiết khấu đơn (%)': order.discountPercent || 0,
      'Tổng tiền (VND)': order.itemsTotal,
    }
    if (isAdmin) {
      base['Giá vốn (VND)'] = order.itemsCost
      base['Lợi nhuận (VND)'] = order.profit
      base['Biên lợi nhuận (%)'] = Number(order.margin.toFixed(1))
    }
    return base
  })

  const detailRows = orders.flatMap((order) =>
    order.items.map((item) => ({
      'Ngày': new Date(order.createdAt).toLocaleDateString('vi-VN'),
      'Khách hàng': order.customerName || 'Khách lẻ',
      'Sản phẩm': item.name,
      'Kích thước (cm)': `${item.width}×${item.height}`,
      'Số lượng': item.quantity,
      'Thành tiền (VND)': item.lineTotal,
    }))
  )

  const workbook = XLSX.utils.book_new()
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows)
  const detailSheet = XLSX.utils.json_to_sheet(detailRows)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng hợp đơn hàng')
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Chi tiết sản phẩm')

  const fileName = `bao-gia-${monthLabel.replace(/\s|\//g, '-')}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
