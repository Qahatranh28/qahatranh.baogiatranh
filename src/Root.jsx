import { lazy, Suspense, useState } from 'react'
import App from './App.jsx' // trang báo giá CŨ — giữ nguyên, không sửa
import ModeLanding from './components/ModeLanding.jsx'

// Trang mới & trang khách tải theo yêu cầu để không làm nặng trang cũ
const QuoteApp = lazy(() => import('./quote2/QuoteApp.jsx'))
const GuestPrices = lazy(() => import('./quote2/pages/GuestPrices.jsx'))

// Mỗi lần tải trang luôn hiện màn hình 3 lựa chọn (cố ý không nhớ lựa chọn cũ).
export default function Root() {
  const [mode, setMode] = useState(null) // null | 'legacy' | 'new' | 'guest'
  const back = () => setMode(null)

  if (mode === 'legacy') {
    return (
      <>
        <App />
        <button
          onClick={back}
          className="fixed z-50 bottom-20 right-3 lg:bottom-4 lg:right-4 bg-[#1a1f2c] text-white text-xs font-semibold rounded-full px-3.5 py-2 shadow-lg opacity-80 hover:opacity-100"
        >
          ⇄ Đổi chế độ
        </button>
      </>
    )
  }
  if (mode === 'new' || mode === 'guest') {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#6b7280]">Đang tải…</div>}>
        {mode === 'new' ? <QuoteApp onExit={back} /> : <GuestPrices onBack={back} />}
      </Suspense>
    )
  }
  return <ModeLanding onPick={setMode} />
}
