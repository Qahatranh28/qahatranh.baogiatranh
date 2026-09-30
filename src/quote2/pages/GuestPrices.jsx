import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { inputCls, Empty } from '../components/ui.jsx'
import { fmtMoney } from '../lib/format.js'

// Chế độ khách: chỉ XEM bảng giá bán tiêu chuẩn. Chủ ý chỉ select cột an toàn —
// KHÔNG select price_cost (giá vốn) của frame_catalog.
export default function GuestPrices({ onBack }) {
  const [frames, setFrames] = useState([])
  const [sizes, setSizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')

  // 🌟 State quản lý các sản phẩm đang mở rộng (dạng danh sách ID đang được chọn)
  const [expandedIds, setExpandedIds] = useState({})

  useEffect(() => {
    ;(async () => {
      try {
        const [f, s] = await Promise.all([
          supabase.from('frame_catalog').select('frame_id, category, name, image_url'),
          supabase.from('frame_size').select('frame_id, size_name, price'),
        ])
        if (f.error) throw f.error
        if (s.error) throw s.error
        setFrames(f.data || [])
        setSizes(f.data ? s.data || [] : [])
      } catch (e) {
        setErr(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const groups = useMemo(() => {
    const by = {}
    frames.forEach((f) => {
      const list = sizes.filter((s) => s.frame_id === f.frame_id && s.price != null && Number(s.price) > 0)
      if (!list.length) return
      const key = f.category || 'khac'
      ;(by[key] ||= []).push({ ...f, sizes: list.sort((a, b) => Number(a.price) - Number(b.price)) })
    })
    return by
  }, [frames, sizes])

  const cats = Object.keys(groups)
  const label = (c) => c.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const s = q.trim().toLowerCase()

  // Hàm bật/tắt trạng thái mở rộng của một sản phẩm
  const toggleExpand = (frameId) => {
    setExpandedIds((prev) => ({
      ...prev,
      [frameId]: !prev[frameId],
    }))
  }

  return (
    <div className="min-h-screen bg-[#eef1f4]">
      <header className="bg-white border-b border-[#e3e7ec] sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src="/images/logoCompany.png" alt="" className="w-10 h-10 rounded-lg object-cover" />
          <div className="mr-auto">
            <h1 className="font-bold text-[#1a1f2c]">Bảng giá sản phẩm</h1>
            <p className="text-xs text-[#6b7280]">Chế độ khách — bấm vào sản phẩm để xem chi tiết giá kích thước</p>
          </div>
          <button onClick={onBack} className="text-sm border border-[#dfe3e8] rounded-lg px-3 py-1.5 hover:bg-[#f3f4f6] transition-colors">← Chọn chế độ khác</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5">
        <div className="grid sm:grid-cols-[1fr_240px] gap-2 mb-6">
          <input className={inputCls} placeholder="Tìm tên khung / kích thước…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">Tất cả nhóm sản phẩm</option>
            {cats.map((c) => <option key={c} value={c}>{label(c)}</option>)}
          </select>
        </div>

        {err && <div className="text-sm bg-red-50 border border-red-100 text-red-700 rounded-lg p-3 mb-3">{err}</div>}
        
        {loading ? (
          <Empty>Đang tải bảng giá…</Empty>
        ) : cats.length === 0 ? (
          <Empty>Chưa có bảng giá.</Empty>
        ) : (
          cats.filter((c) => cat === 'all' || c === cat).map((c) => {
            const list = groups[c].filter((f) => !s || f.name.toLowerCase().includes(s) || f.sizes.some((z) => String(z.size_name).toLowerCase().includes(s)))
            if (!list.length) return null
            return (
              <section key={c} className="mb-6">
                <h2 className="font-bold text-sm text-[#4b5563] uppercase tracking-wider mb-2.5 px-1">{label(c)}</h2>
                <div className="space-y-2.5">
                  {list.map((f) => {
                    const isExpanded = Boolean(expandedIds[f.frame_id])
                    return (
                      <div key={f.frame_id} className="bg-white border border-[#e3e7ec] rounded-xl shadow-xs overflow-hidden transition-all">
                        {/* 🌟 Dòng tiêu đề thu gọn: bấm vào để mở rộng/thu gọn */}
                        <div
                          onClick={() => toggleExpand(f.frame_id)}
                          className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-gray-50/80 transition-colors select-none"
                        >
                          <div className="flex items-center gap-3">
                            {f.image_url && <img src={f.image_url} alt="" loading="lazy" className="w-10 h-10 object-cover rounded-lg bg-[#f7f8fa] border border-gray-100 shrink-0" />}
                            <div>
                              <h3 className="font-semibold text-gray-800 text-sm">{f.name}</h3>
                              <p className="text-[11px] text-gray-400 mt-0.5">{f.sizes.length} kích thước có sẵn</p>
                            </div>
                          </div>

                          {/* Nút mũi tên xoay linh hoạt */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#ff4f25] font-medium hidden sm:inline">
                              {isExpanded ? 'Thu gọn' : 'Xem giá'}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#ff4f25]' : ''}`}
                            >
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </div>
                        </div>

                        {/* 🌟 Bảng giá chi tiết xổ xuống khi được click */}
                        {isExpanded && (
                          <div className="px-4 pb-3 pt-1 border-t border-[#f0f2f5] bg-gray-50/40">
                            <div className="max-h-60 overflow-y-auto pr-1">
                              <table className="w-full text-sm">
                                <tbody>
                                  {f.sizes.map((z, i) => (
                                    <tr key={i} className="border-t border-[#eef0f3] first:border-t-0">
                                      <td className="py-2 text-gray-600 font-mono text-xs">{z.size_name}</td>
                                      <td className="py-2 text-right font-semibold text-[#ff4f25]">{fmtMoney(z.price)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })
        )}
        <p className="text-xs text-[#6b7280] mt-8 text-center">Giá mang tính tham khảo. Vui lòng liên hệ nhân viên để được báo giá chính thức.</p>
      </main>
    </div>
  )
}