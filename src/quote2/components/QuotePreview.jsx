import { useMemo, useState } from 'react'
import { Btn } from './ui.jsx'
import PreviewShell from './PreviewShell.jsx'
import QuoteSheet from './sheets/QuoteSheet.jsx'
import TermsEditModal from './TermsEditModal.jsx'
import { buildQuoteText } from '../lib/docs.js'

// Xem trước báo giá gửi khách (từ màn hình soạn báo giá)
export default function QuotePreview({
  quote, setQuote, company, terms: defTerms,
  canEditThisQuote, canEditDefaults, onSaveDefaultTerms, onClose,
}) {
  const [editingTerms, setEditingTerms] = useState(false)
  const ov = quote.previewOverrides || {}
  const terms = { ...defTerms, ...(ov.terms || {}) }
  const data = useMemo(() => ({ ...quote, date: quote.createdAt }), [quote])
  const setTermsOverride = (value) => setQuote((q) => ({ ...q, previewOverrides: { ...(q.previewOverrides || {}), terms: value } }))
  const clearTermsOverride = () => setQuote((q) => {
    const next = { ...(q.previewOverrides || {}) }
    delete next.terms
    return { ...q, previewOverrides: next }
  })

  return (
    <PreviewShell
      title="Xem trước báo giá gửi khách"
      fileName={quote.code}
      onClose={onClose}
      getText={() => buildQuoteText(data, company, terms)}
      extra={<Btn variant="sm" onClick={() => setEditingTerms(true)}>✎ Điều khoản</Btn>}
      after={editingTerms && (
        <TermsEditModal
          current={terms}
          hasOverride={!!ov.terms}
          canEditQuote={canEditThisQuote}
          canEditDefaults={canEditDefaults}
          onSaveQuote={(v) => { setTermsOverride(v); return { ok: true } }}
          onSaveDefault={onSaveDefaultTerms}
          onResetQuote={clearTermsOverride}
          onClose={() => setEditingTerms(false)}
        />
      )}
    >
      {(ref) => <QuoteSheet ref={ref} data={data} company={company} terms={terms} />}
    </PreviewShell>
  )
}
