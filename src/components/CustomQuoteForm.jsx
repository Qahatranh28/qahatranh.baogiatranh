import React from 'react'
import ProductNameCombobox from './ProductNameCombobox.jsx'
import LuxurySelect from './LuxurySelect.jsx'

export default function CustomQuoteForm({
  productName,
  width,
  height,
  quantity,
  toggles = {},
  selections = {},
  productNameOptions = [],
  onProductNameChange,
  onSelectExistingProduct,
  onWidthChange,
  onHeightChange,
  onQuantityChange,
  onToggleChange,
  onSelectionChange,
  khungTypeOptions = [], 
  
  // Các biến phân nhóm khung
  khungCategory,
  onKhungCategoryChange,
  categoryOptions = [],
  typeOptions = [],
  
  tranhInTypeOptions = [],
  vanTypeOptions = [],        
  giayBoTypeOptions = [],      
  glassMicaOptions = [],
  tranhInYoutubeUrl,
  glassMicaYoutubeUrl,
  vanYoutubeUrl,
  giayBoYoutubeUrl,
  getMaterialImage,
}) {

  // Rút gọn tên hiển thị (cắt bỏ các chữ tiếng Anh dài)
  const formatDisplayName = (fullName) => {
    if (!fullName) return '';
    let shortName = fullName.replace('Matboard Silk Scarf Framing ', '');
    shortName = shortName.replace('Classic Silk Scarf Framing ', '');
    shortName = shortName.replace('Moebe Silk Scarf Framing ', '');
    return shortName.trim();
  };

  // Thumbnail vật liệu
  const renderCornerThumbnail = (show, materialKey) => {
    if (!show) return null

    const localImages = {
      'sat_xi': '/images/sat-xi.png', 
      'son': '/images/son.jpg',
      'dong_goi': '/images/dong-goi.jpg'
    };

    let imgUrl = localImages[materialKey];
    if (!imgUrl) {
      imgUrl = getMaterialImage ? getMaterialImage(materialKey) : '/images/default.png';
    }

    if (!imgUrl) imgUrl = '/images/default.png';

    return (
      <img
        src={imgUrl}
        alt={materialKey}
        className="pointer-events-none absolute -top-3 -right-3 z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-[3px] border-white object-cover shadow-lg bg-gray-50"
        onError={(e) => {
          e.target.onerror = null; 
          e.target.src = '/images/default.png';
        }}
      />
    )
  }

  // Header kèm Nút Công Tắc (Toggle) Luxury
  const renderToggleHeader = (key, label) => (
    <div 
      className="bg-white border-b border-gray-100 px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => onToggleChange(key, !toggles[key])}
    >
      <span className="font-bold text-xs uppercase text-gray-800 tracking-widest select-none">
        {label}
      </span>
      
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(toggles[key])}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          toggles[key] ? 'bg-[#ff4f25]' : 'bg-gray-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            toggles[key] ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )

  // Hàm render link YouTube
  const renderYouTubeLink = (url) => {
    if (!url) return null;
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="mt-3 text-[11px] font-mono font-bold text-red-500 hover:text-red-600 flex items-center gap-1.5 transition-colors inline-flex"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
        Xem video thực tế
      </a>
    )
  }

  return (
    <div>
      {/* TÊN SẢN PHẨM */}
      <div className="mb-6">
        <label
          htmlFor="productName"
          className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1 transition-colors"
        >
          Tên sản phẩm
        </label>
        <ProductNameCombobox
          value={productName}
          onChange={onProductNameChange}
          onSelectExisting={onSelectExistingProduct}
          options={productNameOptions}
        />
      </div>
      
      {/* KÍCH THƯỚC */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-3 shadow-sm my-3">
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-1">
          Kích thước ngoài (cm)
        </div>

        <div className="space-y-2">
          {/* Hàng Rộng */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            <span className="text-sm font-bold text-gray-700 px-3">
              Chiều Rộng
            </span>
            <div className="w-1/2 bg-[#ff4f25] flex items-center">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                placeholder="0"
                value={width}
                onChange={(e) => onWidthChange(e.target.value)}
                className="w-full bg-[#ff4f25] px-3 py-2 text-sm text-white placeholder:text-white/70 outline-none font-mono text-center font-bold"
              />
            </div>
          </div>

          {/* Hàng Dài */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            <span className="text-sm font-bold text-gray-700 px-3">
              Chiều Dài
            </span>
            <div className="w-1/2 bg-[#ff4f25] flex items-center">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                placeholder="0"
                value={height}
                onChange={(e) => onHeightChange(e.target.value)}
                className="w-full bg-[#ff4f25] px-3 py-2 text-sm text-white placeholder:text-white/70 outline-none font-mono text-center font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 mt-6">
        
        {/* 1. KHUNG */}
        <div className="relative">
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
            {renderToggleHeader('khung', 'Khung')}
            {toggles.khung && (
              <div className="flex flex-col gap-4 p-4 bg-gray-50/50">
                <LuxurySelect
                  id="khungCategory"
                  label="Loại khung"
                  value={khungCategory}
                  onChange={onKhungCategoryChange}
                  options={categoryOptions}
                />
                
                <LuxurySelect
                  id="khungType"
                  label="Tên khung chi tiết"
                  value={selections.khungType}
                  onChange={(val) => onSelectionChange('khungType', val)}
                  // Map lại mảng chuỗi thành mảng object có label đã rút gọn
                  options={typeOptions.map(t => ({ value: t, label: formatDisplayName(t) }))}
                />
              </div>
            )}
          </div>
        </div>

        {/* 2. IN TRANH */}
        <div className="relative">
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
            {renderToggleHeader('tranhIn', 'In tranh')}
            {toggles.tranhIn && (
              <div className="p-4 bg-gray-50/50">
                <LuxurySelect
                  id="tranhInType"
                  label="Loại tranh in"
                  value={selections.tranhInType}
                  onChange={(val) => onSelectionChange('tranhInType', val)}
                  options={tranhInTypeOptions}
                />
                {renderYouTubeLink(tranhInYoutubeUrl)}
              </div>
            )}
          </div>
          {renderCornerThumbnail(toggles.tranhIn, selections.tranhInType)}
        </div>

        {/* 3. KÍNH / MICA */}
        <div className="relative">
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
            {renderToggleHeader('micaKinh', 'Kính / Mica')}
            {toggles.micaKinh && (
              <div className="p-4 bg-gray-50/50">
                <LuxurySelect
                  id="micaKinhType"
                  label="Loại Kính / Mica"
                  value={selections.micaKinhType}
                  onChange={(val) => onSelectionChange('micaKinhType', val)}
                  options={glassMicaOptions}
                />
                {renderYouTubeLink(glassMicaYoutubeUrl)}
              </div>
            )}
          </div>
          {renderCornerThumbnail(toggles.micaKinh, selections.micaKinhType)}
        </div>

        {/* 4. VÁN LÓT */}
        <div className="relative">
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
            {renderToggleHeader('van', 'Ván lót')}
            {toggles.van && (
              <div className="p-4 bg-gray-50/50">
                <LuxurySelect
                  id="vanLy"
                  label="Loại ván lót"
                  value={selections.vanLy}
                  onChange={(val) => onSelectionChange('vanLy', val)}
                  options={vanTypeOptions}
                />
                {renderYouTubeLink(vanYoutubeUrl)}
              </div>
            )}
          </div>
          {renderCornerThumbnail(toggles.van, selections.vanLy)}
        </div>

        {/* 5. GIẤY BO */}
        <div className="relative">
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
            {renderToggleHeader('giayBo', 'Giấy bo')}
            {toggles.giayBo && (
              <div className="p-4 bg-gray-50/50">
                <LuxurySelect
                  id="giayBoType"
                  label="Loại giấy bo"
                  value={selections.giayBoType}
                  onChange={(val) => onSelectionChange('giayBoType', val)}
                  options={giayBoTypeOptions}
                />
                {renderYouTubeLink(giayBoYoutubeUrl)}
              </div>
            )}
          </div>
          {renderCornerThumbnail(toggles.giayBo, selections.giayBoType)}
        </div>

        {/* 6. SẮT XI */}
        <div className="relative">
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
            {renderToggleHeader('satXi', 'Sắt xi')}
          </div>
          {renderCornerThumbnail(toggles.satXi, 'sat_xi')}
        </div>

        {/* 7. SƠN */}
        <div className="relative">
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
            {renderToggleHeader('son', 'Sơn')}
          </div>
          {renderCornerThumbnail(toggles.son, 'son')}
        </div>

        {/* 8. ĐÓNG GÓI - GIAO DIỆN LUXURY MỚI */}
        <div className="relative">
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
            <div
              onClick={() => onToggleChange?.('dongGoi', !toggles.dongGoi)}
              className={`relative flex items-center gap-3 p-4 cursor-pointer transition-all duration-300 group ${
                toggles.dongGoi
                  ? 'bg-white'
                  : 'bg-[#ff4f25]/5 hover:bg-[#ff4f25]/10'
              }`}
            >
              {/* CỘT 1: Icon */}
              <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors ${
                toggles.dongGoi ? 'bg-gray-100 text-gray-400' : 'bg-[#ff4f25]/10 text-[#ff4f25]'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
              </div>
              
              {/* CỘT 2: Nội dung chữ & Nhãn cảnh báo (Đã đưa xuống dưới) */}
              <div className="flex-1 min-w-0 flex flex-col items-start justify-center">
                <span className={`font-bold text-sm uppercase tracking-widest truncate w-full transition-colors ${
                  toggles.dongGoi ? 'text-gray-800' : 'text-[#ff4f25]'
                }`}>
                  Đóng gói
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5 whitespace-normal break-words leading-tight">
                  {toggles.dongGoi 
                    ? 'Đã bọc chống sốc an toàn.' 
                    : 'Khách mua lẻ ưu tiên chọn đóng gói.'}
                </span>
                
                {/* 🌟 Nhãn cảnh báo đẩy xuống dưới */}
                {!toggles.dongGoi && (
                  <div className="mt-1.5 px-2 py-0.5 bg-[#ff4f25] text-white text-[9px] font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                    </svg>
                    Khuyên dùng
                  </div>
                )}
              </div>

              {/* CỘT 3: Nút Toggle Switch */}
              <div className="shrink-0 flex items-center justify-center pl-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(toggles.dongGoi)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    toggles.dongGoi ? 'bg-[#ff4f25]' : 'bg-gray-300 group-hover:bg-gray-400'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      toggles.dongGoi ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>
          {renderCornerThumbnail(toggles.dongGoi, 'dong_goi')}
        </div>
      </div>

      {/* SỐ LƯỢNG */}
      <div className="mt-8 pb-4">
        <label
          htmlFor="quantity"
          className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1"
        >
          Số lượng
        </label>
        <input
          id="quantity"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          className="w-32 bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-base outline-none focus:border-[#ff4f25] focus:ring-4 focus:ring-[#ff4f25]/15 font-mono font-bold text-gray-800 shadow-sm transition-all text-center"
        />
      </div>
    </div>
  )
}