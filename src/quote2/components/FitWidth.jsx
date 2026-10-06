import { useEffect, useRef, useState } from 'react'

// Hiển thị nội dung có bề rộng cố định (vd tờ báo giá 960px) và tự thu nhỏ vừa khung chứa.
// Nhờ vậy bố cục luôn giống nhau ở mọi cỡ màn hình / trong cửa sổ popup, không bị bóp chữ.
export default function FitWidth({ width = 960, className = '', children }) {
  const outer = useRef(null)
  const inner = useRef(null)
  const [scale, setScale] = useState(1)
  const [h, setH] = useState(null)

  useEffect(() => {
    const measure = () => {
      if (!outer.current || !inner.current) return
      const k = Math.min(1, outer.current.clientWidth / width)
      setScale(k)
      setH(inner.current.offsetHeight * k)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(outer.current)
    ro.observe(inner.current)
    return () => ro.disconnect()
  }, [width])

  return (
    <div ref={outer} className={`q2-fit w-full ${className}`} style={{ height: h ?? undefined }}>
      <div
        ref={inner}
        className="q2-fit-inner"
        style={{
          width,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          marginLeft: `max(0px, calc((100% - ${width * scale}px) / 2))`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
