import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts'
import { calcQuote } from '../lib/calc.js'
import { fmtMoney, fmtPct, fmtNum, monthKey, monthLabel } from '../lib/format.js'
import { LOST_REASONS } from '../lib/defaults.js'

/* ---------- Nhóm phân tích ---------- */
// Mức chiết khấu: 0–<5, 5–<10, 10–15 (gồm 15), >15
const DISC = [
  { label: '0 – <5%', test: (d) => d < 5 },
  { label: '5 – <10%', test: (d) => d >= 5 && d < 10 },
  { label: '10 – 15%', test: (d) => d >= 10 && d <= 15 },
  { label: '>15%', test: (d) => d > 15 },
]
// Giá trị báo giá TRƯỚC chiết khấu
const VAL = [
  { label: 'Dưới 1 triệu', test: (v) => v < 1e6 },
  { label: '1 – <3 triệu', test: (v) => v >= 1e6 && v < 3e6 },
  { label: '3 – <5 triệu', test: (v) => v >= 3e6 && v < 5e6 },
  { label: '5 – <10 triệu', test: (v) => v >= 5e6 && v < 10e6 },
  { label: 'Từ 10 triệu', test: (v) => v >= 10e6 },
]

const short = (v) => {
  v = Number(v) || 0
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace('.', ',')} tỷ`
  if (v >= 1e6) return `${Math.round(v / 1e6)}tr`
  if (v >= 1e3) return `${Math.round(v / 1e3)}k`
  return String(Math.round(v))
}

const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const lastMonths = (endKey, n) => {
  const [y, m] = endKey.split('-').map(Number)
  return Array.from({ length: n }, (_, i) => keyOf(new Date(y, m - 1 - (n - 1 - i), 1)))
}

/* ---------- Icon (cam) ---------- */
const I = ({ children, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)
const Icons = {
  doc: <I><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v5h4M10 13h5M10 17h5" /></I>,
  check: <I><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16 10" /></I>,
  percent: <I><path d="M19 5 5 19" /><circle cx="7" cy="7" r="2.2" /><circle cx="17" cy="17" r="2.2" /></I>,
  bars: <I><path d="M5 20V11M12 20V5M19 20v-7" /></I>,
  pie: <I><path d="M12 3v9h9" /><path d="M20.5 15A9 9 0 1 1 9 3.5" /></I>,
  grid: <I><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></I>,
  users: <I><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.4 2.7-5.5 6-5.5s6 2.1 6 5.5" /><path d="M16 5.5a3 3 0 0 1 0 5.6M18 14.8c2 .6 3 2.2 3 5.2" /></I>,
  cal: <I size={18}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></I>,
  person: <I size={18}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.6 3-5.5 7-5.5s7 1.9 7 5.5" /></I>,
  trophy: <I size={16}><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 20h8M10 17h4" /></I>,
  info: <I size={16}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></I>,
}

/* ---------- Khối giao diện ---------- */
function Section({ icon, title, sub, right, children, className = '' }) {
  return (
    <section className={`bg-white border border-[#e8ebef] rounded-2xl px-6 py-5 ${className}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-start gap-3">
          <span className="text-[#ff4f25] mt-0.5">{icon}</span>
          <div>
            <h2 className="text-lg font-bold text-[#1a1f2c] leading-tight">{title}</h2>
            {sub && <p className="text-[13px] text-[#6b7280] mt-0.5">{sub}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function Kpi({ icon, label, children, sub }) {
  return (
    <div className="bg-[#f6f7f9] rounded-xl px-4 py-4 flex items-center gap-3 min-w-0">
      <span className="w-11 h-11 rounded-full bg-[#ffece6] text-[#ff4f25] flex items-center justify-center shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[12.5px] text-[#6b7280]">{label}</p>
        <p className="text-[26px] font-extrabold leading-tight text-[#1a1f2c] truncate">{children}</p>
        {sub && <p className="text-[12px] text-[#6b7280]">{sub}</p>}
      </div>
    </div>
  )
}

function Pick({ icon, value, onChange, children }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="absolute left-3 text-[#4b5563] pointer-events-none">{icon}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none border border-[#dfe3e8] rounded-xl bg-white pl-10 pr-9 py-2.5 text-sm font-medium text-[#1a1f2c] outline-none focus:border-[#ff4f25] cursor-pointer min-w-[170px]">
        {children}
      </select>
      <svg className="absolute right-3 pointer-events-none text-[#4b5563]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
    </label>
  )
}

const lerp = (a, b, t) => Math.round(a + (b - a) * t)
const heatColor = (t) => `rgb(${lerp(236, 70, t)}, ${lerp(247, 168, t)}, ${lerp(238, 88, t)})`

/* ---------- Trang ---------- */
export default function StatsPage({ quotes, perms }) {
  const curKey = keyOf(new Date())
  const [monthSel, setMonthSel] = useState(null)
  const [sale, setSale] = useState('all')

  const months = useMemo(() => {
    const set = new Set(quotes.map((q) => monthKey(q.createdAt)))
    set.add(curKey)
    return ['all', ...[...set].sort().reverse()]
  }, [quotes, curKey])
  const hasCur = quotes.some((q) => monthKey(q.createdAt) === curKey)
  const month = monthSel ?? (hasCur ? curKey : 'all')

  const saleOptions = useMemo(() => {
    const m = new Map()
    quotes.forEach((q) => { if (q.ownerId) m.set(String(q.ownerId), q.ownerName || q.ownerId) })
    return [...m.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'vi'))
  }, [quotes])

  const scoped = useMemo(() => quotes.filter((q) => sale === 'all' || String(q.ownerId) === sale), [quotes, sale])
  const rows = useMemo(
    () => scoped.filter((q) => month === 'all' || monthKey(q.createdAt) === month).map((q) => ({ q, c: calcQuote(q) })),
    [scoped, month]
  )

  const s = useMemo(() => {
    const won = rows.filter((r) => r.q.status === 'won')
    const lost = rows.filter((r) => r.q.status === 'lost')
    const decided = won.length + lost.length
    const wonNet = won.reduce((t, r) => t + r.c.afterDiscount, 0)
    const wonProfit = won.reduce((t, r) => t + r.c.profitAfter, 0)

    // Tỷ lệ chốt theo mức chiết khấu
    const disc = DISC.map((b) => {
      const inB = rows.filter((r) => (r.q.status === 'won' || r.q.status === 'lost') && b.test(r.c.discountPercent))
      const w = inB.filter((r) => r.q.status === 'won').length
      return { label: b.label, won: w, decided: inB.length, rate: inB.length ? (w / inB.length) * 100 : 0 }
    })
    const best = disc.filter((d) => d.decided > 0).sort((a, b) => b.rate - a.rate || b.decided - a.decided)[0]

    // Số đơn chốt theo giá trị báo giá x chiết khấu
    const heat = VAL.map((v) => DISC.map((d) => won.filter((r) => v.test(r.c.subtotal) && d.test(r.c.discountPercent)).length))
    const heatMax = Math.max(0, ...heat.flat())

    // Doanh số đã chốt theo tháng (6 tháng gần nhất tới tháng đang chọn)
    const byMonth = {}
    scoped.filter((q) => q.status === 'won').forEach((q) => {
      const k = monthKey(q.createdAt)
      byMonth[k] = (byMonth[k] || 0) + calcQuote(q).grandTotal
    })
    const chart = lastMonths(month === 'all' ? curKey : month, 6).map((k) => ({ month: `${k.slice(5)}/${k.slice(0, 4)}`, revenue: byMonth[k] || 0 }))

    // Lý do thất bại (lý do tự gõ gom vào "Khác")
    const rs = {}
    const customs = new Set()
    lost.forEach(({ q }) => {
      const r = q.lostReason.trim()
      const key = LOST_REASONS.includes(r) ? r : 'Khác'
      if (key === 'Khác' && r) customs.add(r)
      rs[key] = (rs[key] || 0) + 1
    })
    const reasons = Object.entries(rs).sort((a, b) => (a[0] === 'Khác') - (b[0] === 'Khác') || b[1] - a[1])

    // Theo sale
    const by = {}
    rows.forEach(({ q, c }) => {
      const k = q.ownerName || '—'
      by[k] ||= { name: k, total: 0, won: 0, lost: 0, revenue: 0 }
      by[k].total++
      if (q.status === 'won') { by[k].won++; by[k].revenue += c.grandTotal }
      if (q.status === 'lost') by[k].lost++
    })

    return {
      total: rows.length, pending: rows.length - decided, won: won.length, lost: lost.length,
      winRate: decided ? (won.length / decided) * 100 : 0,
      revenue: won.reduce((t, r) => t + r.c.grandTotal, 0),
      margin: wonNet > 0 ? (wonProfit / wonNet) * 100 : 0,
      disc, best, heat, heatMax, chart, reasons, customs: [...customs],
      sales: Object.values(by).sort((a, b) => b.revenue - a.revenue),
    }
  }, [rows, scoped, month, curKey])

  const lostTotal = s.reasons.reduce((t, [, n]) => t + n, 0)
  const maxReason = Math.max(1, ...s.reasons.map(([, n]) => n))

  return (
    <div className="space-y-5">
      {/* Đầu trang + bộ lọc + KPI */}
      <section className="bg-white border border-[#e8ebef] rounded-2xl px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#1a1f2c] leading-tight">Thống kê</h1>
            <p className="text-[13px] text-[#6b7280]">
              Tổng quan hiệu quả báo giá{!perms.seeAllQuotes && ' của bạn'}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Pick icon={Icons.cal} value={month} onChange={setMonthSel}>
              {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </Pick>
            {perms.seeAllQuotes && (
              <Pick icon={Icons.person} value={sale} onChange={setSale}>
                <option value="all">Tất cả sale</option>
                {saleOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </Pick>
            )}
          </div>
        </div>

        <div className={`grid grid-cols-2 gap-3 mt-5 ${perms.canSeeCost ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          <Kpi icon={Icons.doc} label="Số báo giá" sub={`${fmtNum(s.pending)} chờ duyệt`}>{fmtNum(s.total)}</Kpi>
          <Kpi icon={Icons.check} label="Đã chốt / Thất bại">{fmtNum(s.won)} / <span className="text-[#ff4f25]">{fmtNum(s.lost)}</span></Kpi>
          <Kpi icon={Icons.percent} label="Tỷ lệ chốt">{fmtPct(s.winRate, 1)}</Kpi>
          <Kpi icon={Icons.bars} label="Doanh số đã chốt"><span className="text-[22px]">{fmtMoney(s.revenue)}</span></Kpi>
          {perms.canSeeCost && <Kpi icon={Icons.pie} label="Biên LN đơn đã chốt">{fmtPct(s.margin, 1)}</Kpi>}
        </div>
        <p className="flex items-center gap-2 text-[12.5px] text-[#6b7280] mt-4">
          <span className="text-[#9ca3af]">{Icons.info}</span>
          {fmtNum(s.pending)} chờ duyệt <span>•</span> Tỷ lệ chốt = Chốt / (Chốt + Thất bại)
        </p>
      </section>

      {/* Tỷ lệ chốt theo chiết khấu */}
      <Section
        icon={Icons.bars}
        title="Tỷ lệ chốt theo chiết khấu"
        sub="Tỷ lệ và số lượng chốt theo từng mức chiết khấu"
        right={s.best && (
          <span className="inline-flex items-center gap-2 bg-[#fff0eb] text-[#e8431c] text-[13px] font-semibold rounded-lg px-3.5 py-2">
            {Icons.trophy} Cao nhất: {s.best.label.replace(/ – /, '–')} <span>•</span> {fmtNum(s.best.rate)}%
          </span>
        )}
      >
        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div className="grid grid-cols-[120px_1fr_150px] text-[12.5px] text-[#4b5563] pb-2.5 border-b border-[#eceef1]">
              <span>Mức chiết khấu</span><span>Tỷ lệ chốt</span><span>Chốt / Đã có kết quả</span>
            </div>
            {s.disc.map((d) => {
              const isBest = s.best && d.label === s.best.label
              return (
                <div key={d.label} className="grid grid-cols-[120px_1fr_150px] items-center py-3 border-b border-[#f1f2f4] last:border-0 text-[14px]">
                  <span>{d.label}</span>
                  <div className="pr-6">
                    <div className="relative max-w-[340px] h-[22px] rounded bg-[#eef0f3] overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${d.rate}%`, background: isBest ? '#ff4f25' : '#ff9a7d' }} />
                      <span className="absolute top-0 h-full flex items-center text-[13px] font-semibold text-[#374151]" style={{ left: `calc(${d.rate}% + 8px)` }}>
                        {d.decided ? `${fmtNum(d.rate)}%` : '—'}
                      </span>
                    </div>
                  </div>
                  <span>{fmtNum(d.won)} / {fmtNum(d.decided)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </Section>

      {/* Heatmap */}
      <Section
        icon={Icons.grid}
        title="Số lượng đơn chốt theo giá trị báo giá & chiết khấu"
        sub="Số đơn đã chốt theo từng nhóm giá trị báo giá và mức chiết khấu"
      >
        <div className="overflow-x-auto">
          <div className="min-w-[560px] grid grid-cols-[1.3fr_repeat(4,1fr)] gap-[2px] text-[13.5px]">
            <div className="bg-[#f3f4f6] px-4 py-2.5 font-semibold">Giá trị báo giá</div>
            {DISC.map((d) => <div key={d.label} className="bg-[#f3f4f6] px-2 py-2.5 text-center font-semibold">{d.label}</div>)}
            {VAL.map((v, i) => (
              <div key={v.label} className="contents">
                <div className="px-4 py-3 font-semibold bg-white border-b border-[#f1f2f4]">{v.label}</div>
                {s.heat[i].map((n, j) => {
                  const t = s.heatMax ? n / s.heatMax : 0
                  return (
                    <div key={j} className="px-2 py-3 text-center" style={{ background: heatColor(t), color: t > 0.78 ? '#fff' : '#1f2937' }}>
                      {fmtNum(n)} đơn
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap mt-4 text-[12.5px] text-[#6b7280]">
          <span>Giá trị báo giá trước chiết khấu <span className="mx-1">•</span> Chỉ tính <b className="text-[#4b5563]">đơn đã chốt</b></span>
          <span className="inline-flex items-center gap-2">
            Ít đơn
            <span className="inline-flex gap-[2px]">{[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => <i key={t} className="w-7 h-4 block" style={{ background: heatColor(t) }} />)}</span>
            Nhiều đơn
          </span>
        </div>
      </Section>

      {/* Doanh số theo tháng + Lý do thất bại */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Section icon={Icons.bars} title="Doanh số đã chốt theo tháng" sub="Doanh số các đơn báo giá đã chốt (6 tháng gần nhất)">
          <div style={{ width: '100%', height: 270 }}>
            <ResponsiveContainer>
              <BarChart data={s.chart} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={{ stroke: '#d1d5db' }} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={short} width={46} domain={[0, 'auto']} />
                <Tooltip formatter={(v) => fmtMoney(v)} cursor={{ fill: 'rgba(255,79,37,.06)' }} />
                <Bar dataKey="revenue" fill="#ff5a2c" radius={[4, 4, 0, 0]} maxBarSize={56}>
                  <LabelList dataKey="revenue" position="top" formatter={(v) => (v ? short(v) : '')} fontSize={12} fill="#374151" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section icon={Icons.pie} title="Lý do thất bại" sub="Các lý do khách không chốt báo giá">
          {s.reasons.length === 0 ? <p className="text-sm text-[#6b7280] py-10 text-center">Chưa có đơn thất bại.</p> : (
            <ul className="space-y-3.5 pt-1">
              {s.reasons.map(([r, n]) => (
                <li key={r} className="grid grid-cols-[190px_1fr_92px] items-center gap-3 text-[13.5px]" title={r === 'Khác' ? s.customs.slice(0, 6).join(' • ') : undefined}>
                  <span>{r}</span>
                  <div className="h-[18px] rounded bg-[#eef0f3] overflow-hidden"><div className="h-full rounded bg-[#ff5a2c]" style={{ width: `${(n / maxReason) * 100}%` }} /></div>
                  <span className="text-right whitespace-nowrap">{fmtNum(n)} ({fmtPct((n / lostTotal) * 100, 1)})</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Theo sale */}
      {perms.seeAllQuotes && (
        <Section icon={Icons.users} title="Theo sale phụ trách" sub="Hiệu quả báo giá theo từng nhân viên sale">
          {s.sales.length === 0 ? <p className="text-sm text-[#6b7280] py-6 text-center">Chưa có dữ liệu.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px] min-w-[560px]">
                <thead>
                  <tr className="text-[12.5px] text-[#4b5563] border-b border-[#e3e7ec]">
                    <th className="py-2 text-left font-semibold">Sale</th>
                    <th className="text-right font-semibold">Số báo giá</th>
                    <th className="text-right font-semibold">Chốt</th>
                    <th className="text-right font-semibold">Thất bại</th>
                    <th className="text-right font-semibold">Tỷ lệ chốt</th>
                    <th className="text-right font-semibold">Doanh số đã chốt</th>
                  </tr>
                </thead>
                <tbody>
                  {s.sales.map((r) => (
                    <tr key={r.name} className="border-b border-[#f1f2f4] last:border-0">
                      <td className="py-2.5">{r.name}</td>
                      <td className="text-right">{fmtNum(r.total)}</td>
                      <td className="text-right">{fmtNum(r.won)}</td>
                      <td className="text-right">{fmtNum(r.lost)}</td>
                      <td className="text-right">{r.won + r.lost ? fmtPct((r.won / (r.won + r.lost)) * 100, 1) : '—'}</td>
                      <td className="text-right font-bold">{fmtMoney(r.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}
    </div>
  )
}
