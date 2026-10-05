const fs = require('fs')
const files = [
  'c:/Users/tuanpn/Downloads/Bao-gia-don-dat-hang-DH261002-HUXJ-weasakldfl-fds.pdf',
  'c:/Users/tuanpn/Downloads/Phieu-giao-hang-DH261002-HUXJ-weasakldfl-fds.pdf',
]
function decodeLiteral(s) {
  return s.replace(/\\([()\\])/g, '$1').replace(/\\n/g, '\n')
}
for (const f of files) {
  const buf = fs.readFileSync(f)
  const s = buf.toString('latin1')
  const parts = []
  const reTj = /\((?:\\.|[^\\)])*\)\s*Tj/g
  let m
  while ((m = reTj.exec(s))) {
    const inner = m[0].replace(/\)\s*Tj$/, '').slice(1)
    parts.push(decodeLiteral(inner))
  }
  const reTJ = /\[(?:.|\n)*?\]\s*TJ/g
  while ((m = reTJ.exec(s))) {
    const bits = [...m[0].matchAll(/\((?:\\.|[^\\)])*\)/g)].map((x) => decodeLiteral(x[0].slice(1, -1)))
    parts.push(bits.join(''))
  }
  console.log('\n===== ' + f + ' =====')
  console.log('size', buf.length, 'chunks', parts.length)
  console.log(parts.join('\n'))
}
