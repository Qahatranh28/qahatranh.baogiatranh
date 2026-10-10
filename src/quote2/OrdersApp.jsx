import { useEffect, useMemo, useState } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth.js'
import { navigate } from '../router.js'
import { useQuotes2 } from './hooks/useQuotes2.js'
import { useOrders2 } from './hooks/useOrders2.js'
import { useQuote2Settings } from './hooks/useQuote2Settings.js'
import { getPerms, ROLE_LABELS } from './lib/permissions.js'
import { buildQuoteDoc, buildDeliveryDoc } from './lib/docs.js'
import { initials } from './lib/format.js'
import LoginScreen from './components/LoginScreen.jsx'
import ChangePasswordModal from './components/ChangePasswordModal.jsx'
import CompanyEditModal from './components/CompanyEditModal.jsx'
import { Btn } from './components/ui.jsx'
import { useDialog } from './components/Dialogs.jsx'
import OrdersPage from './pages/OrdersPage.jsx'

const exit = () => navigate([])

// Chế độ "Phiếu báo giá & giao hàng": #/phieu, #/phieu/<id>/bao-gia, #/phieu/<id>/giao-hang, #/phieu/<id>/giao-hang/view-full
export default function OrdersApp() {
  const auth = useAdminAuth()
  if (!auth.user) return <LoginScreen onLogin={auth.login} onBack={exit} />
  return <Shell auth={auth} />
}

function Shell({ auth }) {
  const { user, logout, changePassword } = auth
  const perms = useMemo(() => getPerms(user), [user])
  const { quotes } = useQuotes2(user, perms.seeAllQuotes)
  const ordersApi = useOrders2(user, perms.seeAllQuotes)
  const settings = useQuote2Settings()
  const [pwOpen, setPwOpen] = useState(false)
  const [companyOpen, setCompanyOpen] = useState(false)
  const dialog = useDialog()
  useEffect(() => {
    if (!perms.canViewSheets) navigate(['moi', 'bao-gia'], { replace: true })
  }, [perms.canViewSheets])

  // Báo giá đã có đơn -> mở đơn đó; chưa có -> tạo đơn (phiếu báo giá + phiếu giao hàng) với cửa sổ tiến trình rồi mở
  const createFromQuote = async (quote) => {
    const existing = ordersApi.orders.find((o) => o.quoteId === quote.id)
    if (existing) {
      dialog.toast.info(`Báo giá ${quote.code} đã có phiếu — đã mở lại.`)
      return navigate(['phieu', existing.id])
    }
    const p = dialog.progress({
      title: 'Đang khởi tạo phiếu', subtitle: `Báo giá ${quote.code} · ${quote.customerName || 'chưa có tên khách'}`,
      steps: ['Chuẩn bị dữ liệu báo giá', 'Dựng phiếu báo giá & phiếu giao hàng', 'Lưu phiếu vào hệ thống', 'Mở phiếu'],
    })
    let created = null
    for (;;) {
      p.set(0)
      await new Promise((r) => setTimeout(r, 0))
      p.set(1)
      const quoteDoc = buildQuoteDoc(quote, settings.company, settings.terms)
      const deliveryDoc = buildDeliveryDoc(quote, settings.company)
      await new Promise((r) => setTimeout(r, 0))
      p.set(2)
      const res = await ordersApi.createOrder({ quote, quoteDoc, deliveryDoc })
      if (res.ok) { created = res; break }
      const choice = await p.fail('Không tạo được phiếu. Vui lòng kiểm tra kết nối mạng rồi thử lại.', res.error, { title: 'Không thể khởi tạo phiếu' })
      if (choice !== 'retry') return
    }
    p.set(3)
    await p.done(created.existed ? 'Báo giá này đã có phiếu — đang mở lại.' : 'Đã tạo phiếu báo giá và phiếu giao hàng.', created.existed ? 'Đã có sẵn phiếu' : 'Khởi tạo thành công')
    navigate(['phieu', created.order.id])
  }

  if (!perms.canViewSheets) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#eef1f4] text-[#1a1f2c]">
      <header>
        <div className="max-w-7xl 2xl:max-w-[1500px] mx-auto px-4 pt-3 pb-2 flex items-center gap-3 flex-wrap">
          <img src="/images/logoCompany.png" alt="Qaha Tranh" className="w-10 h-10 rounded-lg" />
          <h1 className="font-bold text-lg whitespace-nowrap">Phiếu báo giá & phiếu giao hàng</h1>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <span title={`${user.full_name || user.user} · ${ROLE_LABELS[user.role] || user.role}`} className="w-9 h-9 rounded-full bg-[#6b7a4f] text-white text-xs font-bold flex items-center justify-center shrink-0">{initials(user.full_name || user.user)}</span>
            <div className="hidden xl:block leading-tight whitespace-nowrap">
              <p className="text-sm font-semibold">{user.full_name || user.user}</p>
              <p className="text-[11px] text-[#6b7280]">{ROLE_LABELS[user.role] || user.role} · {user.user}</p>
            </div>
            <Btn variant="sm" onClick={() => navigate(['moi', 'bao-gia'])}>📋 Trang báo giá mới</Btn>
            {perms.canEditDefaults && <Btn variant="sm" onClick={() => setCompanyOpen(true)}>🏢 Thông tin công ty</Btn>}
            <Btn variant="sm" onClick={() => setPwOpen(true)}>Đổi mật khẩu</Btn>
            <Btn variant="sm" onClick={logout}>Đăng xuất</Btn>
            <Btn variant="sm" className="!border-[#ff4f25] !bg-white !text-[#ff4f25] hover:!bg-orange-50" onClick={exit}>
  ⇄ Đổi chế độ
</Btn>
          </div>
        </div>
      </header>

      <main className="max-w-7xl 2xl:max-w-[1500px] mx-auto px-4 pt-2">
        <OrdersPage
          user={user} perms={perms} quotes={quotes} settings={settings}
          orders={ordersApi.orders} loading={ordersApi.loading} error={ordersApi.error}
          api={ordersApi} createFromQuote={createFromQuote}
        />
      </main>

      {companyOpen && <CompanyEditModal current={settings.company} onSave={(v) => settings.saveCompany(v, user)} onClose={() => setCompanyOpen(false)} />}
      {pwOpen && <ChangePasswordModal onSubmit={changePassword} onClose={() => setPwOpen(false)} />}
      {user.must_change_password && !pwOpen && <ChangePasswordModal forced onSubmit={changePassword} />}
    </div>
  )
}
