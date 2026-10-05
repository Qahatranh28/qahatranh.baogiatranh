// Điều khoản dạng văn bản đơn giản, lưu gọn trong 1 chuỗi:
//   "- Mục chính"   "-- Mục con"   "**in đậm**"
// Dòng không có dấu "-" (dữ liệu cũ) được coi là mục chính.

export function parseTerms(body) {
  return String(body || '')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => {
      const m = l.match(/^\s*(-{1,2})\s*(.*)$/)
      return m ? { level: m[1].length, text: m[2] } : { level: 1, text: l.trim() }
    })
}

export const serializeTerms = (rows) =>
  rows
    .filter((r) => r.text.trim())
    .map((r) => (r.level === 2 ? '-- ' : '- ') + r.text.trim())
    .join('\n')

export const stripBold = (t) => String(t || '').replace(/\*\*/g, '')

// "a **b** c" -> [{t:'a ',b:false},{t:'b',b:true},{t:' c',b:false}]
export function splitBold(text) {
  return String(text || '')
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) => (part.startsWith('**') && part.endsWith('**') && part.length > 4 ? { t: part.slice(2, -2), b: true } : { t: part, b: false }))
}
