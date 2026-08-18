export default function MoebePriceTable({ frameTypes, sizes, onUpdate, onSave, saving, loading }) {
  if (loading) return <p className="text-sm text-blueprint/50">Đang tải bảng giá Moebe...</p>

  const frameNameById = Object.fromEntries(frameTypes.map((f) => [f.frame_id, f.name]))

  return (
    <div className="bg-paper rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <p className="text-xs uppercase tracking-widest text-blueprint/50">
          Giá bán Khung Moebe (price / price_print)
        </p>
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-amber text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-amber/90 transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Lưu bảng giá Moebe lên DB'}
        </button>
      </div>

      <div className="overflow-x-auto border border-line rounded-lg max-h-[500px]">
        <table className="w-full min-w-[720px] text-sm border-collapse">
          <thead>
            <tr className="bg-blueprint/5 text-blueprint">
              <th className="text-left font-mono text-xs uppercase px-3 py-2">Loại khung</th>
              <th className="text-left font-mono text-xs uppercase px-3 py-2">Size</th>
              <th className="text-right font-mono text-xs uppercase px-3 py-2">Giá khung</th>
              <th className="text-right font-mono text-xs uppercase px-3 py-2">Giá + in tranh</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {sizes.map((row) => (
              <tr key={row.__rowKey ?? `${row.id ?? 'row'}-${row.size_label ?? 'size'}`} className="border-t border-line hover:bg-gray-50">
                <td className="px-3 py-2 text-blueprint/80 whitespace-nowrap">
                  {frameNameById[row.frame_id] || '—'}
                </td>
                <td className="px-3 py-2 font-medium">{row.size_label}</td>
                <td className="px-2 py-2 text-right">
                  <input
                    type="number"
                    value={row.price ?? ''}
                    onChange={(e) => onUpdate(row.__rowKey ?? row.id, 'price', e.target.value)}
                    className="w-28 border border-line rounded-md px-2 py-1 text-sm text-right outline-none focus:border-amber font-mono"
                  />
                </td>
                <td className="px-2 py-2 text-right">
                  <input
                    type="number"
                    value={row.price_print ?? ''}
                    onChange={(e) => onUpdate(row.__rowKey ?? row.id, 'price_print', e.target.value)}
                    className="w-28 border border-line rounded-md px-2 py-1 text-sm text-right outline-none focus:border-amber font-mono"
                  />
                </td>
              </tr>
            ))}
            {sizes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-blueprint/40">
                  Chưa có dữ liệu trong bảng frame_size_moebe
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function JerseyPriceTable({ prices, onUpdate, onSave, saving, loading }) {
  if (loading) return <p className="text-sm text-blueprint/50">Đang tải bảng giá Khung áo đấu...</p>

  return (
    <div className="bg-paper rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <p className="text-xs uppercase tracking-widest text-blueprint/50">
          Giá bán Khung áo đấu theo size áo
        </p>
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-amber text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-amber/90 transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Lưu bảng giá Áo đấu lên DB'}
        </button>
      </div>

      <div className="overflow-x-auto border border-line rounded-lg">
        <table className="w-full min-w-[480px] text-sm border-collapse">
          <thead>
            <tr className="bg-blueprint/5 text-blueprint">
              <th className="text-left font-mono text-xs uppercase px-3 py-2">Size áo</th>
              <th className="text-right font-mono text-xs uppercase px-3 py-2">1 mặt cơ bản</th>
              <th className="text-right font-mono text-xs uppercase px-3 py-2">1 mặt cao cấp</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {prices.map((row) => (
              <tr key={`${row.id}-${row.size_label || 'row'}`} className="border-t border-line hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{row.size_label}</td>
                <td className="px-2 py-2 text-right">
                  <input
                    type="number"
                    value={row.price_basic ?? ''}
                    onChange={(e) => onUpdate(row.id, 'price_basic', e.target.value)}
                    className="w-32 border border-line rounded-md px-2 py-1 text-sm text-right outline-none focus:border-amber font-mono"
                  />
                </td>
                <td className="px-2 py-2 text-right">
                  <input
                    type="number"
                    value={row.price_premium ?? ''}
                    onChange={(e) => onUpdate(row.id, 'price_premium', e.target.value)}
                    className="w-32 border border-line rounded-md px-2 py-1 text-sm text-right outline-none focus:border-amber font-mono"
                  />
                </td>
              </tr>
            ))}
            {prices.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-blueprint/40">
                  Chưa có dữ liệu trong bảng jersey_frame_prices
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
