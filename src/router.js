// Router dựa trên đường dẫn thông thường, vd "/moi/bao-gia/...".
import { useMemo, useSyncExternalStore } from 'react'

const listeners = new Set()
const notify = () => listeners.forEach((l) => l())
if (typeof window !== 'undefined') {
  const legacyRoute = window.location.hash
  if (legacyRoute.startsWith('#/')) {
    window.history.replaceState(
      window.history.state,
      '',
      `${legacyRoute.slice(1)}${window.location.search}`,
    )
  }
  window.addEventListener('popstate', notify)
}

const subscribe = (cb) => { listeners.add(cb); return () => listeners.delete(cb) }
const getPath = () => window.location.pathname

export const parsePath = (path) =>
  String(path || '').replace(/^\/+|\/+$/g, '').split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s) } catch { return s } })
export const toPath = (segs) => '/' + segs.map((s) => encodeURIComponent(s)).join('/')

// Trả về mảng đoạn đường dẫn, vd "/moi/bao-gia/abc" -> ['moi','bao-gia','abc']
export function useRoute() {
  const path = useSyncExternalStore(subscribe, getPath, () => '')
  return useMemo(() => parsePath(path), [path])
}

// navigate(['moi','bao-gia']) = thêm một mục lịch sử mới; { replace: true } = thay mục hiện tại
export function navigate(segs, { replace = false } = {}) {
  const arr = Array.isArray(segs) ? segs : String(segs).split('/').filter(Boolean)
  const url = `${toPath(arr)}${window.location.search}`
  if (toPath(arr) === window.location.pathname) return
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
