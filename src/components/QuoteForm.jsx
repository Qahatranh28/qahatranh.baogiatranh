import SimpleQuoteForm from './SimpleQuoteForm.jsx'
import CustomQuoteForm from './CustomQuoteForm.jsx'
import MoebeQuoteForm from './MoebeQuoteForm.jsx'
import JerseyQuoteForm from './JerseyQuoteForm.jsx'
import React from 'react'

export default function QuoteForm({ mode, onModeChange, onToggleChange, toggles, unitPrice, ...formProps }) {
  const getHeaderInfo = () => {
    switch (mode) {
      case 'custom':
        return { title: 'Khung tùy chọn', desc: 'Những sản phẩm custom theo ý của khách hàng.' }
      case 'moebe':
        return { title: 'Khung Moebe', desc: 'Sản phẩm khung trong suốt có 2 lớp kính.' }
      case 'jersey':
        return { title: 'Khung áo đấu', desc: 'Khung tranh áo đấu — chọn loại áo, khung và size.' }
      case 'simple':
      default:
        return { title: 'Khung tiêu chuẩn', desc: 'Những sản phẩm đã có giá bán mặc định.' }
    }
  }

  const { title, desc } = getHeaderInfo()

  return (
    <section
      aria-labelledby="form-heading"
      className="bg-paper rounded-2xl border border-line shadow-sm p-6 sm:p-8"
    >
      {/* 1. THANH LỰA CHỌN 4 NÚT NẰM NGANG Ở PHÍA TRÊN */}
      <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-line bg-white p-1.5 w-full mb-6 shadow-sm">
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
            className={`py-2 px-1 rounded-lg text-xs font-mono uppercase tracking-wider text-center transition-all truncate ${
              mode === tab.id
                ? 'bg-[#ff4f25] text-white shadow-sm font-bold scale-[1.02]'
                : 'text-gray-600 hover:bg-[#FF8F00]/20 hover:text-[#ff4f25]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. TIÊU ĐỀ NẰM Ở PHÍA DƯỚI CÁC NÚT LỰA CHỌN */}
      <div className="mb-6">
        <h2
          id="form-heading"
          className="font-display font-bold text-xl text-blueprint tracking-tight"
        >
          {title}
        </h2>
        <p className="text-sm text-blueprint-light mt-1">{desc}</p>
      </div>

      {/* 3. NỘI DUNG FORM TƯƠNG ƯNG */}
      <div className="border-t border-line/50 pt-6">
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