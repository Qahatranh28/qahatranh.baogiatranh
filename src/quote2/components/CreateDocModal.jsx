import { useMemo, useState } from 'react'
import { Modal, Btn, StatusBadge, inputCls, Empty } from './ui.jsx'
import { calcQuote } from '../lib/calc.js'
import { fmtMoney, fmtDate } from '../lib/format.js'

// Chọn một báo giá để tạo "đơn phiếu" (1 phiếu báo giá + 1 phiếu giao hàng). Báo giá đã có đơn thì mở đơn đó, không tạo trùng.
export default function CreateDocModal({ quotes, orders, onPick, onClose, busy }) {
  const [q, setQ] = useState('')
  const orderOf = useMemo(() => new Map(orders.filter((o) => o.quoteId).map((o) => [o.quoteId, o])), [orders])
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return quotes
      .filter((x) => !s || [x.code, x.customerName, x.customerPhone].some((v) => String(v || '').toLowerCase().includes(s)))
      .slice(0, 40)
  }, [quotes, q])
  return (
    <Modal wide title="Tạo đơn phiếu từ báo giá" onClose={onClose}>
      <p className="text-xs text-[#6b7280] mb-3">Mỗi báo giá chỉ có <b>1 phiếu báo giá</b> và <b>1 phiếu giao hàng</b> (tạo cùng lúc). Báo giá đã có phiếu sẽ được mở lại.</p>
      <input autoFocus className={`${inputCls} mb-3`} placeholder="Tìm mã báo giá, tên khách, SĐT…" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.length === 0 ? <Empty>Không có báo giá phù hợp.</Empty> : (
        <ul className="divide-y divide-[#eef0f3] max-h-[50vh] overflow-auto">
          {list.map((x) => {
            const has = orderOf.has(x.id)
            return (
              <li key={x.id} className="py-2.5 flex items-center gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm">{x.code} <span className="font-normal text-[#6b7280]">· {fmtDate(x.createdAt)}</span></p>
                  <p className="text-xs text-[#6b7280] truncate">{x.customerName || '(chưa có tên khách)'} · {fmtMoney(calcQuote(x).grandTotal)}</p>
                </div>
                <StatusBadge status={x.status} />
                <Btn variant={has ? 'sm' : 'primary'} className={has ? '' : '!py-1 !px-3 !text-xs'} disabled={busy} onClick={() => onPick(x)}>{has ? 'Mở phiếu' : 'Tạo phiếu'}</Btn>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
