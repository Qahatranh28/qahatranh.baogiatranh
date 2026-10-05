import { useRef } from 'react'
import { Btn } from './ui.jsx'

// Danh sách mục điều khoản: mỗi dòng 1 mục (chính/con), nút B (hoặc Ctrl+B) in đậm phần chữ đang chọn.
// rows: [{level:1|2, text}]   setRows: setter (nhận mảng mới hoặc hàm)
export default function TermsRowsEditor({ rows, setRows }) {
  const refs = useRef([])
  const patch = (i, p) => setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...p } : r)))
  const move = (i, d) => setRows((rs) => {
    const j = i + d
    if (j < 0 || j >= rs.length) return rs
    const c = [...rs]; [c[i], c[j]] = [c[j], c[i]]
    return c
  })
  const add = (after, level = 1) => setRows((rs) => { const c = [...rs]; c.splice(after + 1, 0, { level, text: '' }); return c })
  const del = (i) => setRows((rs) => (rs.length > 1 ? rs.filter((_, k) => k !== i) : [{ level: 1, text: '' }]))

  const toggleBold = (i) => {
    const el = refs.current[i]
    if (!el) return
    const a = el.selectionStart ?? 0
    const b = el.selectionEnd ?? 0
    const t = rows[i].text
    let next, caret
    if (a === b) { next = t.slice(0, a) + '****' + t.slice(a); caret = a + 2 }
    else {
      const sel = t.slice(a, b)
      const wrapped = t.slice(Math.max(0, a - 2), a) === '**' && t.slice(b, b + 2) === '**'
      if (wrapped) { next = t.slice(0, a - 2) + sel + t.slice(b + 2); caret = b - 2 }
      else { next = t.slice(0, a) + '**' + sel + '**' + t.slice(b); caret = b + 4 }
    }
    patch(i, { text: next })
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(caret, caret) })
  }

  const cls = 'w-full border border-[#dfe3e8] rounded-lg px-3 py-2 text-sm bg-[#f7f8fa] outline-none focus:border-[#ff4f25] focus:bg-white'
  return (
    <div>
      <span className="block text-xs text-[#6b7280] mb-1.5">Nội dung — bôi đen chữ rồi bấm <b>B</b> (hoặc Ctrl+B) để in đậm</span>
      <ul className="space-y-1.5">
        {rows.map((r, i) => (
          <li key={i} className={`flex items-center gap-1.5 ${r.level === 2 ? 'ml-8' : ''}`}>
            <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${r.level === 2 ? 'border-[1.5px] border-[#ff4f25]' : 'bg-[#ff4f25]'}`} />
            <input
              ref={(el) => (refs.current[i] = el)}
              className={cls}
              value={r.text}
              placeholder={r.level === 2 ? 'Mục con…' : 'Mục chính…'}
              onChange={(e) => patch(i, { text: e.target.value })}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); toggleBold(i) }
                if (e.key === 'Enter') { e.preventDefault(); add(i, r.level); requestAnimationFrame(() => refs.current[i + 1]?.focus()) }
              }}
            />
            <Btn variant="sm" className="!font-extrabold" title="In đậm" onClick={() => toggleBold(i)}>B</Btn>
            <Btn variant="sm" title={r.level === 2 ? 'Chuyển thành mục chính' : 'Chuyển thành mục con'} onClick={() => patch(i, { level: r.level === 2 ? 1 : 2 })}>{r.level === 2 ? '◂' : '▸'}</Btn>
            <Btn variant="sm" title="Lên" onClick={() => move(i, -1)}>↑</Btn>
            <Btn variant="sm" title="Xuống" onClick={() => move(i, 1)}>↓</Btn>
            <Btn variant="sm" title="Xoá dòng" onClick={() => del(i)}>✕</Btn>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 mt-2">
        <Btn variant="sm" onClick={() => add(rows.length - 1, 1)}>+ Mục chính</Btn>
        <Btn variant="sm" onClick={() => add(rows.length - 1, 2)}>+ Mục con</Btn>
      </div>
    </div>
  )
}
