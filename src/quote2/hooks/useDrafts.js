import { useCallback, useEffect, useRef, useState } from 'react'

// Bản nháp CHƯA LƯU, giữ trong sessionStorage: bấm Quay lại / Tải lại trang không làm mất phần đang sửa.
// Mỗi tab trình duyệt có kho riêng; đăng xuất thì xoá sạch.
export function useDrafts(name) {
  const storageKey = `q2.drafts.${name}`
  const [drafts, setDrafts] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(storageKey) || '{}') } catch { return {} }
  })
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    try { sessionStorage.setItem(storageKey, JSON.stringify(drafts)) } catch { /* đầy bộ nhớ: bỏ qua */ }
  }, [drafts, storageKey])

  // setDraft(id, valueOrUpdater, base): updater nhận (bản nháp hiện có || base)
  const setDraft = useCallback((id, value, base) => {
    setDrafts((d) => ({ ...d, [id]: typeof value === 'function' ? value(d[id] ?? base) : value }))
  }, [])
  const clearDraft = useCallback((id) => {
    setDrafts((d) => { if (!(id in d)) return d; const n = { ...d }; delete n[id]; return n })
  }, [])
  const clearAll = useCallback(() => { setDrafts({}); try { sessionStorage.removeItem(storageKey) } catch { /* bỏ qua */ } }, [storageKey])
  return { drafts, setDraft, clearDraft, clearAll }
}
