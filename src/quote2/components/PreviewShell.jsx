import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toBlob } from 'html-to-image'
import { Btn } from './ui.jsx'

const PRINT_CSS = `
@media print {
  html, body { background: #fff !important; margin: 0 !important; }
  body > *:not(#q2-print-root) { display: none !important; }
  #q2-print-root { position: static !important; inset: auto !important; background: #fff !important; padding: 0 !important; overflow: visible !important; display: block !important; }
  .q2-noprint { display: none !important; }
  .q2-fit { height: auto !important; }
  .q2-fit-inner { transform: none !important; margin: 0 auto !important; zoom: 0.72; }
  .q2-sheet { box-shadow: none !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: A4; margin: 0; }
}`

// Khung xem trước toàn màn hình + thanh nút (copy ảnh, tải ảnh, in/PDF). Dùng cho cả báo giá, phiếu báo giá, phiếu giao hàng.
//   children: (sheetRef) => <Sheet ref={sheetRef} />      extra: nút bổ sung      after: modal bổ sung
export default function PreviewShell({ title, fileName, onClose, closeLabel = 'Đóng', getText, extra, after, children }) {
  const [copied, setCopied] = useState(false)
  const [imgState, setImgState] = useState('') // '' | 'busy' | 'copied' | 'downloaded' | 'error'
  const sheetRef = useRef(null)

  // Container gắn vào <body> để khi in chỉ in tờ phiếu. Gỡ đi khi đóng.
  const root = useMemo(() => {
    const el = document.createElement('div')
    el.id = 'q2-print-root'
    el.className = 'fixed inset-0 z-50 bg-[#525659] overflow-auto py-6 px-3'
    return el
  }, [])
  useEffect(() => {
    document.body.appendChild(root)
    return () => root.remove()
  }, [root])
  useEffect(() => {
    const h = (e) => {
      const tag = document.activeElement?.tagName
      if (e.key === 'Escape' && tag !== 'TEXTAREA' && tag !== 'INPUT' && !document.querySelector('[data-q2-modal]')) onClose?.()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const renderPng = async () => {
    const el = sheetRef.current
    // Gỡ margin auto/bóng đổ khỏi ảnh và chốt đúng kích thước thật của tờ phiếu
    const opts = {
      pixelRatio: 5, backgroundColor: '#ffffff', cacheBust: true,
      width: el.offsetWidth, height: el.offsetHeight,
      style: { margin: '0', boxShadow: 'none', transform: 'none', maxWidth: 'none', width: `${el.offsetWidth}px` },
      filter: (n) => !(n.classList && n.classList.contains('q2-noprint')),
    }
    // Ẩn viền + chữ gợi ý (placeholder) của chế độ sửa: ảnh xuất ra không đọc được ::placeholder nên phải gỡ hẳn thuộc tính
    el.classList.add('q2-exporting')
    const holders = [...el.querySelectorAll('[placeholder]')].map((n) => [n, n.getAttribute('placeholder')])
    holders.forEach(([n]) => n.removeAttribute('placeholder'))
    await new Promise((r) => requestAnimationFrame(() => r()))
    try {
      try { return await toBlob(el, opts) } catch { return await toBlob(el, { ...opts, skipFonts: true }) }
    } finally {
      el.classList.remove('q2-exporting')
      holders.forEach(([n, v]) => n.setAttribute('placeholder', v))
    }
  }
  const download = (blob) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${fileName || 'phieu'}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }
  const copyImage = async (forceDownload = false) => {
    setImgState('busy')
    try {
      if (!forceDownload && navigator.clipboard?.write && window.ClipboardItem) {
        await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': renderPng() })])
        setImgState('copied')
      } else {
        download(await renderPng())
        setImgState('downloaded')
      }
    } catch (e) {
      console.error('Lỗi copy ảnh:', e)
      try { download(await renderPng()); setImgState('downloaded') } catch { setImgState('error') }
    }
    setTimeout(() => setImgState(''), 2500)
  }
  const copyText = async () => {
    try { await navigator.clipboard.writeText(getText()) } catch { /* bỏ qua */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return createPortal(
    <>
      <style>{PRINT_CSS}</style>
      <div className="q2-noprint max-w-[960px] mx-auto mb-3 flex flex-wrap items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow">
        <span className="font-bold text-sm mr-auto">{title}</span>
        {extra}
        {getText && <Btn variant="sm" onClick={copyText}>{copied ? 'Đã copy ✓' : 'Copy chữ (Zalo)'}</Btn>}
        <Btn variant="sm" onClick={() => copyImage(false)} disabled={imgState === 'busy'}>
          {{ busy: 'Đang tạo ảnh…', copied: 'Đã copy ảnh ✓', downloaded: 'Đã tải ảnh ✓', error: 'Lỗi, thử lại' }[imgState] || 'Copy ảnh'}
        </Btn>
        <Btn variant="sm" onClick={() => copyImage(true)} disabled={imgState === 'busy'}>Tải ảnh PNG</Btn>
        <Btn variant="primary" className="!py-1 !px-3 !text-xs" onClick={() => window.print()}>In / Lưu PDF</Btn>
        <Btn variant="dark" className="!py-1 !px-3 !text-xs" onClick={onClose}>{closeLabel}</Btn>
      </div>
      {children(sheetRef)}
      {after && <div className="q2-noprint">{after}</div>}
    </>,
    root
  )
}
