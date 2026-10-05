import { useEffect, useMemo, useState } from 'react'
import { useRoute, navigate, goBack } from '../../router.js'
import { useDrafts } from '../hooks/useDrafts.js'
import { canEditQuote } from '../lib/permissions.js'
import { ORDER_STATUS, buildQuoteDoc, buildDeliveryDoc, docTotals, buildQuoteText } from '../lib/docs.js'
import { fmtMoney, fmtDate } from '../lib/format.js'
import { Card, Btn, inputCls, Empty } from '../components/ui.jsx'
import { useDialog } from '../components/Dialogs.jsx'
import DocForm from '../components/DocForm.jsx'
import PreviewShell from '../components/PreviewShell.jsx'
import TermsEditModal from '../components/TermsEditModal.jsx'
import CreateDocModal from '../components/CreateDocModal.jsx'
import QuoteSheet from '../components/sheets/QuoteSheet.jsx'
import DeliverySheet from '../components/sheets/DeliverySheet.jsx'

const snap = (x) => JSON.stringify(x)
const SLUG = { quote: 'bao-gia', delivery: 'giao-hang' }
const StatusPill = ({ s }) => <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${ORDER_STATUS[s]?.cls || ''}`}>● {ORDER_STATUS[s]?.label || s}</span>

// Trang "Phiếu": cột trái = danh sách đơn + biểu mẫu; cột phải = tờ phiếu (bấm vào chữ để sửa); thanh dưới = tổng tiền + Lưu.
// Mỗi báo giá = 1 đơn = 1 phiếu báo giá + 1 phiếu giao hàng.
export default function OrdersPage({ user, perms, orders, loading, error, quotes, settings, api, createFromQuote }) {
  const dialog = useDialog()
  const { toast } = dialog
  const route = useRoute() // ['phieu', id, 'bao-gia'|'giao-hang', 'xem-lon']
  const [, idSeg, tabSeg, subSeg] = route
  const tab = tabSeg === 'giao-hang' ? 'delivery' : 'quote'
  const big = subSeg === 'xem-lon'
  const docKey = tab === 'quote' ? 'quoteDoc' : 'deliveryDoc'

  const { drafts, setDraft, clearDraft } = useDrafts('orders')
  const [base, setBase] = useState(null)
  const [state, setState] = useState('idle') // idle | loading | ok | missing
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editingTerms, setEditingTerms] = useState(false)
  const [search, setSearch] = useState('')

  // Chưa chọn đơn nào -> chọn đơn đầu tiên (thay thế mục lịch sử, không tạo thêm)
  useEffect(() => {
    if (!idSeg && !loading && orders.length) navigate(['phieu', orders[0].id], { replace: true })
  }, [idSeg, loading, orders])

  useEffect(() => {
    if (!idSeg) { setBase(null); setState('idle'); return }
    let alive = true
    setState('loading')
    api.fetchOrder(idSeg)
      .then((o) => {
        if (!alive) return
        const ok = o && (perms.seeAllQuotes || String(o.ownerId) === String(user.id))
        setBase(ok ? o : null)
        setState(ok ? 'ok' : 'missing')
      })
      .catch(() => alive && setState('missing'))
    return () => { alive = false }
  }, [idSeg]) // eslint-disable-line react-hooks/exhaustive-deps

  const baseDraft = base ? { status: base.status, quoteDoc: base.quoteDoc, deliveryDoc: base.deliveryDoc } : null
  const draft = idSeg ? drafts[idSeg] ?? baseDraft : null
  const dirty = !!idSeg && !!drafts[idSeg] && !!baseDraft && snap(drafts[idSeg]) !== snap(baseDraft)
  const doc = draft?.[docKey] ?? null
  const editable = !!base && canEditQuote(user, { ownerId: base.ownerId })
  const linkedQuote = base?.quoteId ? quotes.find((q) => q.id === base.quoteId) : null

  const setOrder = (patch) => setDraft(idSeg, (d) => ({ ...d, ...patch }), baseDraft)
  const setDoc = (u) => setDraft(idSeg, (d) => ({ ...d, [docKey]: typeof u === 'function' ? u(d[docKey]) : u }), baseDraft)
  const total = draft?.quoteDoc ? docTotals(draft.quoteDoc).grand : base?.amount || 0

  const save = async () => {
    if (!base || !draft) return
    setSaving(true)
    const res = await api.saveOrder(base, draft)
    setSaving(false)
    if (!res.ok) return dialog.alert({ tone: 'error', title: 'Không lưu được đơn', message: 'Nội dung bạn đã sửa vẫn được giữ lại trên trang này. Hãy kiểm tra kết nối mạng rồi bấm Lưu đơn lại.', detail: res.error })
    setBase(res.order)
    clearDraft(idSeg)
    toast.success('Đã lưu đơn')
  }
  const remove = async () => {
    if (!base) return
    const ok = await dialog.confirm({
      tone: 'danger', title: `Xoá đơn phiếu ${base.quoteCode}?`,
      message: 'Cả phiếu báo giá và phiếu giao hàng của đơn này sẽ bị xoá vĩnh viễn. Báo giá gốc không bị ảnh hưởng và bạn có thể tạo lại phiếu sau.',
      confirmText: 'Xoá đơn phiếu', cancelText: 'Không xoá',
    })
    if (!ok) return
    const res = await api.deleteOrder(base.id)
    if (!res.ok) return dialog.alert({ tone: 'error', title: 'Không xoá được đơn phiếu', message: 'Vui lòng thử lại sau ít phút.', detail: res.error })
    clearDraft(base.id)
    toast.success(`Đã xoá đơn phiếu ${base.quoteCode}`)
    navigate(['phieu'], { replace: true })
  }
  const label = tab === 'quote' ? 'phiếu báo giá' : 'phiếu giao hàng'
  // Khôi phục chữ: dựng lại phiếu đang xem từ dữ liệu gốc của báo giá
  const restore = async () => {
    if (!linkedQuote) return dialog.alert({ tone: 'warning', title: 'Không thể khôi phục', message: 'Báo giá gốc của đơn này không còn tồn tại nên không có dữ liệu để khôi phục.' })
    const ok = await dialog.confirm({
      tone: 'warning', icon: 'refresh', title: `Khôi phục nội dung ${label}?`,
      message: `Mọi chỉnh sửa trên ${label} này sẽ mất và được dựng lại từ báo giá gốc. ${tab === 'quote' ? 'Phiếu giao hàng' : 'Phiếu báo giá'} của đơn không bị ảnh hưởng.`,
      confirmText: 'Khôi phục', cancelText: 'Giữ nguyên',
    })
    if (!ok) return
    const built = tab === 'quote' ? buildQuoteDoc(linkedQuote, settings.company, settings.terms) : buildDeliveryDoc(linkedQuote, settings.company)
    setDoc({ ...built, code: doc?.code || built.code })
    toast.info(`Đã khôi phục ${label} về dữ liệu gốc — nhớ bấm Lưu đơn.`)
  }
  const makeMissing = () => {
    if (!linkedQuote) return dialog.alert({ tone: 'warning', title: 'Không thể tạo phiếu', message: 'Báo giá gốc của đơn này không còn tồn tại nên không có dữ liệu để tạo phiếu.' })
    setDoc(tab === 'quote' ? buildQuoteDoc(linkedQuote, settings.company, settings.terms) : buildDeliveryDoc(linkedQuote, settings.company))
  }

  const go = (id, t = tab) => navigate(['phieu', id, SLUG[t]])
  const pick = async (quote) => {
    setCreating(false) // đóng danh sách chọn, cửa sổ tiến trình sẽ hiện ngay
    await createFromQuote(quote)
  }

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase()
    return orders.filter((o) => !s || [o.quoteCode, o.customerName, o.ownerName].some((v) => String(v || '').toLowerCase().includes(s)))
  }, [orders, search])

  const editor = editable && doc ? { setData: setDoc, onEditTerms: () => setEditingTerms(true) } : undefined
  const renderSheet = (ref) => !doc ? null : tab === 'quote'
    ? <QuoteSheet ref={ref} data={doc} company={doc.company} terms={doc.terms || {}} editor={editor} />
    : <DeliverySheet ref={ref} data={doc} company={doc.company} editor={editor} />

  const missingBox = (
    <Card><Empty>Đơn này chưa có {tab === 'quote' ? 'phiếu báo giá' : 'phiếu giao hàng'}.</Empty>
      <div className="text-center"><Btn variant="primary" onClick={makeMissing} disabled={!editable}>Tạo từ báo giá</Btn></div></Card>
  )

  return (
    <div className="pb-24">
      <div className={`grid gap-4 items-start ${showPreview ? 'lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)]' : ''}`}>
        {/* ---------- Cột trái ---------- */}
        <div className="space-y-4 min-w-0">
          <Card>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="font-bold text-lg">Danh sách đơn</h2>
              <Btn variant="primary" className="!py-1.5" onClick={() => setCreating(true)}>+ Đơn mới</Btn>
            </div>
            <input className={`${inputCls} mb-2`} placeholder="Tìm theo mã báo giá, tên khách, người tạo…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {error && <div className="text-xs bg-red-50 border border-red-100 text-red-700 rounded-lg p-2.5 mb-2">{error}</div>}
            {loading ? <Empty>Đang tải…</Empty> : shown.length === 0 ? <Empty>Chưa có đơn nào. Bấm «+ Đơn mới» để tạo từ một báo giá.</Empty> : (
              <ul className="max-h-[260px] overflow-auto -mx-1">
                {shown.map((o) => (
                  <li key={o.id}>
                    <button onClick={() => go(o.id)} className={`w-full text-left px-2 py-2.5 rounded-lg flex items-center gap-3 justify-between ${o.id === idSeg ? 'bg-[#fff1ed]' : 'hover:bg-[#f7f8fa]'}`}>
                      <span className="min-w-0"><b className="mr-2">{o.quoteCode || '—'}</b><span className="text-sm text-[#4b5563]">{o.customerName || '(chưa có tên)'}</span></span>
                      <span className="flex items-center gap-2 shrink-0"><span className="text-sm font-semibold">{o.amount > 0 ? fmtMoney(o.amount) : ''}</span><StatusPill s={o.status} /></span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {state === 'loading' && <Empty>Đang tải đơn…</Empty>}
          {idSeg && state === 'missing' && <Card><Empty>Không tìm thấy đơn (có thể đã bị xoá hoặc bạn không có quyền xem).</Empty></Card>}
          {base && draft && (
            <>
              <Card className="!py-3.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-bold text-lg">Đơn {base.quoteCode}</h2>
                  <select disabled={!editable} value={draft.status} onChange={(e) => setOrder({ status: e.target.value })} className={`${inputCls} !w-auto !py-1.5 font-semibold`}>
                    {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <span className="text-xs text-[#6b7280]">Tạo bởi <b className="text-[#1a1f2c]">{base.ownerName || '—'}</b> · {fmtDate(base.createdAt)}</span>
                  <span className="ml-auto flex gap-2">
                    {base.quoteId && <Btn variant="sm" onClick={() => navigate(['moi', 'bao-gia', base.quoteId])}>Mở báo giá gốc</Btn>}
                    {perms.canDeleteQuote && <Btn variant="sm" className="!text-red-600" onClick={remove}>Xoá đơn</Btn>}
                  </span>
                </div>
                {!editable && <p className="text-xs text-red-600 mt-2">Bạn chỉ có quyền xem đơn này (thuộc người khác).</p>}
              </Card>
              {/* Chọn phiếu ngay trên cột trái khi xem trước đang ẩn */}
              {!showPreview && (
                <div className="inline-flex bg-white border border-[#dfe3e8] rounded-xl p-1 gap-1">
                  {[['quote', 'Phiếu báo giá'], ['delivery', 'Phiếu giao hàng']].map(([k, l]) => (
                    <button key={k} onClick={() => go(base.id, k)} className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold ${tab === k ? 'bg-[#ff4f25] text-white' : 'text-[#4b5563] hover:bg-[#f3f4f6]'}`}>{l}</button>
                  ))}
                </div>
              )}
              {doc ? <DocForm key={`${base.id}-${tab}`} type={tab} data={doc} setData={setDoc} disabled={!editable} /> : missingBox}
            </>
          )}
        </div>

        {/* ---------- Cột phải: tờ phiếu ---------- */}
        {showPreview && (
          <div className="min-w-0 lg:sticky lg:top-3">
            <Card className="!p-3">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <div className="inline-flex bg-[#f3f4f6] rounded-xl p-1 gap-1">
                  {[['quote', 'Phiếu báo giá'], ['delivery', 'Phiếu giao hàng']].map(([k, l]) => (
                    <button key={k} disabled={!base} onClick={() => base && go(base.id, k)} className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold ${tab === k ? 'bg-[#ff4f25] text-white' : 'text-[#4b5563] hover:bg-white'}`}>{l}</button>
                  ))}
                </div>
                <span className="ml-auto flex gap-2">
                  <Btn onClick={restore} disabled={!editable || !doc}>Khôi phục chữ</Btn>
                  <Btn variant="primary" disabled={!doc} onClick={() => navigate(['phieu', idSeg, SLUG[tab], 'xem-lon'])}>Xem lớn & xuất file</Btn>
                </span>
              </div>
              <p className="text-xs text-[#6b7280] mb-2">{editable ? 'Bấm vào chữ trên chứng từ để sửa.' : 'Chỉ xem.'}</p>
              <div className="bg-[#e5e7eb] rounded-xl p-2 lg:max-h-[calc(100vh-190px)] overflow-auto">
                {doc ? renderSheet(null) : <Empty>{base ? `Chưa có ${tab === 'quote' ? 'phiếu báo giá' : 'phiếu giao hàng'}.` : 'Chọn một đơn ở danh sách bên trái.'}</Empty>}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ---------- Thanh dưới ---------- */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#e3e7ec] shadow-[0_-4px_16px_rgba(0,0,0,.05)]">
        <div className="max-w-7xl 2xl:max-w-[1500px] mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
          <div className="mr-auto">
            <p className="text-xs text-[#6b7280] leading-none mb-1">Tổng số tiền thanh toán</p>
            <p className="text-2xl font-extrabold leading-none">{fmtMoney(total)}</p>
          </div>
          <span className={`text-sm ${dirty ? 'text-amber-700 font-semibold' : 'text-[#9ca3af]'}`}>{dirty ? '● Chưa lưu' : base ? 'Đã lưu' : ''}</span>
          <Btn onClick={() => setShowPreview((v) => !v)}>{showPreview ? 'Ẩn xem trước' : 'Hiện xem trước'}</Btn>
          <Btn disabled={!doc} onClick={() => navigate(['phieu', idSeg, SLUG[tab], 'xem-lon'])}>Xem lớn</Btn>
          <Btn variant="primary" onClick={save} disabled={!editable || !dirty || saving}>{saving ? 'Đang lưu…' : 'Lưu đơn'}</Btn>
        </div>
      </div>

      {big && doc && (
        <PreviewShell
          title={`${tab === 'quote' ? 'Phiếu báo giá' : 'Phiếu giao hàng'} ${doc.code} — bấm vào chữ để sửa`}
          fileName={doc.code}
          closeLabel="← Quay lại"
          onClose={() => goBack(['phieu', idSeg, SLUG[tab]])}
          getText={tab === 'quote' ? () => buildQuoteText(doc, doc.company, doc.terms || {}) : undefined}
          extra={editable && <Btn variant="primary" className="!py-1 !px-3 !text-xs" onClick={save} disabled={!dirty || saving}>{saving ? 'Đang lưu…' : dirty ? 'Lưu đơn' : 'Đã lưu ✓'}</Btn>}
        >
          {renderSheet}
        </PreviewShell>
      )}

      {editingTerms && doc && (
        <TermsEditModal
          current={doc.terms || {}} hasOverride={false} canEditQuote canEditDefaults={false}
          onSaveQuote={(v) => { setDoc((d) => ({ ...d, terms: v })); return { ok: true } }}
          onSaveDefault={() => ({ ok: true })} onResetQuote={() => {}}
          onClose={() => setEditingTerms(false)}
        />
      )}
      {creating && <CreateDocModal quotes={quotes} orders={orders} busy={busy} onPick={pick} onClose={() => setCreating(false)} />}
    </div>
  )
}
