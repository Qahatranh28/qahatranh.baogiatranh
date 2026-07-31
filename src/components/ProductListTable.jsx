import { formatVND } from '../utils/format.js'

export default function ProductListTable({ items, onRemove, itemsSubtotal }) {
  if (items.length === 0) {
    return (
      <section className="bg-paper rounded-2xl border border-line p-10 text-center">
        <p className="text-blueprint-light text-sm">
          Chưa có sản phẩm nào trong danh sách. Điền thông tin ở form bên trên
          rồi bấm <span className="font-medium text-blueprint">“+ Thêm vào danh sách”</span>.
        </p>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-blueprint/5 text-blueprint">
              <th className="text-left font-mono text-xs uppercase tracking-widest px-4 py-3 w-12">
                STT
              </th>
              <th className="text-left font-mono text-xs uppercase tracking-widest px-4 py-3">
                Tên sản phẩm
              </th>
              <th className="text-right font-mono text-xs uppercase tracking-widest px-4 py-3">
                Kích thước (cm)
              </th>
              <th className="text-right font-mono text-xs uppercase tracking-widest px-4 py-3">
                SL
              </th>
              <th className="text-right font-mono text-xs uppercase tracking-widest px-4 py-3">
                Thành tiền
              </th>
              <th className="w-10 px-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.id}
                className={
                  index % 2 === 1 ? 'bg-amber/5 border-t border-line' : 'border-t border-line'
                }
              >
                <td className="px-4 py-3 text-blueprint-light">{index + 1}</td>
                <td className="px-4 py-3 text-blueprint font-medium">{item.name}</td>
                <td className="px-4 py-3 text-right font-mono text-blueprint-light">
                  {item.width.toFixed(0)}×{item.height.toFixed(0)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-blueprint-light">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium text-blueprint">
                  {formatVND(item.lineTotal)}
                </td>
                <td className="px-2 py-3 text-center">
                  <button
                    onClick={() => onRemove(item.id)}
                    aria-label={`Xoá ${item.name}`}
                    className="text-blueprint-light hover:text-red-600 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-amber/10 border-t-2 border-amber/40">
              <td colSpan={4} className="px-4 py-3 text-right font-medium text-blueprint">
                Tạm tính
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold text-blueprint">
                {formatVND(itemsSubtotal)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}
