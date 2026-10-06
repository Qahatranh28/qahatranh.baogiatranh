import { useEffect, useMemo, useState } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth.js'
import { useRoute, navigate, goBack } from '../router.js'
import { useQuotes2 } from './hooks/useQuotes2.js'
import { useOrders2 } from './hooks/useOrders2.js'
import { useDrafts } from './hooks/useDrafts.js'
import { useQuote2Settings } from './hooks/useQuote2Settings.js'
import { getPerms, canEditQuote, ROLE_LABELS } from './lib/permissions.js'
import { newQuote, cloneQuote } from './lib/calc.js'
import { initials } from './lib/format.js'
import { buildQuoteDoc, buildDeliveryDoc } from './lib/docs.js'
import { DEFAULT_MIN_MARGIN, DEFAULT_TAX_RATE } from './lib/defaults.js'
import LoginScreen from './components/LoginScreen.jsx'
import ChangePasswordModal from './components/ChangePasswordModal.jsx'
import QuotePreview from './components/QuotePreview.jsx'
import QuoteSheet from './components/sheets/QuoteSheet.jsx'
import CompanyEditModal from './components/CompanyEditModal.jsx'
import { Btn, Card, Empty } from './components/ui.jsx'
import { useDialog } from './components/Dialogs.jsx'
import QuotesPage from './pages/QuotesPage.jsx'
import QuoteEditor from './pages/QuoteEditor.jsx'
import CustomersPage from './pages/CustomersPage.jsx'
import StatsPage from './pages/StatsPage.jsx'
import AccountsPage from './pages/AccountsPage.jsx'

// Địa chỉ từng mục:  #/moi/bao-gia  #/moi/bao-gia/<id>  #/moi/bao-gia/<id>/xem-truoc  #/moi/khach-hang …
const SLUG = { quotes: 'bao-gia', customers: 'khach-hang', stats: 'thong-ke', accounts: 'tai-khoan' }
const TAB_BY_SLUG = Object.fromEntries(Object.entries(SLUG).map(([k, v]) => [v, k]))
const TAB_LABELS = { quotes: 'Báo giá', customers: 'Khách hàng', stats: 'Thống kê', accounts: 'Tài khoản' }
const snap = (q) => JSON.stringify(q)
const exit = () => navigate([])

// Trang báo giá MỚI. Dùng chung đăng nhập (bảng admin) và role admin/editor/sale với trang cũ,
// nhưng lưu dữ liệu ở bảng riêng quote2_* (xem sql/).
export default function QuoteApp() {
  const auth = useAdminAuth()
  if (!auth.user) return <LoginScreen onLogin={auth.login} onBack={exit} />
  return <Workspace auth={auth} />
}

function NotFound({ what, onBack }) {
  return (
    <Card><Empty>Không tìm thấy {what} (có thể đã bị xoá hoặc bạn không có quyền xem).</Empty><div className="text-center"><Btn onClick={onBack}>← Quay lại danh sách</Btn></div></Card>
  )
}

function Workspace({ auth }) {
  const { user, logout, changePassword } = auth
  const perms = useMemo(() => getPerms(user), [user])
  const { quotes, loading, error, refresh, saveQuote, deleteQuote } = useQuotes2(user, perms.seeAllQuotes)
  const ordersApi = useOrders2(user, perms.seeAllQuotes)
  const settings = useQuote2Settings()
  const qd = useDrafts('quotes')

  const route = useRoute() // ['moi', slug, id, sub]
  const [, slug, idSeg, subSeg] = route
  const tab = TAB_BY_SLUG[slug]
  const previewOpen = subSeg === 'xem-truoc'

  const [saving, setSaving] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [companyOpen, setCompanyOpen] = useState(false)
  const dialog = useDialog()
  const { toast } = dialog

  // Địa chỉ không hợp lệ / không đủ quyền -> về danh sách báo giá (thay thế mục lịch sử, không tạo thêm)
  useEffect(() => {
    if (!tab || !perms.tabs.includes(tab)) navigate(['moi', SLUG.quotes], { replace: true })
  }, [tab, perms])
  useEffect(() => { window.scrollTo(0, 0) }, [tab, idSeg])

  /* ---------------- Báo giá ---------------- */
  const quoteId = tab === 'quotes' ? idSeg : null
  const savedQuote = quoteId && quoteId !== 'moi' ? quotes.find((q) => q.id === quoteId) : null
  const draft = quoteId ? qd.drafts[quoteId] ?? savedQuote ?? null : null
  const dirty = !!quoteId && (quoteId === 'moi' ? !!draft : !!qd.drafts[quoteId] && snap(qd.drafts[quoteId]) !== snap(savedQuote))
  const defaults = { taxRate: DEFAULT_TAX_RATE, minMargin: DEFAULT_MIN_MARGIN }

  // Mở thẳng #/moi/bao-gia/moi (vd tải lại trang) mà chưa có bản nháp -> tạo báo giá trống
  useEffect(() => {
    if (quoteId === 'moi' && !qd.drafts.moi) qd.setDraft('moi', newQuote(user, defaults))
  }, [quoteId]) // eslint-disable-line react-hooks/exhaustive-deps

  const setQuote = (u) => qd.setDraft(quoteId, u, savedQuote)
  const openQuote = (q) => navigate(['moi', SLUG.quotes, q.id])
  const askDiscardDraft = (actionText) => dialog.confirm({
    tone: 'warning', icon: 'warning', title: 'Có báo giá mới chưa lưu',
    message: `Bạn đang có một báo giá mới chưa lưu. Nếu tiếp tục, bản nháp đó sẽ bị bỏ để ${actionText}.`,
    confirmText: 'Bỏ bản nháp & tiếp tục', cancelText: 'Giữ lại',
  })
  const startNew = async (patch = {}) => {
    if (qd.drafts.moi && !(await askDiscardDraft('tạo báo giá mới'))) return
    qd.setDraft('moi', { ...newQuote(user, defaults), ...patch })
    navigate(['moi', SLUG.quotes, 'moi'])
  }
  const startClone = async (q) => {
    if (qd.drafts.moi && !(await askDiscardDraft('nhân bản báo giá'))) return
    qd.setDraft('moi', cloneQuote(q, user))
    navigate(['moi', SLUG.quotes, 'moi'])
  }

  // Kiểm tra trước khi lưu: trả về câu thông báo lỗi hoặc null
  const validateDraft = () => {
    if (!draft) return 'Không có báo giá để lưu.'
    if (!draft.items.some((i) => (i.name || '').trim())) return 'Nhập ít nhất một sản phẩm có tên.'
    if (draft.status === 'lost' && !String(draft.lostReason || '').trim()) return 'Chọn lý do thất bại trước khi lưu.'
    return null
  }
  // Lưu thật vào DB (không hiện thông báo). Trả về { quote } hoặc { error }
  const persist = async () => {
    setSaving(true)
    const res = await saveQuote(draft)
    setSaving(false)
    if (!res.ok) return { error: res.error }
    if (quoteId === 'moi') navigate(['moi', SLUG.quotes, res.quote.id], { replace: true }) // báo giá mới có địa chỉ riêng
    qd.clearDraft(quoteId)
    return { quote: res.quote }
  }
  const saveCurrent = async () => {
    const msg = validateDraft()
    if (msg) { toast.warning(msg); return null }
    const r = await persist()
    if (r.error) {
      await dialog.alert({ tone: 'error', title: 'Không lưu được báo giá', message: 'Có lỗi khi lưu lên hệ thống. Nội dung bạn đã nhập vẫn được giữ lại — hãy kiểm tra kết nối mạng rồi thử lại.', detail: r.error })
      return null
    }
    toast.success('Đã lưu báo giá')
    return r.quote
  }
  const deleteCurrent = async () => {
    if (!draft?.id) return
    const ok = await dialog.confirm({
      tone: 'danger', title: `Xoá báo giá ${draft.code}?`,
      message: 'Báo giá sẽ bị xoá vĩnh viễn và không thể khôi phục. Các phiếu đã tạo từ báo giá này (nếu có) vẫn được giữ lại.',
      confirmText: 'Xoá báo giá', cancelText: 'Không xoá',
    })
    if (!ok) return
    const res = await deleteQuote(draft.id)
    if (!res.ok) return dialog.alert({ tone: 'error', title: 'Không xoá được báo giá', message: 'Vui lòng thử lại sau ít phút.', detail: res.error })
    qd.clearDraft(quoteId)
    toast.success(`Đã xoá báo giá ${draft.code}`)
    navigate(['moi', SLUG.quotes], { replace: true })
  }

  /* ---------------- Phiếu (đơn phiếu: 1 báo giá = 1 phiếu báo giá + 1 phiếu giao hàng) ---------------- */
  const orderOf = (qid) => ordersApi.orders.find((o) => o.quoteId === qid)
  // Nút "Tạo phiếu / Mở phiếu" trong màn hình báo giá: tự lưu báo giá, rồi mở đơn có sẵn hoặc tạo mới (có cửa sổ tiến trình)
  const openOrderFromEditor = async () => {
    const msg = validateDraft()
    if (msg) return dialog.alert({ tone: 'warning', title: 'Chưa thể tạo phiếu', message: msg })
    const needSave = !draft.id || dirty
    const existing = !needSave ? orderOf(draft.id) : null
    if (existing) return navigate(['phieu', existing.id])

    const steps = [...(needSave ? ['Lưu báo giá'] : []), 'Dựng phiếu báo giá & phiếu giao hàng', 'Lưu phiếu vào hệ thống', 'Mở phiếu']
    const p = dialog.progress({ title: 'Đang khởi tạo phiếu', subtitle: `Báo giá ${draft.code} · ${draft.customerName || 'chưa có tên khách'}`, steps })
    const off = needSave ? 1 : 0
    let saved = needSave ? null : draft
    let created = null
    for (;;) {
      let error = null
      if (!saved) { // bước chỉ chạy một lần: nếu thử lại sau khi đã lưu thì bỏ qua, tránh lưu trùng
        p.set(0)
        const r = await persist()
        if (r.error) error = r.error
        else saved = r.quote
      }
      if (!error) {
        p.set(off)
        const quoteDoc = buildQuoteDoc(saved, settings.company, settings.terms)
        const deliveryDoc = buildDeliveryDoc(saved, settings.company)
        await new Promise((r) => setTimeout(r, 0)) // nhường UI vẽ lại trước khi gửi dữ liệu
        p.set(off + 1)
        const res = await ordersApi.createOrder({ quote: saved, quoteDoc, deliveryDoc })
        if (res.ok) created = res
        else error = res.error
      }
      if (!error) break
      const choice = await p.fail(saved ? 'Báo giá đã được lưu nhưng chưa tạo được phiếu. Bạn có thể thử lại.' : 'Không lưu được báo giá nên chưa thể tạo phiếu. Nội dung bạn nhập vẫn được giữ lại.', error, { title: 'Không thể khởi tạo phiếu' })
      if (choice !== 'retry') return
    }
    p.set(off + 2)
    await p.done(created.existed ? 'Báo giá này đã có phiếu — đang mở lại.' : 'Đã tạo phiếu báo giá và phiếu giao hàng.', created.existed ? 'Đã có sẵn phiếu' : 'Khởi tạo thành công')
    navigate(['phieu', created.order.id])
  }

  // Đóng tab/đóng trình duyệt khi còn bản nháp chưa lưu -> cảnh báo (tải lại trang thì bản nháp vẫn được giữ)
  const hasUnsaved =
    Object.entries(qd.drafts).some(([k, v]) => k === 'moi' || snap(v) !== snap(quotes.find((q) => q.id === k)))
  useEffect(() => {
    if (!hasUnsaved) return
    const h = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [hasUnsaved])

  const doLogout = () => { qd.clearAll(); try { sessionStorage.removeItem('q2.drafts.orders') } catch { /* bỏ qua */ } logout() }
  const goTab = (t) => navigate(['moi', SLUG[t]])

  return (
    <div className="min-h-screen bg-[#eef1f4] text-[#1a1f2c]">
      <header className="bg-[#eef1f4]">
        <div className="max-w-7xl 2xl:max-w-[1500px] mx-auto px-4 pt-3 pb-2 flex items-center gap-3 flex-wrap">
          <img src="/images/logoCompany.png" alt="Qaha Tranh" className="w-10 h-10 rounded-lg" />
          <h1 className="font-bold text-lg mr-1 whitespace-nowrap">Hệ thống báo giá</h1>

          {/* Thanh công cụ: các tab + nút Thông tin công ty chung một thanh */}
          <nav className="mx-auto order-3 xl:order-none w-full xl:w-auto flex bg-white border border-[#dfe3e8] rounded-xl p-1 gap-1 overflow-x-auto">
            {perms.tabs.map((t) => (
              <button key={t} onClick={() => goTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${tab === t ? 'bg-[#1a1f2c] text-white' : 'text-[#4b5563] hover:bg-[#f3f4f6]'}`}>
                {TAB_LABELS[t]}
              </button>
            ))}
            {perms.canEditDefaults && (
              <button onClick={() => setCompanyOpen(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap text-[#4b5563] hover:bg-[#f3f4f6] border-l border-[#e3e7ec] ml-0.5">
                🏢 Thông tin công ty
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <span title={`${user.full_name || user.user} · ${ROLE_LABELS[user.role] || user.role}`} className="w-9 h-9 rounded-full bg-[#6b7a4f] text-white text-xs font-bold flex items-center justify-center shrink-0">{initials(user.full_name || user.user)}</span>
            <div className="hidden 2xl:block leading-tight whitespace-nowrap">
              <p className="text-sm font-semibold">{user.full_name || user.user}</p>
              <p className="text-[11px] text-[#6b7280]">{ROLE_LABELS[user.role] || user.role} · {user.user}</p>
            </div>
            <Btn variant="sm" onClick={() => setPwOpen(true)}>Đổi mật khẩu</Btn>
            <Btn variant="sm" onClick={doLogout}>Đăng xuất</Btn>
            <Btn variant="sm" onClick={exit}>⇄ Đổi chế độ</Btn>
          </div>
        </div>
      </header>

      <main className={`${tab === 'quotes' && quoteId ? 'max-w-[1700px]' : 'max-w-7xl 2xl:max-w-[1500px]'} mx-auto px-4 pb-10 pt-2`}>
        {tab === 'quotes' && (quoteId ? (
          draft ? (
            <div className="grid gap-4 items-start lg:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)]">
              <div className="min-w-0">
                <QuoteEditor
                  quote={draft} setQuote={setQuote} dirty={dirty} saving={saving} user={user} perms={perms} allQuotes={quotes}
                  onSave={saveCurrent} onBack={() => goBack(['moi', SLUG.quotes])} onNew={() => startNew()} onClone={() => startClone(draft)}
                  onPreview={() => navigate(['moi', SLUG.quotes, quoteId, 'xem-truoc'])} onDelete={deleteCurrent}
                  orderExists={!!draft.id && !!orderOf(draft.id)} onOpenOrder={openOrderFromEditor}
                />
              </div>
              <aside className="min-w-0">
                <Card className="!p-2">
                  <h2 className="font-bold text-sm mb-2">Xem trước báo giá</h2>
                  <p className="text-xs text-[#6b7280] mb-2">Bản xem trước cập nhật theo nội dung đang chỉnh sửa.</p>
                  <div className="overflow-x-hidden">
                    <QuoteSheet
                      data={{ ...draft, date: draft.createdAt }}
                      company={settings.company}
                      terms={{ ...settings.terms, ...(draft.previewOverrides?.terms || {}) }}
                    />
                  </div>
                </Card>
              </aside>
            </div>
          ) : quoteId === 'moi' || loading ? <Empty>Đang tải…</Empty>
            : <NotFound what="báo giá" onBack={() => navigate(['moi', SLUG.quotes], { replace: true })} />
        ) : (
          <QuotesPage quotes={quotes} loading={loading} error={error} perms={perms}
            onOpen={openQuote} onNew={() => startNew()} onClone={startClone} onRefresh={refresh} />
        ))}

        {tab === 'customers' && (
          <CustomersPage quotes={quotes} perms={perms} selKey={idSeg || null}
            onSelectKey={(k) => navigate(['moi', SLUG.customers, k], { replace: true })}
            onOpen={openQuote} onClone={startClone}
            onNewForCustomer={(c) => startNew({ customerName: c.name, customerPhone: c.phone })} />
        )}
        {tab === 'stats' && <StatsPage quotes={quotes} perms={perms} />}
        {tab === 'accounts' && perms.canManageAccounts && <AccountsPage me={user} />}
      </main>

      {tab === 'quotes' && previewOpen && draft && (
        <QuotePreview
          quote={draft} setQuote={setQuote}
          company={settings.company} terms={settings.terms}
          canEditThisQuote={canEditQuote(user, draft)} canEditDefaults={perms.canEditDefaults}
          onSaveDefaultTerms={(v) => settings.saveTerms(v, user)}
          onClose={() => goBack(['moi', SLUG.quotes, quoteId])}
        />
      )}

      {companyOpen && <CompanyEditModal current={settings.company} onSave={(v) => settings.saveCompany(v, user)} onClose={() => setCompanyOpen(false)} />}
      {pwOpen && <ChangePasswordModal onSubmit={changePassword} onClose={() => setPwOpen(false)} />}
      {user.must_change_password && !pwOpen && <ChangePasswordModal forced onSubmit={changePassword} />}
    </div>
  )
}
