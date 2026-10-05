import { splitBold } from '../lib/richText.js'

export default function RichText({ text }) {
  return splitBold(text).map((p, i) => (p.b ? <strong key={i} className="font-bold">{p.t}</strong> : <span key={i}>{p.t}</span>))
}
