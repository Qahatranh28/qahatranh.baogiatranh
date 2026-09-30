import { useMemo, useState } from 'react'
import { Card, Btn, StatusBadge, inputCls, Empty } from '../components/ui.jsx'
import { calcQuote } from '../lib/calc.js'
import { fmtMoney, fmtPct, fmtDate, monthKey, monthLabel } from '../lib/format.js'
import { STATUS } from '../lib/defaults.js'

export default function QuotesPage({ quotes, loading, error, perms, onOpen, onNew, onClone, onRefresh }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [month, setMonth] = useState('all')

  const months = useMemo(() => ['all', ...[...new Set(quotes.map((x) => monthKey(x.createdAt)))].sort().reverse()], [quotes])
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return quotes
      .filter((x) => (status === 'all' || x.status === status) && (month === 'all' || monthKey(x.createdAt) === month))
      .filter((x) => !s || [x.code, x.customerName, x.customerPhone, x.ownerName].some((v) => String(v || '').toLowerCase().includes(s)))
      .map((x) => ({ q: x, c: calcQuote(x) }))
  }, [quotes, q, status, month])

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="font-bold text-[15px]">Danh sách báo giá</h2>
          <p className="text-xs text-[#6b7280]">{perms.seeAllQuotes ? 'Tất cả báo giá' : 'Báo giá của bạn'} · {rows.length} kết quả</p>
        </div>
        <div className="flex gap-2">
          <Btn onClick={onRefresh}>Làm mới</Btn>
          <Btn variant="primary" onClick={onNew}>+ Báo giá mới</Btn>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-2 mb-4">
        <input className={inputCls} placeholder="Tìm mã, tên khách, SĐT, sale…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Mọi trạng thái</option>
          {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.short}</option>)}
        </select>
        <select className={inputCls} value={month} onChange={(e) => setMonth(e.target.value)}>
          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>

      {error && <div className="text-sm bg-red-50 border border-red-100 text-red-700 rounded-lg p-3 mb-3">{error}</div>}
      {loading ? <Empty>Đang tải…</Empty> : rows.length === 0 ? <Empty>Chưa có báo giá nào.</Empty> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-xs text-[#4b5563] border-b border-[#e3e7ec] text-left">
                <th className="py-2 font-semibold">Số báo giá</th>
                <th className="font-semibold">Ngày</th>
                <th className="font-semibold">Khách hàng</th>
                <th className="font-semibold">Sale phụ trách</th>
                <th className="font-semibold text-center">Số SP</th>
                <th className="font-semibold text-right">Tổng thanh toán</th>
                {perms.canSeeCost && <th className="font-semibold text-right px-2">Biên sau Chiết khấu</th>}
                <th className="font-semibold">Trạng thái</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ q: x, c }) => (
                <tr key={x.id} className="border-b border-[#eef0f3] hover:bg-[#fafbfc]">
                  <td className="py-2.5 font-bold">{x.code}</td>
                  <td>{fmtDate(x.createdAt)}</td>
                  <td>{x.customerName || <span className="text-[#9ca3af]">—</span>}{x.customerPhone && <div className="text-xs text-[#6b7280]">{x.customerPhone}</div>}</td>
                  <td>{x.ownerName || '—'}</td>
                  <td className="text-center">{c.itemCount}</td>
                  <td className="text-right font-medium">{fmtMoney(c.grandTotal)}</td>
                  {perms.canSeeCost && <td className="text-right px-2">{c.hasCost ? fmtPct(c.marginAfter) : '—'}</td>}
                  <td>
                    <StatusBadge status={x.status} />
                    {x.status === 'lost' && x.lostReason.trim() && <div className="text-xs text-[#6b7280] mt-0.5">{x.lostReason}</div>}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <Btn variant="sm" onClick={() => onOpen(x)}>Mở</Btn>{' '}
                    <Btn variant="sm" onClick={() => onClone(x)}>Nhân bản</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
