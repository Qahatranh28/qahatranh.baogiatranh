import { useMemo } from 'react'
import PreviewShell from './PreviewShell.jsx'
import QuoteSheet from './sheets/QuoteSheet.jsx'
import { buildQuoteText } from '../lib/docs.js'

// Xem trước báo giá gửi khách (từ màn hình soạn báo giá)
export default function QuotePreview({
  quote, company, terms, onClose,
}) {
  const data = useMemo(() => ({ ...quote, date: quote.createdAt }), [quote])

  return (
    <PreviewShell
      title="Xem trước báo giá gửi khách"
      fileName={quote.code}
      onClose={onClose}
      getText={() => buildQuoteText(data, company, terms)}
    >
      {(ref) => <QuoteSheet ref={ref} data={data} company={company} terms={terms} />}
    </PreviewShell>
  )
}
