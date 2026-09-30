import { useMemo, useState } from 'react'
import { Card, CardTitle, Btn, StatBox, StatusBadge, inputCls, Empty } from '../components/ui.jsx'
import { buildCustomers, phoneDigits } from '../lib/customers.js'
import { calcQuote } from '../lib/calc.js'
import { fmtMoney, fmtPct, fmtDate } from '../lib/format.js'

export default function CustomersPage({ quotes, perms, onOpen, onClone, onNewForCustomer }) {
  const [search, setSearch] = useState('')
  const [selKey, setSelKey] = useState(null)
  const customers = useMemo(() => buildCustomers(quotes), [quotes])
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    const sd = phoneDigits(search)
    return customers.filter((c) => !s || c.name.toLowerCase().includes(s) || (sd && phoneDigits(c.phone).includes(sd)))
  }, [customers, search])
  const sel = customers.find((c) => c.key === selKey) || filtered[0] || null

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-4 items-start">
      <Card>
        <CardTitle sub="Tìm theo tên hoặc số điện thoại">Khách hàng</CardTitle>
        <input className={`${inputCls} mb-3`} placeholder="VD: Ngọc Lai hoặc 0909…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {filtered.length === 0 ? <Empty>Không có khách nào.</Empty> : (
          <ul className="max-h-[60vh] overflow-auto -mx-1">
            {filtered.map((c) => (
              <li key={c.key}>
                <button onClick={() => setSelKey(c.key)}
                  className={`w-full text-left px-2 py-2.5 rounded-lg border-b border-[#eef0f3] flex justify-between gap-2 ${sel?.key === c.key ? 'bg-[#fff1ed]' : 'hover:bg-[#f7f8fa]'}`}>
                  <span>
                    <span className="block font-semibold text-sm">{c.name || '(chưa có tên)'}</span>
                    <span className="block text-xs text-[#6b7280]">{c.phone || 'Chưa có SĐT'}</span>
                  </span>
                  <span className="text-xs text-[#6b7280] whitespace-nowrap">{c.total} BG · {c.won} chốt</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        {!sel ? <Empty>Chọn một khách hàng để xem lịch sử báo giá.</Empty> : (
          <>
            <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
              <div>
                <h2 className="font-bold text-lg">{sel.name || '(chưa có tên)'}</h2>
                <p className="text-xs text-[#6b7280]">{sel.phone ? sel.phone : 'Chưa có số điện thoại'} · Khách từ {fmtDate(sel.firstAt)}</p>
              </div>
              <Btn variant="primary" onClick={() => onNewForCustomer(sel)}>Tạo báo giá mới cho khách này</Btn>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <StatBox label="Số báo giá" value={sel.total} />
              <StatBox label="Đã chốt" value={sel.won} />
              <StatBox label="Thất bại" value={sel.lost} />
              <StatBox label="Doanh số đã chốt" value={fmtMoney(sel.revenueWon)} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-xs text-[#4b5563] border-b border-[#e3e7ec] text-left">
                    <th className="py-2 font-semibold">Số báo giá</th><th className="font-semibold">Ngày</th>
                    <th className="font-semibold">Sale phụ trách</th><th className="font-semibold text-center">Số SP</th>
                    <th className="font-semibold text-right">Tổng thanh toán</th>
                    {perms.canSeeCost && <th className="font-semibold text-right px-2">Biên sau CK</th>}
                    <th className="font-semibold">Trạng thái</th><th />
                  </tr>
                </thead>
                <tbody>
                  {sel.quotes.map((x) => {
                    const c = calcQuote(x)
                    return (
                      <tr key={x.id} className="border-b border-[#eef0f3]">
                        <td className="py-2.5 font-bold">{x.code}</td>
                        <td>{fmtDate(x.createdAt)}</td>
                        <td>{x.ownerName || '—'}</td>
                        <td className="text-center">{c.itemCount}</td>
                        <td className="text-right">{fmtMoney(c.grandTotal)}</td>
                        {perms.canSeeCost && <td className="text-right px-2">{c.hasCost ? fmtPct(c.marginAfter) : '—'}</td>}
                        <td><StatusBadge status={x.status} />{x.status === 'lost' && x.lostReason.trim() && <div className="text-xs text-[#6b7280]">{x.lostReason}</div>}</td>
                        <td className="text-right whitespace-nowrap"><Btn variant="sm" onClick={() => onOpen(x)}>Mở</Btn> <Btn variant="sm" onClick={() => onClone(x)}>Nhân bản</Btn></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
