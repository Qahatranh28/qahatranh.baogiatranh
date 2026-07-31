import { useMemo, useRef, useState } from 'react'

export default function ProductNameCombobox({ value, onChange, onSelectExisting, options }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase()
    const list = q
      ? options.filter((name) => name.toLowerCase().includes(q))
      : options
    return list.slice(0, 8)
  }, [value, options])

  const handleBlur = (e) => {
    // Đóng dropdown nếu focus rời khỏi cả input lẫn danh sách
    if (!containerRef.current?.contains(e.relatedTarget)) {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <input
        id="productName"
        type="text"
        placeholder="Nhập hoặc chọn tên sản phẩm..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        autoComplete="off"
        className="w-full bg-white border-2 border-line focus:border-amber rounded-md py-2.5 px-3 outline-none transition-colors text-blueprint"
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-line rounded-md shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((name) => (
            <li key={name}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelectExisting(name)
                  setIsOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-blueprint hover:bg-paper transition-colors"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
