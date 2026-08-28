import React, { useEffect } from 'react'
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
  giayBoTypeOptions = [],
  tranhInYoutubeUrl,
  giayBoYoutubeUrl,
  getMaterialImage,

  // 🌟 Giấy bo: Nhận đầy đủ Label và Price
  giayBoQuantity = '1',
  onGiayBoQuantityChange,
  giayBoSizeMatchLabel,
  giayBoSizeMatchPrice,
}) {

  // Lọc bỏ các danh mục có chứa chữ "Khăn Lụa"
  const filteredCategoryOptions = categoryOptions.filter(
    (cat) => !String(cat).toLowerCase().includes('khăn lụa')
  )

  // Rút gọn tên hiển thị (cắt bỏ các chữ tiếng Anh dài)
  const formatDisplayName = (fullName) => {
    if (!fullName) return '';
    let shortName = fullName.replace('Matboard Silk Scarf Framing ', '');
    shortName = shortName.replace('Classic Silk Scarf Framing ', '');
    shortName = shortName.replace('Moebe Silk Scarf Framing ', '');
    return shortName.trim();
  };

  // 🌟 Thumbnail vật liệu nổi lên phía trên góc phải, hiển thị trọn vẹn không bị cắt
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
      <div className="absolute -top-3 -right-2 z-30 pointer-events-none drop-shadow-md">
        <img
          src={imgUrl}
          alt={materialKey}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-white object-cover bg-white"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/default.png';
          }}
        />
      </div>
    )
  }

  // Hàm render link YouTube
  const renderYouTubeLink = (url) => {
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 text-[10px] font-mono font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors inline-flex"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
        Xem video thực tế
      </a>
    )
  }

  // 🌟 ToggleCard tối ưu: Đã cô lập sự kiện click để không bị nhảy layout/cuộn trang
  const ToggleCard = ({ toggleKey, label, thumbnailKey, children, caption, disabled = false }) => (
    <div className={`relative rounded-lg border border-gray-200 shadow-sm bg-white mt-3 ${disabled ? 'opacity-70' : ''}`}>
      {/* Thumbnail nổi lên trên góc phải */}
      {thumbnailKey && renderCornerThumbnail(toggles[toggleKey], thumbnailKey)}

      <div
        className={`bg-white px-3.5 py-2.5 flex items-center justify-between rounded-lg ${
          thumbnailKey && toggles[toggleKey] ? 'pr-14' : ''
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 transition-colors'}`}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled && (toggleKey === 'van' || toggleKey === 'giayBo') && toggles.vienFomex) {
            alert('⚠️ Không thể tắt Ván lót hoặc Giấy bo khi đang bật Nền trắng!');
            return;
          }
          if (!disabled) onToggleChange(toggleKey, !toggles[toggleKey])
        }}
      >
        {/* Nhóm tiêu đề và nút công tắc nằm sát cạnh nhau */}
        <div className="inline-flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <span className="font-bold text-xs uppercase text-gray-800 tracking-widest select-none">
              {label}
            </span>
            {caption && (
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{caption}</p>
            )}
          </div>

          {/* Nút công tắc bám ngay bên cạnh tiêu đề */}
          <button
            type="button"
            role="switch"
            disabled={disabled}
            aria-checked={Boolean(toggles[toggleKey])}
            onClick={(e) => {
              e.stopPropagation()
              if (disabled && (toggleKey === 'van' || toggleKey === 'giayBo') && toggles.vienFomex) {
                alert('⚠️ Không thể tắt Ván lót hoặc Giấy bo khi đang bật Nền trắng!');
                return;
              }
              if (!disabled) onToggleChange(toggleKey, !toggles[toggleKey])
            }}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              toggles[toggleKey] ? 'bg-[#ff4f25]' : 'bg-gray-300'
            } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                toggles[toggleKey] ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {toggles[toggleKey] && children && (
        <div className="p-3 bg-gray-50/60 border-t border-gray-100 rounded-b-lg">{children}</div>
      )}
    </div>
  )

  // 🌟 TÍNH TOÁN KHÓA GIẤY BO THEO KÍCH THƯỚC
  const w = Number(width || 0);
  const h = Number(height || 0);
  const isGiayBoDisabled = Math.min(w, h) > 75 || Math.max(w, h) > 105;
  const currentTier = String(selections.customTierOption || '1');
  
  // Khóa Ván lót và Giấy bo nếu Nền trắng (vienFomex) đang bật
  const isVanAndGiayBoLocked = Boolean(toggles.vienFomex);
  
  // Tự động tắt công tắc Giấy bo nếu kích thước bị vượt quá giới hạn
  useEffect(() => {
    if (isGiayBoDisabled && toggles.giayBo) {
      onToggleChange('giayBo', false);
    }
  }, [isGiayBoDisabled, toggles.giayBo, onToggleChange]);

  return (
    <div>
      {/* TÊN SẢN PHẨM */}
      <div className="mb-4">
        <label
          htmlFor="productName"
          className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 pl-1 transition-colors"
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
      <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2 shadow-sm mb-4">
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-1">
          Kích thước ngoài (cm)
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            <span className="text-xs font-bold text-gray-700 px-2">Rộng</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="0"
              value={width}
              onChange={(e) => onWidthChange(e.target.value)}
              className="w-1/2 bg-[#ff4f25] px-2 py-2 text-sm text-white placeholder:text-white/70 outline-none font-mono text-center font-bold"
            />
          </div>

          <div className="flex items-center justify-between bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            <span className="text-xs font-bold text-gray-700 px-2">Dài</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="0"
              value={height}
              onChange={(e) => onHeightChange(e.target.value)}
              className="w-1/2 bg-[#ff4f25] px-2 py-2 text-sm text-white placeholder:text-white/70 outline-none font-mono text-center font-bold"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">

        {/* 1. KHUNG */}
        <ToggleCard toggleKey="khung" label="Khung">
          <div className="flex flex-col gap-2.5">
            <LuxurySelect
              id="khungCategory"
              label="Loại khung"
              value={khungCategory}
              onChange={onKhungCategoryChange}
              options={filteredCategoryOptions}
            />
            <LuxurySelect
              id="khungType"
              label="Tên khung chi tiết"
              value={selections.khungType}
              onChange={(val) => onSelectionChange('khungType', val)}
              options={typeOptions.map(t => ({ value: t, label: formatDisplayName(t) }))}
            />

            {/* TÙY CHỌN RIÊNG CHO GỖ TỰ NHIÊN / COMPOSITE 2X3 */}
            {(khungCategory === 'Khung Gỗ Tự Nhiên' || khungCategory === 'Khung Composite 2x3') && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3 mt-1 shadow-sm">
                
                {/* Kiểu & Công tắc Nền trắng nằm chung 1 hàng */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                      Kiểu tùy chọn
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200/80 shadow-inner">
                      {[
                        { id: '1', label: '1 Khung' },
                        { id: '2', label: 'Khung che ổ điện' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onSelectionChange('customTierOption', item.id)}
                          className={`py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ease-out flex items-center justify-center gap-1.5 ${
                            currentTier === item.id
                              ? 'bg-[#ff4f25] text-white shadow-md shadow-[#ff4f25]/30 scale-100'
                              : 'text-gray-500 bg-transparent hover:text-gray-900 hover:bg-white/60 scale-95'
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CHỈ HIỆN CÔNG TẮC KHI CHỌN KIỂU 1 */}
                  {currentTier === '1' && (
                    <div className="shrink-0 pt-3">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 text-right">
                        Nền trắng
                      </label>
                      <div className="flex items-center justify-end h-[30px]">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={Boolean(toggles.vienFomex)}
                          onClick={() => {
                            const nextState = !toggles.vienFomex;
                            // 1. Bật/tắt công tắc nền trắng
                            onToggleChange('vienFomex', nextState);
                            
                            // 2. Tự động bật ván lót, giấy bo và mặc định chọn giấy bo trắng 0.8ly
                            if (nextState) {
                              onToggleChange('van', true);
                              onToggleChange('giayBo', true);
                              onSelectionChange('giayBoType', 'giay_bo_trang_0_8ly');
                            } else {
                              onToggleChange('van', false);
                              onToggleChange('giayBo', false);
                            }
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            toggles.vienFomex ? 'bg-[#ff4f25]' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              toggles.vienFomex ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* NỘI DUNG LƯU Ý CHO TỪNG KIỂU */}
                <div className="bg-amber-50 border border-amber-200/60 rounded-md p-2">
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    <span className="font-bold">Lưu ý ({currentTier === '1' ? '1 Khung' : 'Khung hộp đèn'}):</span>{' '}
                    {currentTier === '1' 
                      ? 'Áp dụng khung tranh bình thường, khi bật nền trắng sẽ tự động bật ván lót và giấy bo trắng 0.8ly.'
                      : 'Áp dụng sản phẩm khung hộp đèn, 2 khung ghép lại.'}
                  </p>
                </div>

              </div>
            )}

          </div>
        </ToggleCard>

        {/* 2. IN TRANH */}
        <ToggleCard toggleKey="tranhIn" label="In tranh" thumbnailKey={selections.tranhInType}>
          <LuxurySelect
            id="tranhInType"
            label="Loại tranh in"
            value={selections.tranhInType}
            onChange={(val) => onSelectionChange('tranhInType', val)}
            options={tranhInTypeOptions}
          />
          {renderYouTubeLink(tranhInYoutubeUrl)}
        </ToggleCard>

        {/* 3. MICA */}
        <ToggleCard
          toggleKey="micaKinh"
          label="Mica"
          thumbnailKey="kinh"
          caption={!toggles.micaKinh ? 'Mặc định Mica 2 ly' : null}
        >
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
              Số tấm
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onSelectionChange('micaSheets', n)}
                  className={`py-2 rounded-lg text-sm font-bold border transition-colors ${
                    Number(selections.micaSheets || 1) === n
                      ? 'bg-[#ff4f25] text-white border-transparent'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#ff4f25]'
                  }`}
                >
                  {n} tấm
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">Mặc định lấy giá Mica 2 ly từ DB.</p>
          </div>
        </ToggleCard>

        {/* 4. VÁN LÓT (Bị khóa khi Nền trắng đang bật) */}
        <ToggleCard
          toggleKey="van"
          label="Ván lót"
          thumbnailKey="van_4ly"
          caption={isVanAndGiayBoLocked ? "Đang bật tự động theo Nền trắng" : "Mặc định Ván 4 ly"}
          disabled={isVanAndGiayBoLocked}
        />

        {/* 5. GIẤY BO (Bị khóa khi quá khổ HOẶC Nền trắng đang bật) */}
        <ToggleCard 
          toggleKey="giayBo" 
          label="Giấy bo" 
          thumbnailKey={selections.giayBoType}
          disabled={isGiayBoDisabled || isVanAndGiayBoLocked} 
        >
          <div className="space-y-2.5">
            <div className="flex items-end gap-2">
              <div className="flex-1 min-w-0">
                <LuxurySelect
                  id="giayBoType"
                  label="Loại giấy bo"
                  value={selections.giayBoType}
                  onChange={(val) => onSelectionChange('giayBoType', val)}
                  options={giayBoTypeOptions}
                  disabled={isGiayBoDisabled || isVanAndGiayBoLocked}
                />
              </div>
              
              <div className="w-20 sm:w-24 shrink-0">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 truncate">
                  Số lượng
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={giayBoQuantity}
                  onChange={(e) => onGiayBoQuantityChange?.(e.target.value)}
                  disabled={isGiayBoDisabled || isVanAndGiayBoLocked} 
                  className="w-full h-[42px] bg-white border border-gray-200 rounded-lg px-2 text-sm outline-none focus:border-[#ff4f25] font-mono font-bold text-center transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
            </div>
            
            {isGiayBoDisabled ? (
              <p className="text-[11px] text-red-500 font-medium">
                Kích thước vượt quá khổ giấy bo tối đa (75x105 cm).
              </p>
            ) : giayBoSizeMatchLabel ? (
              <div className="bg-white rounded border border-gray-200 p-2.5 shadow-sm">
                <p className="text-[11px] text-gray-500">
                  Size áp dụng: <span className="font-bold text-gray-700">{giayBoSizeMatchLabel}</span>
                  {giayBoSizeMatchPrice > 0 ? (
                    <> - Giá: <span className="font-bold text-[#ff4f25]">{giayBoSizeMatchPrice.toLocaleString('vi-VN')} đ/tấm</span></>
                  ) : (
                    <> - Giá: <span className="font-bold text-red-500">0 đ (Kiểm tra lại DB hoặc useQuoteBuilder)</span></>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-amber-600">
                Chưa tìm được size giấy bo phù hợp trong DB cho kích thước này.
              </p>
            )}
            
            {renderYouTubeLink(giayBoYoutubeUrl)}
          </div>
        </ToggleCard>

        {/* 6. SẮT XI */}
        <ToggleCard toggleKey="satXi" label="Sắt xi" thumbnailKey="sat_xi" />

        {/* 7. SƠN */}
        <ToggleCard toggleKey="son" label="Sơn" thumbnailKey="son" />

        {/* 8. ĐÓNG GÓI */}
        <ToggleCard
          toggleKey="dongGoi"
          label="Đóng gói sản phẩm"
          thumbnailKey="dong_goi"
          caption={!toggles.dongGoi ? 'Khách mua lẻ ưu tiên chọn đóng gói' : 'Đã bọc chống sốc an toàn'}
        />

        {/* 9. HOÀN THIỆN SẢN PHẨM CỦA KHÁCH */}
        <ToggleCard
          toggleKey="hoanThien"
          label="Phí hoàn thiện sản phẩm của khách"
          caption={toggles.hoanThien ? 'Đã cộng thêm 30% vào tổng giá bán' 
            : 'Bật khi sản phẩm yêu cầu độ khó cao như (thiết kế khung riêng, đóng khung vật phẩm đặc biệt...)'}
        />
      </div>

      {/* SỐ LƯỢNG */}
      <div className="mt-5 pb-2">
        <label
          htmlFor="quantity"
          className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 pl-1"
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
          className="w-28 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-base outline-none focus:border-[#ff4f25] focus:ring-4 focus:ring-[#ff4f25]/15 font-mono font-bold text-gray-800 shadow-sm transition-all text-center"
        />
      </div>
    </div>
  )
}