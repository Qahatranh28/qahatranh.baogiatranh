import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardTitle, StatBox, inputCls, Empty } from '../components/ui.jsx'
import { calcQuote } from '../lib/calc.js'
import { fmtMoney, fmtPct, fmtNum, monthKey, monthLabel } from '../lib/format.js'

export default function StatsPage({ quotes, perms }) {
  const [month, setMonth] = useState('all')
  const months = useMemo(() => ['all', ...[...new Set(quotes.map((q) => monthKey(q.createdAt)))].sort().reverse()], [quotes])
  const rows = useMemo(
    () => quotes.filter((q) => month === 'all' || monthKey(q.createdAt) === month).map((q) => ({ q, c: calcQuote(q) })),
    [quotes, month]
  )

  const s = useMemo(() => {
    const won = rows.filter((r) => r.q.status === 'won')
    const lost = rows.filter((r) => r.q.status === 'lost')
    const decided = won.length + lost.length
    const revenue = won.reduce((t, r) => t + r.c.grandTotal, 0)
    const wonNet = won.reduce((t, r) => t + r.c.afterDiscount, 0)
    const wonProfit = won.reduce((t, r) => t + r.c.profitAfter, 0)

    const bySale = {}
    rows.forEach(({ q, c }) => {
      const k = q.ownerName || '—'
      bySale[k] ||= { name: k, total: 0, won: 0, lost: 0, revenue: 0 }
      bySale[k].total++
      if (q.status === 'won') { bySale[k].won++; bySale[k].revenue += c.grandTotal }
      if (q.status === 'lost') bySale[k].lost++
    })

    const reasons = {}
    lost.forEach(({ q }) => { const r = q.lostReason.trim() || 'Không ghi lý do'; reasons[r] = (reasons[r] || 0) + 1 })

    const byMonth = {}
    quotes.filter((q) => q.status === 'won').forEach((q) => {
      const k = monthKey(q.createdAt)
      byMonth[k] = (byMonth[k] || 0) + calcQuote(q).grandTotal
    })
    const chart = Object.keys(byMonth).sort().slice(-12).map((k) => ({ month: k.slice(5) + '/' + k.slice(2, 4), revenue: byMonth[k] }))

    return {
      total: rows.length, pending: rows.length - decided, won: won.length, lost: lost.length,
      winRate: decided ? (won.length / decided) * 100 : 0,
      revenue, margin: wonNet > 0 ? (wonProfit / wonNet) * 100 : 0,
      sales: Object.values(bySale).sort((a, b) => b.revenue - a.revenue),
      reasons: Object.entries(reasons).sort((a, b) => b[1] - a[1]),
      chart,
    }
  }, [rows, quotes])

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <CardTitle sub={perms.seeAllQuotes ? 'Toàn bộ báo giá' : 'Chỉ báo giá của bạn'}>Thống kê</CardTitle>
          <select className={`${inputCls} !w-auto`} value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
        <div className={`grid grid-cols-2 ${perms.canSeeCost ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3`}>
          <StatBox label="Số báo giá" value={s.total} sub={`${s.pending} chờ duyệt`} />
          <StatBox label="Đã chốt / Thất bại" value={`${s.won} / ${s.lost}`} />
          <StatBox label="Tỷ lệ chốt" value={fmtPct(s.winRate, 1)} sub="chốt ÷ (chốt + thất bại)" />
          <StatBox label="Doanh số đã chốt" value={fmtMoney(s.revenue)} />
          {perms.canSeeCost && <StatBox label="Biên LN đơn đã chốt" value={fmtPct(s.margin, 1)} />}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardTitle>Doanh số đã chốt theo tháng</CardTitle>
          {s.chart.length === 0 ? <Empty>Chưa có đơn nào chốt.</Empty> : (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={s.chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={11} tickFormatter={(v) => (v >= 1e6 ? `${fmtNum(v / 1e6)}tr` : fmtNum(v))} width={48} />
                  <Tooltip formatter={(v) => fmtMoney(v)} />
                  <Bar dataKey="revenue" fill="#ff4f25" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card>
          <CardTitle>Lý do thất bại</CardTitle>
          {s.reasons.length === 0 ? <Empty>Chưa có đơn thất bại.</Empty> : (
            <ul className="space-y-2.5">
              {s.reasons.map(([r, n]) => (
                <li key={r}>
                  <div className="flex justify-between text-sm mb-1"><span>{r}</span><b>{n}</b></div>
                  <div className="h-2 rounded bg-[#eef0f3]"><div className="h-2 rounded bg-red-400" style={{ width: `${(n / s.lost) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {perms.seeAllQuotes && (
        <Card>
          <CardTitle>Theo sale phụ trách</CardTitle>
          {s.sales.length === 0 ? <Empty>Chưa có dữ liệu.</Empty> : (
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-[#4b5563] border-b border-[#e3e7ec] text-left">
                <th className="py-2 font-semibold">Sale</th><th className="font-semibold text-center">Báo giá</th>
                <th className="font-semibold text-center">Chốt</th><th className="font-semibold text-center">Thất bại</th>
                <th className="font-semibold text-right">Doanh số chốt</th></tr></thead>
              <tbody>
                {s.sales.map((r) => (
                  <tr key={r.name} className="border-b border-[#eef0f3]">
                    <td className="py-2 font-medium">{r.name}</td><td className="text-center">{r.total}</td>
                    <td className="text-center">{r.won}</td><td className="text-center">{r.lost}</td>
                    <td className="text-right font-semibold">{fmtMoney(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  )
}
