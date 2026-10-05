import RichText from './RichText.jsx'
import { parseTerms } from '../lib/richText.js'

// Khối điều khoản: nền nhạt, tiêu đề có ô icon cam, chấm cam (mục con: chấm rỗng)
export default function TermsBlock({ terms, compact = false }) {
  const rows = parseTerms(terms.body)
  if (!rows.length) return null
  return (
    <section className={`rounded-2xl bg-[#fdf1ed] ${compact ? 'px-5 py-4 text-[13px]' : 'px-6 py-5 text-[13.5px]'} leading-relaxed`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="w-11 h-11 rounded-xl bg-[#ff4f25] flex items-center justify-center shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" />
          </svg>
        </span>
        <h2 className="text-[17px] font-bold text-[#1a1f2c]">{terms.title}</h2>
      </div>
      <ul className="space-y-1.5">
        {rows.map((r, i) => (
          <li key={i} className={`flex gap-3 ${r.level === 2 ? (compact ? 'ml-7' : 'ml-9') : 'ml-0.5'}`}>
            {r.level === 2
              ? <span className="mt-[7px] w-2 h-2 rounded-full border-[1.5px] border-[#ff4f25] shrink-0" />
              : <span className="mt-[7px] w-2 h-2 rounded-full bg-[#ff4f25] shrink-0" />}
            <span><RichText text={r.text} /></span>
          </li>
        ))}
      </ul>
    </section>
  )
}
