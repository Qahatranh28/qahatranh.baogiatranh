import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatVND, formatPercent } from '../utils/format.js'
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

function dayLabel(isoDate) {
  const d = new Date(isoDate)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

const BAR_COLORS = ['#b45309', '#1e3a5f', '#0f766e', '#7c3aed', '#be123c', '#4d7c0f', '#0369a1', '#a16207']

function ChartTooltip({ active, payload, label, moneyKeys = [] }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border border-line rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-blueprint mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}:{' '}
          {moneyKeys.includes(p.dataKey) ? formatVND(p.value) : formatPercent(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function SalesDashboard({ orders, canSeeCost, canSeeMargin = canSeeCost, currentUser, isSaleRole }) {
  // 🌟 TẤT CẢ hook được gọi vô điều kiện ở đầu component (tuân thủ Rules of Hooks) —
  // việc hiển thị chế độ admin hay sale chỉ quyết định ở phần JSX return bên dưới.
  const { nameById, loading: loadingUsers } = useSalesUsers()

  const availableMonths = useMemo(() => {
    const set = new Set(orders.map((o) => monthKey(o.createdAt || o.date)))
    return Array.from(set).sort().reverse()
  }, [orders])

  const [selectedMonth, setSelectedMonth] = useState(() => availableMonths[0] || 'all')

  const closedOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.status !== 'da_chot') return false
      if (selectedMonth === 'all') return true
      return monthKey(o.createdAt || o.date) === selectedMonth
    })
  }, [orders, selectedMonth])

  // ---- Dữ liệu riêng cho chế độ Sale (chỉ đơn của chính mình) ----
  const myOrders = useMemo(
    () => closedOrders.filter((o) => currentUser && o.idUser === currentUser.id),
    [closedOrders, currentUser]
  )
  const myTotalRevenue = useMemo(
    () => myOrders.reduce((sum, o) => sum + (o.itemsTotal || 0), 0),
    [myOrders]
  )
  const myByDay = useMemo(() => {
    const map = {}
    myOrders.forEach((o) => {
      const key = dayLabel(o.createdAt || o.date)
      map[key] = (map[key] || 0) + (o.itemsTotal || 0)
    })
    return Object.entries(map)
      .map(([day, revenue]) => ({ day, revenue }))
      .sort((a, b) => a.day.localeCompare(b.day))
  }, [myOrders])

  // ---- Dữ liệu riêng cho chế độ Admin/Editor (tổng hợp theo từng Sale) ----
  const bySale = useMemo(() => {
    const map = {}
    closedOrders.forEach((o) => {
      const key = o.idUser ?? 'none'
      if (!map[key]) {
        map[key] = {
          idUser: key,
          name: key === 'none' ? 'Không qua sale' : (nameById[key] || `User #${key}`),
          revenue: 0,
          cost: 0,
          count: 0,
        }
      }
      map[key].revenue += o.itemsTotal || 0
      map[key].cost += o.itemsCost || 0
      map[key].count += 1
    })
    return Object.values(map)
      .map((s) => ({
        ...s,
        profit: s.revenue - s.cost,
        margin: s.revenue > 0 ? ((s.revenue - s.cost) / s.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [closedOrders, nameById])

  const totals = useMemo(
    () =>
      bySale.reduce(
        (acc, s) => ({
          revenue: acc.revenue + s.revenue,
          cost: acc.cost + s.cost,
          count: acc.count + s.count,
        }),
        { revenue: 0, cost: 0, count: 0 }
      ),
    [bySale]
  )
  const totalMargin = totals.revenue > 0 ? ((totals.revenue - totals.cost) / totals.revenue) * 100 : 0

  const monthSelector = (
    <select
      value={selectedMonth}
      onChange={(e) => setSelectedMonth(e.target.value)}
      className="border border-line rounded px-3 py-2 text-sm outline-none focus:border-amber bg-white"
    >
      {availableMonths.length === 0 && <option value="all">Tất cả các tháng</option>}
      {availableMonths.map((m) => (
        <option key={m} value={m}>{monthLabel(m)}</option>
      ))}
    </select>
  )

  // ===================== CHẾ ĐỘ SALE =====================
  // Chỉ xem doanh số của chính mình, KHÔNG có giá vốn/lợi nhuận/biên lợi nhuận.
  if (!canSeeCost) {
    return (
      <div className="pb-10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <h2 className="font-display font-semibold text-lg text-blueprint">
            Dashboard doanh số của tôi
          </h2>
          {monthSelector}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-amber/30 shadow-sm p-6">
            <p className="text-xs text-blueprint-light mb-1">Doanh số đã chốt ({monthLabel(selectedMonth)})</p>
            <p className="font-mono text-2xl font-bold text-blueprint">{formatVND(myTotalRevenue)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-amber/30 shadow-sm p-6">
            <p className="text-xs text-blueprint-light mb-1">Số đơn đã chốt</p>
            <p className="font-mono text-2xl font-bold text-blueprint">{myOrders.length}</p>
          </div>
        </div>

        {myByDay.length > 0 ? (
          <div className="bg-white rounded-2xl border border-line shadow-sm p-6">
            <p className="text-sm font-medium text-blueprint mb-4">Doanh số theo ngày</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={myByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}tr`} />
                <Tooltip content={<ChartTooltip moneyKeys={['revenue']} />} />
                <Bar dataKey="revenue" name="Doanh số" fill="#b45309" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-blueprint-light">
            Chưa có đơn nào đã chốt trong {monthLabel(selectedMonth).toLowerCase()}.
          </p>
        )}
      </div>
    )
  }

  // ===================== CHẾ ĐỘ ADMIN/EDITOR =====================
  // Xem doanh số của TẤT CẢ sale. Riêng giá vốn/lợi nhuận/biên lợi nhuận CHỈ
  // hiện với role admin (canSeeMargin) — editor vẫn xem được doanh số theo
  // Sale nhưng không thấy giá vốn/lợi nhuận.
  return (
    <div className="pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h2 className="font-display font-semibold text-lg text-blueprint">
          Dashboard doanh số theo Sale
        </h2>
        {monthSelector}
      </div>

      <div className={`grid sm:grid-cols-2 ${canSeeMargin ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4 mb-6`}>
        <div className="bg-white rounded-2xl border border-amber/30 shadow-sm p-5">
          <p className="text-xs text-blueprint-light mb-1">Tổng doanh thu (đã chốt)</p>
          <p className="font-mono text-lg font-bold text-blueprint">{formatVND(totals.revenue)}</p>
        </div>
        {canSeeMargin && (
          <>
            <div className="bg-white rounded-2xl border border-amber/30 shadow-sm p-5">
              <p className="text-xs text-blueprint-light mb-1">Tổng giá vốn</p>
              <p className="font-mono text-lg font-bold text-blueprint">{formatVND(totals.cost)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-amber/30 shadow-sm p-5">
              <p className="text-xs text-blueprint-light mb-1">Lợi nhuận / Biên TB</p>
              <p className="font-mono text-lg font-bold text-blueprint">
                {formatVND(totals.revenue - totals.cost)}{' '}
                <span className="text-amber text-sm">({formatPercent(totalMargin)})</span>
              </p>
            </div>
          </>
        )}
        <div className="bg-white rounded-2xl border border-amber/30 shadow-sm p-5">
          <p className="text-xs text-blueprint-light mb-1">Số đơn đã chốt</p>
          <p className="font-mono text-lg font-bold text-blueprint">{totals.count}</p>
        </div>
      </div>

      {bySale.length > 0 ? (
        <>
          <div className={`grid ${canSeeMargin ? 'lg:grid-cols-2' : ''} gap-4 mb-6`}>
            <div className="bg-white rounded-2xl border border-line shadow-sm p-6">
              <p className="text-sm font-medium text-blueprint mb-4">Doanh thu theo Sale</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bySale}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}tr`} />
                  <Tooltip content={<ChartTooltip moneyKeys={['revenue']} />} />
                  <Bar dataKey="revenue" name="Doanh thu" radius={[4, 4, 0, 0]}>
                    {bySale.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {canSeeMargin && (
              <div className="bg-white rounded-2xl border border-line shadow-sm p-6">
                <p className="text-sm font-medium text-blueprint mb-4">Biên lợi nhuận trung bình theo Sale</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={bySale}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<ChartTooltip moneyKeys={[]} />} />
                    <Bar dataKey="margin" name="Biên LN" radius={[4, 4, 0, 0]}>
                      {bySale.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper text-left text-xs uppercase tracking-widest text-blueprint/60">
                  <th className="px-4 py-3">Sale</th>
                  <th className="px-4 py-3 text-right">Số đơn</th>
                  <th className="px-4 py-3 text-right">Doanh thu</th>
                  {canSeeMargin && (
                    <>
                      <th className="px-4 py-3 text-right">Giá vốn</th>
                      <th className="px-4 py-3 text-right">Lợi nhuận</th>
                      <th className="px-4 py-3 text-right">Biên LN</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {bySale.map((s) => (
                  <tr key={s.idUser} className="border-t border-line">
                    <td className="px-4 py-3 font-medium text-blueprint">{s.name}</td>
                    <td className="px-4 py-3 text-right font-mono">{s.count}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatVND(s.revenue)}</td>
                    {canSeeMargin && (
                      <>
                        <td className="px-4 py-3 text-right font-mono">{formatVND(s.cost)}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatVND(s.profit)}</td>
                        <td className="px-4 py-3 text-right font-mono text-amber font-medium">{formatPercent(s.margin)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-sm text-blueprint-light">
          {loadingUsers ? 'Đang tải dữ liệu...' : `Chưa có đơn nào đã chốt trong ${monthLabel(selectedMonth).toLowerCase()}.`}
        </p>
      )}
    </div>
  )
}