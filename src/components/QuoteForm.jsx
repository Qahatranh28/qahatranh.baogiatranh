import SimpleQuoteForm from './SimpleQuoteForm.jsx'
import CustomQuoteForm from './CustomQuoteForm.jsx'
import MoebeQuoteForm from './MoebeQuoteForm.jsx'
import JerseyQuoteForm from './JerseyQuoteForm.jsx'
import React from 'react'

export default function QuoteForm({ mode, onModeChange, onToggleChange, toggles, unitPrice, ...formProps }) {
  const getHeaderInfo = () => {
    switch (mode) {
      case 'custom':
        return { title: 'Thêm sản phẩm', desc: 'Khai báo chi tiết cho sản phẩm bán lẻ.' }
      case 'moebe':
        return { title: 'Khung Moebe', desc: 'Chọn loại khung nhôm và kích thước từ bảng giá Moebe.' }
      case 'jersey':
        return { title: 'Khung áo đấu', desc: 'Khung tranh áo đấu — chọn loại áo, khung và size.' }
      case 'simple':
      default:
        return { title: 'Thêm sản phẩm', desc: 'Chọn tên khung, loại khung và kích thước tiêu chuẩn.' }
    }
  }

  const { title, desc } = getHeaderInfo()

  return (
    <section
      aria-labelledby="form-heading"
      className="bg-paper rounded-2xl border border-line shadow-sm p-6 sm:p-8"
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
        <div>
          <h2
            id="form-heading"
            className="font-display font-semibold text-xl text-blueprint"
          >
            {title}
          </h2>
          <p className="text-sm text-blueprint-light mt-1">{desc}</p>
        </div>

        <div className="shrink-0 grid grid-cols-2 gap-1.5 rounded-xl border border-line bg-white p-1.5 w-full sm:w-auto min-w-[260px]">
          {[
            { id: 'simple', label: 'Tiêu chuẩn' },
            { id: 'custom', label: 'Custom' },
            { id: 'moebe', label: 'Moebe' },
            { id: 'jersey', label: 'Áo đấu' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onModeChange(tab.id)}
              className={`px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider text-center transition-all ${
                mode === tab.id
                  ? 'bg-amber text-blueprint shadow-sm font-bold'
                  : 'text-blueprint/60 hover:bg-amber/10 hover:text-blueprint'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-line/50 pt-6">
        {mode === 'simple' && (
          <SimpleQuoteForm
            {...formProps}
            toggles={toggles}
            onWidthChange={formProps.onWidthChange}
            onHeightChange={formProps.onHeightChange}
          />
        )}

        {mode === 'custom' && (
          <CustomQuoteForm {...formProps} toggles={toggles} onToggleChange={onToggleChange} />
        )}

        {mode === 'moebe' && (
          <MoebeQuoteForm {...formProps} toggles={toggles} onToggleChange={onToggleChange} />
        )}

        {mode === 'jersey' && (
          <JerseyQuoteForm
            {...formProps}
            toggles={toggles}
            onToggleChange={onToggleChange}
            unitPrice={unitPrice}
          />
        )}
      </div>
    </section>
  )
}
