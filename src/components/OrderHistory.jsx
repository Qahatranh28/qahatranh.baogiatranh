import { Fragment, useMemo, useState } from 'react'
import { formatVND, formatPercent } from '../utils/format.js'
import { exportOrdersToExcel } from '../utils/exportOrdersToExcel.js'
import { isNhomType } from '../data/frameDefaults.js'
import { useSalesUsers } from '../hooks/useSalesUsers.js'

function monthKey(isoDate) {
  const d = new Date(isoDate)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key) {
  if (key === 'all') return 'Tất cả các tháng'
  const [year, month] = key.split('-')
  return `Tháng ${Number(month)}/${year}`
}

const COMPONENT_LABELS = {
  khung: 'Khung',
  tranhIn: 'In tranh',
  micaKinh: 'Mica/Kính',
  van: 'Ván lót',
  giayBo: 'Giấy bo',
  satXi: 'Sắt xi',
  son: 'Sơn',
  dongGoi: 'Đóng gói',
}

function selectedComponentTags(item) {
  // Nếu là chế độ Moebe, hiển thị chi tiết Kính và Ruột
  if (item.mode === 'moebe' && item.selections) {
    const labels = []
    if (item.selections.micaKinhId) labels.push(`Kính/Mica: ${item.selections.micaKinhId}`)
    if (item.selections.ruotMaterialId) labels.push(`Ruột: ${item.selections.ruotMaterialId}`)
    return labels
  }

  if (!item.toggles) return []
  return Object.entries(item.toggles)
    .filter(([, v]) => v)
    .map(([k]) => COMPONENT_LABELS[k])
    .filter(Boolean)
}

function ItemCostBreakdown({ item }) {
  const cb = item.costBreakdown
  if (!cb) return null
  const isStandard = item.mode === 'simple'
  const isNhom = isNhomType(item.selections?.khungType)
  const allRows = [...(cb.materialRows ?? []), ...(cb.laborRows ?? [])].filter((row) => {
    if (isStandard && row.label.startsWith('Sắt xi')) return false
    if (row.label.startsWith('Ke góc') && !isNhom) return false
    return true
  })

  return (
    <div className="mt-3 border border-amber/30 rounded-lg overflow-hidden">
      <div className="bg-blueprint text-paper px-3 py-1.5 font-mono text-xs uppercase tracking-widest">
        Bảng định mức giá thành (1 sản phẩm)
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-xs">
          <thead>
            <tr className="bg-blueprint/5 text-blueprint">
              <th className="text-left font-mono uppercase tracking-widest px-3 py-1.5">Khoản mục</th>
              <th className="text-left font-mono uppercase tracking-widest px-3 py-1.5">Đơn vị</th>
              <th className="text-right font-mono uppercase tracking-widest px-3 py-1.5">SL</th>
              <th className="text-right font-mono uppercase tracking-widest px-3 py-1.5">Đơn giá</th>
              <th className="text-right font-mono uppercase tracking-widest px-3 py-1.5">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((row, i) => (
              <tr key={i} className="border-t border-line">
                <td className="px-3 py-1.5 text-blueprint">{row.label}</td>
                <td className="px-3 py-1.5 text-blueprint/60">{row.unit}</td>
                <td className="px-3 py-1.5 text-right font-mono text-blueprint/70">
                  {row.qty.toFixed(row.qty % 1 === 0 ? 0 : 2)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-blueprint/70">
                  {formatVND(row.unitPrice)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono font-medium text-blueprint">
                  {formatVND(row.total)}
                </td>
              </tr>
            ))}
            <tr className="bg-amber/10 border-t-2 border-amber/40">
              <td colSpan={4} className="px-3 py-1.5 text-right font-medium text-blueprint">
                Tổng chi phí nguyên vật liệu trực tiếp
              </td>
              <td className="px-3 py-1.5 text-right font-mono font-bold text-blueprint">
                {formatVND(cb.nvlTotal)}
              </td>
            </tr>
            <tr className="bg-amber/10 border-t border-amber/20">
              <td colSpan={4} className="px-3 py-1.5 text-right font-medium text-blueprint">
                Tổng chi phí nhân công trực tiếp
              </td>
              <td className="px-3 py-1.5 text-right font-mono font-bold text-blueprint">
                {formatVND(cb.laborTotal)}
              </td>
            </tr>
            <tr className="bg-amber/10 border-t border-amber/20">
              <td colSpan={4} className="px-3 py-1.5 text-right font-medium text-blueprint">
                Chi phí sản xuất chung
              </td>
              <td className="px-3 py-1.5 text-right font-mono font-bold text-blueprint">
                {formatVND(cb.sxc)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="bg-blueprint px-3 py-2 flex items-center justify-between">
        <span className="text-paper/70 text-xs font-medium">GIÁ VỐN / SẢN PHẨM</span>
        <span className="font-mono text-lg font-bold text-amber">{formatVND(cb.grandTotal)}</span>
      </div>
    </div>
  )
}

export default function OrderHistory({ orders, onDelete, isAdmin, onUpdateStatus, currentUser, isSaleRole }) {
  const [expandedId, setExpandedId] = useState(null)
  const [expandedItemId, setExpandedItemId] = useState(null)
  // 🌟 Chỉ cần tải tên sale khi có quyền xem (admin/editor) — dùng để hiện "Người báo giá"
  const { nameById } = useSalesUsers()

  // 🌟 Nếu đang đăng nhập bằng role "sale": chỉ xem được các đơn do CHÍNH mình tạo,
  // không thấy đơn của sale khác hay khách vãng lai.
  const scopedOrders = useMemo(() => {
    if (isSaleRole && currentUser) {
      return orders.filter((o) => o.idUser === currentUser.id)
    }
    return orders
  }, [orders, isSaleRole, currentUser])

  const monthOptions = useMemo(() => {
    const keys = new Set(scopedOrders.map((o) => monthKey(o.createdAt)))
    return Array.from(keys).sort().reverse()
  }, [scopedOrders])

  const [selectedMonth, setSelectedMonth] = useState('all')

  const filteredOrders = useMemo(() => {
    if (selectedMonth === 'all') return scopedOrders
    return scopedOrders.filter((o) => monthKey(o.createdAt) === selectedMonth)
  }, [scopedOrders, selectedMonth])

  const monthProfit = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + o.profit, 0),
    [filteredOrders]
  )
  const monthRevenue = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + o.itemsTotal, 0),
    [filteredOrders]
  )

  const handleExport = () => {
    exportOrdersToExcel(filteredOrders, monthLabel(selectedMonth), isAdmin)
  }

  if (scopedOrders.length === 0) {
    return (
      <section className="bg-paper rounded-2xl border border-line p-10 text-center">
        <p className="text-blueprint/60 text-sm">
          Chưa có báo giá nào được lưu. Sau khi xuất báo giá cho khách hàng, đơn
          hàng sẽ xuất hiện ở đây.
        </p>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-2xl border border-line shadow-sm p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display font-semibold text-lg text-blueprint mb-1">
            Lịch sử báo giá
          </h2>
          <p className="text-sm text-blueprint/60">
            Lưu trữ đơn hàng hệ thống. {filteredOrders.length} đơn hàng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-paper border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber"
          >
            <option value="all">Tất cả các tháng</option>
            {monthOptions.map((key) => (
              <option key={key} value={key}>
                {monthLabel(key)}
              </option>
            ))}
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-sm font-medium bg-blueprint text-paper rounded-md px-3 py-2 hover:bg-blueprint-light transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1.5v7M7 8.5 4 5.5M7 8.5l3-3M2 11v1.5A.5.5 0 0 0 2.5 13h9a.5.5 0 0 0 .5-.5V11"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Tổng kết theo bộ lọc hiện tại */}
      <div className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-6`}>
        <div className="bg-paper rounded-lg p-4">
          <p className="text-xs text-blueprint/60 mb-1">Doanh thu</p>
          <p className="font-mono text-lg text-blueprint">{formatVND(monthRevenue)}</p>
        </div>
        {isAdmin && (
          <div className="bg-blueprint rounded-lg p-4">
            <p className="text-xs text-paper/60 mb-1">Tổng lợi nhuận</p>
            <p className="font-mono text-lg font-bold text-amber">{formatVND(monthProfit)}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filteredOrders.map((order) => {
          
          const isOpen = expandedId === order.id
          const isLowMargin = order.margin < 55
          return (
            <div key={order.id} className="border border-line rounded-lg overflow-hidden">
              <div className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-paper transition-colors">
                <button
                  onClick={() => setExpandedId(isOpen ? null : order.id)}
                  className="flex-1 min-w-0 text-left cursor-pointer"
                >
                  <p className="font-medium text-blueprint truncate">
                    {order.customerName || 'Khách lẻ'}
                  </p>
                  <p className="text-xs text-blueprint/50 font-mono">
                    {new Date(order.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).replace(',', ' -')} ·{' '}
                    {order.items.length} sản phẩm
                    {isAdmin && order.idUser != null && (
                      <> · Sale: {nameById[order.idUser] || `#${order.idUser}`}</>
                    )}
                  </p>
                </button>

                {/* Phần điều khiển trạng thái & mở rộng */}
                <div className="flex items-center gap-4 shrink-0">
                  {/* Dropdown trạng thái Đã chốt / Chưa chốt đồng bộ DB */}
                  <select
                    value={order.status === 'da_chot' ? 'da_chot' : 'chua_chot'}
                    onChange={(e) => {
                      const newStatus = e.target.value // 1️⃣ Khai báo biến trước
                      if (onUpdateStatus) {
                        onUpdateStatus(order.id, newStatus) // 2️⃣ Sử dụng biến sau
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md font-mono text-xs uppercase tracking-wider font-semibold cursor-pointer outline-none transition-colors ${
                      order.status === 'da_chot'
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    <option value="chua_chot">⏳ Chưa chốt</option>
                    <option value="da_chot">✅ Đã chốt</option>
                  </select>

                  <div 
                    onClick={() => setExpandedId(isOpen ? null : order.id)}
                    className="text-right cursor-pointer"
                  >
                    <p className="font-mono text-sm text-blueprint">
                      {formatVND(order.itemsTotal)}
                    </p>
                    {isAdmin && (
                      <p
                        className={`font-mono text-xs ${
                          isLowMargin ? 'text-red-600' : 'text-amber'
                        }`}
                      >
                        Biên {formatPercent(order.margin)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setExpandedId(isOpen ? null : order.id)}
                    className="text-blueprint/40 cursor-pointer p-1"
                  >
                    {isOpen ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-line px-4 py-4 bg-paper">
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="text-xs text-blueprint/50 uppercase tracking-widest">
                        <th className="text-left font-normal pb-2">Sản phẩm</th>
                        <th className="text-right font-normal pb-2">Kích thước</th>
                        <th className="text-right font-normal pb-2">SL</th>
                        <th className="text-right font-normal pb-2">Thành tiền</th>
                        {isAdmin && <th className="w-8" />}
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => {
                        const tags = selectedComponentTags(item)
                        const itemKey = `${order.id}:${item.id}`
                        const itemOpen = expandedItemId === itemKey
                        return (
                          <Fragment key={item.id}>
                            <tr className="border-t border-line/60">
                              <td className="py-2 text-blueprint align-top">
                                <p>{item.name}</p>
                                {tags.length > 0 && (
                                  <p className="text-xs text-blueprint/40 font-mono mt-0.5">
                                    {tags.join(' · ')}
                                  </p>
                                )}
                              </td>
                              <td className="py-2 text-right font-mono text-blueprint/70 align-top">
                                {item.width}×{item.height} cm
                              </td>
                              <td className="py-2 text-right font-mono text-blueprint/70 align-top">
                                {item.quantity}
                              </td>
                              <td className="py-2 text-right font-mono text-blueprint/70 align-top">
                                {formatVND(item.lineTotal)}
                              </td>
                              {isAdmin && (
                                <td className="py-2 text-center align-top">
                                  <button
                                    onClick={() => setExpandedItemId(itemOpen ? null : itemKey)}
                                    aria-label="Xem chi tiết giá vốn"
                                    className="text-blueprint/40 hover:text-amber transition-colors cursor-pointer"
                                  >
                                    {itemOpen ? '▲' : '▼'}
                                  </button>
                                </td>
                              )}
                            </tr>
                            {isAdmin && itemOpen && (
                              <tr>
                                <td colSpan={5} className="pb-3">
                                  <ItemCostBreakdown item={item} />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>

                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
                    {order.itemsSubtotal != null && (
                      <div>
                        <dt className="text-xs text-blueprint/50">Tạm tính</dt>
                        <dd className="font-mono text-blueprint">
                          {formatVND(order.itemsSubtotal)}
                        </dd>
                      </div>
                    )}
                    {order.discountPercent > 0 && (
                      <div>
                        <dt className="text-xs text-blueprint/50">Chiết khấu</dt>
                        <dd className="font-mono text-amber">-{order.discountPercent}%</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-xs text-blueprint/50">Tổng tiền</dt>
                      <dd className="font-mono text-blueprint">{formatVND(order.itemsTotal)}</dd>
                    </div>
                    {isAdmin && (
                      <>
                        <div>
                          <dt className="text-xs text-blueprint/50">Giá vốn</dt>
                          <dd className="font-mono text-blueprint">{formatVND(order.itemsCost)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-blueprint/50">Lợi nhuận</dt>
                          <dd
                            className={`font-mono font-medium ${
                              isLowMargin ? 'text-red-600' : 'text-amber'
                            }`}
                          >
                            {formatVND(order.profit)}
                          </dd>
                        </div>
                      </>
                    )}
                  </dl>

                  <button
                    onClick={() => onDelete(order.id)}
                    className="text-xs text-red-600 hover:underline cursor-pointer"
                  >
                    Xoá đơn hàng này
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}