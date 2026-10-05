// Router rất nhỏ dựa trên URL dạng "#/moi/bao-gia/...".
// Dùng hash để KHÔNG cần cấu hình máy chủ: nút Quay lại / Tiến tới / Tải lại (F5) / copy link đều hoạt động bình thường.
import { useMemo, useSyncExternalStore } from 'react'

const listeners = new Set()
const notify = () => listeners.forEach((l) => l())
if (typeof window !== 'undefined') window.addEventListener('popstate', notify) // cũng bắt cả đổi hash bằng tay

const subscribe = (cb) => { listeners.add(cb); return () => listeners.delete(cb) }
const getHash = () => window.location.hash

export const parseHash = (h) =>
  String(h || '').replace(/^#\/?/, '').split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s) } catch { return s } })
export const toHash = (segs) => '#/' + segs.map((s) => encodeURIComponent(s)).join('/')

// Trả về mảng đoạn đường dẫn, vd "#/moi/bao-gia/abc" -> ['moi','bao-gia','abc']
export function useRoute() {
  const hash = useSyncExternalStore(subscribe, getHash, () => '')
  return useMemo(() => parseHash(hash), [hash])
}

// navigate(['moi','bao-gia']) = thêm một mục lịch sử mới; { replace: true } = thay mục hiện tại
export function navigate(segs, { replace = false } = {}) {
  const arr = Array.isArray(segs) ? segs : String(segs).split('/').filter(Boolean)
  const url = toHash(arr)
  if (url === window.location.hash || (arr.length === 0 && !window.location.hash)) return
  const i = window.history.state?.i ?? 0 // đếm độ sâu để biết còn "lùi" được trong chính web này không
  if (replace) window.history.replaceState({ i }, '', url)
  else window.history.pushState({ i: i + 1 }, '', url)
  notify()
}

// Lùi 1 bước nếu trước đó là trang của web này; nếu vào thẳng bằng link thì về trang dự phòng (không thoát web).
export function goBack(fallback = []) {
  if ((window.history.state?.i ?? 0) > 0) window.history.back()
  else navigate(fallback, { replace: true })
}
