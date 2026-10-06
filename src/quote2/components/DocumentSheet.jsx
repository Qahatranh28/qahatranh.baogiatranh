import { forwardRef } from 'react'
import CompanyHeader from './CompanyHeader.jsx'
import FitWidth from './FitWidth.jsx'

const DocumentSheet = forwardRef(function DocumentSheet({
  data,
  company,
  editor,
  title,
  date,
  dateKey = 'date',
  dateMode,
  numberLabel,
  showNumber,
  accentTitle,
  className = '',
  children,
}, ref) {
  const setData = (key, value) => editor.setData((current) => ({ ...current, [key]: value }))
  const setCompany = (key, value) => editor.setData((current) => ({
    ...current,
    company: { ...current.company, [key]: value },
  }))
  const displayDate = date === undefined ? data[dateKey] : date

  return (
    <div className="max-w-[960px] mx-auto">
      <FitWidth width={960}>
        <article ref={ref} className={`q2-sheet ${className} ${editor ? 'q2-edit' : ''} w-[960px] bg-white shadow-xl px-10 py-9 text-[13px] text-[#1a1f2c] leading-relaxed space-y-5`}>
          <CompanyHeader
            company={company}
            code={data.code}
            date={displayDate}
            dateMode={dateMode}
            title={title ?? data.title}
            numberLabel={numberLabel}
            showNumber={showNumber}
            accentTitle={accentTitle}
            edit={!!editor}
            onCompany={setCompany}
            onTitle={(value) => setData('title', value)}
            onCode={(value) => setData('code', value)}
            onDate={(value) => setData(dateKey, value)}
            onAccentTitle={(value) => setData('orderTitle', value)}
          />
          {children}
        </article>
      </FitWidth>
    </div>
  )
})

export default DocumentSheet
