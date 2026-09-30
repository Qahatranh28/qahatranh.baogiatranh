import { useMemo, useState } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth.js'
import { useQuotes2 } from './hooks/useQuotes2.js'
import { useQuote2Settings } from './hooks/useQuote2Settings.js'
import { getPerms, canEditQuote, ROLE_LABELS } from './lib/permissions.js'
import { newQuote, cloneQuote } from './lib/calc.js'
import { initials } from './lib/format.js'
import { DEFAULT_MIN_MARGIN, DEFAULT_TAX_RATE } from './lib/defaults.js'
import LoginScreen from './components/LoginScreen.jsx'
import ChangePasswordModal from './components/ChangePasswordModal.jsx'
import QuotePreview from './components/QuotePreview.jsx'
import { Btn } from './components/ui.jsx'
import QuotesPage from './pages/QuotesPage.jsx'
import QuoteEditor from './pages/QuoteEditor.jsx'
import CustomersPage from './pages/CustomersPage.jsx'
import StatsPage from './pages/StatsPage.jsx'
import AccountsPage from './pages/AccountsPage.jsx'

const TAB_LABELS = { quotes: 'Báo giá', customers: 'Khách hàng', stats: 'Thống kê', accounts: 'Tài khoản' }
const snap = (q) => JSON.stringify(q)

// Trang báo giá MỚI. Dùng chung đăng nhập (bảng admin) và role admin/editor/sale với trang cũ,
// nhưng lưu dữ liệu ở bảng riêng quote2_* (xem sql/quote2_migration.sql).
export default function QuoteApp({ onExit }) {
  const auth = useAdminAuth()
  const { user } = auth
  if (!user) return <LoginScreen onLogin={auth.login} onBack={onExit} />
  return <Workspace auth={auth} onExit={onExit} />
}

function Workspace({ auth, onExit }) {
  const { user, logout, changePassword } = auth
  const perms = useMemo(() => getPerms(user), [user])
  const { quotes, loading, error, refresh, saveQuote, deleteQuote } = useQuotes2(user, perms.seeAllQuotes)
  const settings = useQuote2Settings()

  const [tab, setTab] = useState('quotes')
  const [draft, setDraft] = useState(null) // báo giá đang mở trong editor
  const [baseline, setBaseline] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [toast, setToast] = useState('')

  const dirty = draft ? snap(draft) !== baseline : false
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2500) }
  const confirmLeave = () => !dirty || window.confirm('Báo giá đang có thay đổi chưa lưu. Bỏ thay đổi?')

  const openDraft = (q, { saved = true } = {}) => {
    if (!confirmLeave()) return
    setDraft(q)
    setBaseline(saved ? snap(q) : '')
    setTab('quotes')
  }
  const defaults = { taxRate: DEFAULT_TAX_RATE, minMargin: DEFAULT_MIN_MARGIN }
  const startNew = (patch = {}) => openDraft({ ...newQuote(user, defaults), ...patch }, { saved: false })
  const startClone = (q) => openDraft(cloneQuote(q, user), { saved: false })

  const goTab = (t) => { if (t !== 'quotes' && !confirmLeave()) return; if (t !== 'quotes') { /* giữ draft để quay lại */ } setTab(t) }

  const handleSave = async () => {
    if (!draft) return
    if (!draft.items.some((i) => (i.name || '').trim())) return flash('Nhập ít nhất một sản phẩm có tên.')
    if (draft.status === 'lost' && !String(draft.lostReason || '').trim()) return flash('Chọn lý do thất bại trước khi lưu.')
    setSaving(true)
    const res = await saveQuote(draft)
    setSaving(false)
    if (!res.ok) return window.alert(`Không lưu được: ${res.error}`)
    setDraft(res.quote)
    setBaseline(snap(res.quote))
    flash('Đã lưu báo giá ✓')
  }

  const handleDelete = async () => {
    if (!draft?.id || !window.confirm(`Xoá vĩnh viễn báo giá ${draft.code}?`)) return
    const res = await deleteQuote(draft.id)
    if (!res.ok) return window.alert(res.error)
    setDraft(null); setBaseline('')
  }

  const backToList = () => { if (!confirmLeave()) return; setDraft(null); setBaseline('') }

  return (
    <div className="min-h-screen bg-[#eef1f4] text-[#1a1f2c]">
      <header className="bg-[#eef1f4]">
        <div className="max-w-6xl mx-auto px-4 pt-3 pb-2 flex items-center gap-3 flex-wrap">
          <img src="/images/logoCompany.png" alt="Qaha Tranh" className="w-10 h-10 rounded-lg" />
          <h1 className="font-bold text-lg mr-2">Hệ thống báo giá</h1>

          <nav className="mx-auto order-3 sm:order-none w-full sm:w-auto flex bg-white border border-[#dfe3e8] rounded-xl p-1 gap-1 overflow-x-auto">
            {perms.tabs.map((t) => (
              <button key={t} onClick={() => goTab(t)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${tab === t ? 'bg-[#1a1f2c] text-white' : 'text-[#4b5563] hover:bg-[#f3f4f6]'}`}>
                {TAB_LABELS[t]}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <span className="w-9 h-9 rounded-full bg-[#6b7a4f] text-white text-xs font-bold flex items-center justify-center">{initials(user.full_name || user.user)}</span>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-semibold">{user.full_name || user.user}</p>
              <p className="text-[11px] text-[#6b7280]">{ROLE_LABELS[user.role] || user.role} · {user.user}</p>
            </div>
            <Btn variant="sm" onClick={() => setPwOpen(true)}>Đổi mật khẩu</Btn>
            <Btn variant="sm" onClick={logout}>Đăng xuất</Btn>
            <Btn variant="sm" onClick={() => { if (confirmLeave()) onExit() }}>⇄ Đổi chế độ</Btn>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-10 pt-2">
        {tab === 'quotes' && (draft ? (
          <QuoteEditor
            quote={draft} setQuote={setDraft} dirty={dirty} saving={saving} user={user} perms={perms} allQuotes={quotes}
            onSave={handleSave} onBack={backToList} onNew={() => startNew()} onClone={() => startClone(draft)}
            onPreview={() => setPreviewOpen(true)} onDelete={handleDelete}
          />
        ) : (
          <QuotesPage quotes={quotes} loading={loading} error={error} perms={perms}
            onOpen={(q) => openDraft(structuredClone(q))} onNew={() => startNew()} onClone={startClone} onRefresh={refresh} />
        ))}
        {tab === 'customers' && (
          <CustomersPage quotes={quotes} perms={perms}
            onOpen={(q) => openDraft(structuredClone(q))} onClone={startClone}
            onNewForCustomer={(c) => startNew({ customerName: c.name, customerPhone: c.phone })} />
        )}
        {tab === 'stats' && <StatsPage quotes={quotes} perms={perms} />}
        {tab === 'accounts' && perms.canManageAccounts && <AccountsPage me={user} />}
      </main>

      {previewOpen && draft && (
        <QuotePreview
          quote={draft} setQuote={setDraft}
          company={settings.company} terms={settings.terms}
          canEditThisQuote={canEditQuote(user, draft)} canEditDefaults={perms.canEditDefaults}
          onSaveDefaultCompany={(v) => settings.saveCompany(v, user)}
          onSaveDefaultTerms={(v) => settings.saveTerms(v, user)}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {pwOpen && <ChangePasswordModal onSubmit={changePassword} onClose={() => setPwOpen(false)} />}
      {user.must_change_password && !pwOpen && <ChangePasswordModal forced onSubmit={changePassword} />}
      {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] bg-[#1a1f2c] text-white text-sm px-4 py-2 rounded-lg shadow-lg">{toast}</div>}
    </div>
  )
}
