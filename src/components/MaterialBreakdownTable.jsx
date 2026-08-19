import { formatVND } from '../utils/format.js'
import { isNhomType } from '../data/frameDefaults.js'

// 🌟 Ô nhỏ hiển thị TẤT CẢ vật tư cấu thành sản phẩm đang chọn — cùng cấu
// trúc dữ liệu và cách trình bày với "Chi tiết vật tư & Giá gốc" lúc xuất báo
// giá (xem ItemCostBreakdown trong OrderHistory.jsx). Chỉ nên render component
// này khi người dùng có role admin — việc kiểm tra quyền do component cha
// (ResultPanel) đảm nhiệm.
// 🌟 `open`/`onToggle` được điều khiển từ ResultPanel (thay vì state nội bộ)
// để ResultPanel có thể ẩn ảnh minh hoạ đi khi ô này đang mở, tiết kiệm diện tích.
export default function MaterialBreakdownTable({
  costResult,
  mode = 'simple',
  khungType = '',
  open = false,
  onToggle,
}) {
  if (!costResult) return null

  const isStandard = mode === 'simple'
  const isNhom = isNhomType(khungType)
  const allRows = [...(costResult.materialRows ?? []), ...(costResult.laborRows ?? [])].filter(
    (row) => {
      if (isStandard && row.label?.startsWith('Sắt xi')) return false
      if (row.label?.startsWith('Ke góc') && !isNhom) return false
      return true
    }
  )

  if (allRows.length === 0) return null

  return (
    <div className="mt-4 rounded-lg border border-amber/40 overflow-hidden bg-white text-blueprint">
      <button
        type="button"
        onClick={() => onToggle?.(!open)}
        className="w-full flex items-center justify-between gap-2 bg-blueprint text-paper px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-widest"
      >
        <span className="flex items-center gap-1.5">
          <span className="bg-amber text-blueprint px-1 py-0.5 rounded text-[9px] font-bold">
            Admin
          </span>
          Chi tiết vật tư cấu thành
        </span>
        <span className="text-paper/60">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-[11px]">
              <thead>
                <tr className="bg-blueprint/5 text-blueprint">
                  <th className="text-left font-mono uppercase tracking-widest px-2 py-1">Khoản mục</th>
                  <th className="text-left font-mono uppercase tracking-widest px-2 py-1">Đơn vị</th>
                  <th className="text-right font-mono uppercase tracking-widest px-2 py-1">SL</th>
                  <th className="text-right font-mono uppercase tracking-widest px-2 py-1">Đơn giá</th>
                  <th className="text-right font-mono uppercase tracking-widest px-2 py-1">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {allRows.map((row, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-2 py-1 text-blueprint">{row.label}</td>
                    <td className="px-2 py-1 text-blueprint/60">{row.unit}</td>
                    <td className="px-2 py-1 text-right font-mono text-blueprint/70">
                      {(row.qty ?? 0).toFixed(row.qty % 1 === 0 ? 0 : 2)}
                    </td>
                    <td className="px-2 py-1 text-right font-mono text-blueprint/70">
                      {formatVND(row.unitPrice)}
                    </td>
                    <td className="px-2 py-1 text-right font-mono font-medium text-blueprint">
                      {formatVND(row.total)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-amber/10 border-t-2 border-amber/40">
                  <td colSpan={4} className="px-2 py-1 text-right font-medium text-blueprint">
                    Tổng NVL trực tiếp
                  </td>
                  <td className="px-2 py-1 text-right font-mono font-bold text-blueprint">
                    {formatVND(costResult.nvlTotal)}
                  </td>
                </tr>
                <tr className="bg-amber/10 border-t border-amber/20">
                  <td colSpan={4} className="px-2 py-1 text-right font-medium text-blueprint">
                    Tổng nhân công trực tiếp
                  </td>
                  <td className="px-2 py-1 text-right font-mono font-bold text-blueprint">
                    {formatVND(costResult.laborTotal)}
                  </td>
                </tr>
                <tr className="bg-amber/10 border-t border-amber/20">
                  <td colSpan={4} className="px-2 py-1 text-right font-medium text-blueprint">
                    Chi phí sản xuất chung
                  </td>
                  <td className="px-2 py-1 text-right font-mono font-bold text-blueprint">
                    {formatVND(costResult.sxc)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-blueprint px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-paper/70 text-[10px] font-medium">GIÁ VỐN / SẢN PHẨM</span>
            <span className="font-mono text-sm font-bold text-amber">
              {formatVND(costResult.grandTotal)}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
