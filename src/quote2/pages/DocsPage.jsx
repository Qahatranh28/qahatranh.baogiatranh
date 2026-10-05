import { useMemo, useState } from 'react'
import { Card, Btn, inputCls, Empty } from '../components/ui.jsx'
import CreateDocModal from '../components/CreateDocModal.jsx'
import { DOC_TYPES } from '../lib/docs.js'
import { fmtMoney, fmtDate } from '../lib/format.js'

const TypeBadge = ({ type }) => (
  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${DOC_TYPES[type]?.cls || ''}`}>{DOC_TYPES[type]?.label || type}</span>
)

export default function DocsPage({ docs, loading, error, perms, quotes, onOpen, onPreview, onDelete, onCreate, onOpenQuote, onRefresh }) {
  const [type, setType] = useState('all')
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return docs
      .filter((d) => type === 'all' || d.type === type)
      .filter((d) => !s || [d.code, d.quoteCode, d.customerName, d.ownerName].some((v) => String(v || '').toLowerCase().includes(s)))
  }, [docs, type, q])
  const count = (t) => docs.filter((d) => t === 'all' || d.type === t).length

  const pick = async (quote, t) => {
    setBusy(true)
    await onCreate(quote, t)
    setBusy(false)
    setCreating(false)
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="font-bold text-[15px]">Phiếu báo giá & phiếu giao hàng</h2>
          <p className="text-xs text-[#6b7280]">{perms.seeAllQuotes ? 'Tất cả phiếu' : 'Phiếu của bạn'} · {rows.length} kết quả. Phiếu được tạo từ báo giá; mở phiếu để sửa mọi thông tin.</p>
        </div>
        <div className="flex gap-2">
          <Btn onClick={onRefresh}>Làm mới</Btn>
          <Btn variant="primary" onClick={() => setCreating(true)}>+ Tạo phiếu từ báo giá</Btn>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        <div className="inline-flex border border-[#dfe3e8] rounded-lg overflow-hidden">
          {[['all', 'Tất cả'], ['quote', 'Phiếu báo giá'], ['delivery', 'Phiếu giao hàng']].map(([k, l]) => (
            <button key={k} onClick={() => setType(k)}
              className={`px-3 py-2 text-sm font-medium border-r last:border-r-0 border-[#dfe3e8] ${type === k ? 'bg-[#1a1f2c] text-white' : 'bg-white hover:bg-[#f3f4f6]'}`}>
              {l} <span className="opacity-60">({count(k)})</span>
            </button>
          ))}
        </div>
        <input className={`${inputCls} !w-auto flex-1 min-w-[220px]`} placeholder="Tìm số phiếu, mã báo giá, tên khách, người tạo…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {error && <div className="text-sm bg-red-50 border border-red-100 text-red-700 rounded-lg p-3 mb-3">{error}</div>}
      {loading ? <Empty>Đang tải…</Empty> : rows.length === 0 ? <Empty>Chưa có phiếu nào. Bấm «+ Tạo phiếu từ báo giá» hoặc dùng nút «Tạo phiếu» trong màn hình báo giá.</Empty> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-xs text-[#4b5563] border-b border-[#e3e7ec] text-left">
                <th className="py-2 font-semibold">Loại</th>
                <th className="font-semibold">Số phiếu</th>
                <th className="font-semibold">Khách hàng</th>
                <th className="font-semibold">Báo giá gốc</th>
                <th className="font-semibold">Ngày tạo</th>
                <th className="font-semibold text-right">Giá trị / Thu hộ</th>
                <th className="font-semibold pl-4">Người tạo</th>
                <th className="font-semibold">Sửa lần cuối</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-[#eef0f3] hover:bg-[#fafbfc]">
                  <td className="py-2.5"><TypeBadge type={d.type} /></td>
                  <td className="font-bold">{d.code || '—'}</td>
                  <td>{d.customerName || <span className="text-[#9ca3af]">—</span>}</td>
                  <td>
                    {d.quoteId
                      ? <button className="text-[#ff4f25] hover:underline" onClick={() => onOpenQuote(d.quoteId)}>{d.quoteCode}</button>
                      : <span className="text-[#6b7280]">{d.quoteCode || '—'}</span>}
                  </td>
                  <td>{fmtDate(d.createdAt)}</td>
                  <td className="text-right font-medium">{d.amount > 0 ? fmtMoney(d.amount) : '—'}</td>
                  <td className="pl-4">{d.ownerName || '—'}</td>
                  <td className="text-xs text-[#6b7280]">{fmtDate(d.updatedAt)}</td>
                  <td className="text-right whitespace-nowrap">
                    <Btn variant="sm" onClick={() => onOpen(d)}>Mở / Sửa</Btn>{' '}
                    <Btn variant="sm" onClick={() => onPreview(d)}>Xem trước</Btn>
                    {perms.canDeleteQuote && <>{' '}<Btn variant="sm" className="!text-red-600" onClick={() => onDelete(d)}>Xoá</Btn></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {creating && <CreateDocModal quotes={quotes} busy={busy} onPick={pick} onClose={() => setCreating(false)} />}
    </Card>
  )
}
