import { lazy, Suspense } from 'react'
import App from './App.jsx' // trang báo giá CŨ
import ModeLanding from './components/ModeLanding.jsx'
import { DialogProvider } from './quote2/components/Dialogs.jsx'
import { useRoute, navigate } from './router.js'

// Trang mới & trang khách tải theo yêu cầu để không làm nặng trang cũ
const QuoteApp = lazy(() => import('./quote2/QuoteApp.jsx'))
const OrdersApp = lazy(() => import('./quote2/OrdersApp.jsx'))
const GuestPrices = lazy(() => import('./quote2/pages/GuestPrices.jsx'))

// Mỗi chế độ có địa chỉ riêng nên Quay lại / Tiến tới / Tải lại đều dùng bình thường:
//   /           màn hình chọn chế độ      /cu/...    trang báo giá cũ
//   /moi/...    trang báo giá mới         /phieu/... phiếu báo giá & giao hàng      /khach khách xem giá
const MODE_PATH = { legacy: 'cu', new: 'moi', docs: 'phieu', guest: 'khach' }
const Loading = () => <div className="min-h-screen flex items-center justify-center text-[#6b7280]">Đang tải…</div>

function Routes() {
  const route = useRoute()
  const mode = route[0]

  if (mode === 'cu') {
    return (
      <>
        <App />
        <button
          onClick={() => navigate([])}
          className="fixed z-50 bottom-20 right-3 lg:bottom-4 lg:right-4 bg-[#1a1f2c] text-white text-xs font-semibold rounded-full px-3.5 py-2 shadow-lg opacity-80 hover:opacity-100"
        >
          ⇄ Đổi chế độ
        </button>
      </>
    )
  }
  if (mode === 'moi') return <Suspense fallback={<Loading />}><QuoteApp /></Suspense>
  if (mode === 'phieu') return <Suspense fallback={<Loading />}><OrdersApp /></Suspense>
  if (mode === 'khach') return <Suspense fallback={<Loading />}><GuestPrices onBack={() => navigate([])} /></Suspense>
  return <ModeLanding onPick={(id) => navigate([MODE_PATH[id]])} />
}

export default function Root() {
  return <DialogProvider><Routes /></DialogProvider>
}
