import FormRow from './FormRow.jsx'
import OptionSelect from './OptionSelect.jsx'
import ProductNameCombobox from './ProductNameCombobox.jsx'

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
  const renderLeftThumbnail = (show, materialKey) => {
    const imgUrl = getMaterialImage ? getMaterialImage(materialKey) : '/images/default.png'
    return (
      <div className="w-16 shrink-0 flex items-center justify-start">
        {show ? (
          <div className="w-14 h-14 bg-white border border-line rounded-lg overflow-hidden shadow-sm flex items-center justify-center">
            <img src={imgUrl} alt={materialKey} className="w-full h-full object-cover" />
          </div>
        ) : null}
      </div>
    )
  }

  const renderToggleHeader = (key, label) => (
    <label className="bg-blueprint text-paper px-3 py-2.5 font-mono text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer select-none hover:bg-blueprint-light transition-colors m-0">
      <input
        type="checkbox"
        checked={toggles[key] || false}
        onChange={(e) => onToggleChange(key, e.target.checked)}
        className="w-4 h-4 cursor-pointer accent-amber"
      />
      <span>{label}</span>
    </label>
  )

  // 🌟 Hàm render link YouTube chuẩn giao diện
  const renderYouTubeLink = (url) => {
    if (!url) return null;
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="mt-2 text-xs font-mono font-semibold text-red-500 hover:text-red-400 flex items-center gap-1.5 transition-colors px-3 pb-2 inline-flex"
      >
        📺 Xem video sản phẩm trên YouTube
      </a>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <label
          htmlFor="productName"
          className="block font-mono text-xs uppercase tracking-widest text-blueprint-light mb-2"
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
  <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-3 shadow-md my-3">
  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
    Kích thước sản phẩm (cm)
  </div>

  <div className="space-y-2">
    {/* Hàng Rộng */}
    <div className="flex items-center justify-between bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
      <span className="text-sm font-medium text-gray-800 px-3">
        Kích thước ngoài - Rộng
      </span>
      <div className="w-1/2 bg-orange-500 flex items-center">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          placeholder="0"
          value={width}
          onChange={(e) => onWidthChange(e.target.value)}
          className="w-full bg-orange-500 px-3 py-2 text-sm text-white placeholder:text-white/70 outline-none font-mono text-center font-bold"
        />
      </div>
    </div>

    {/* Hàng Dài */}
    <div className="flex items-center justify-between bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
      <span className="text-sm font-medium text-gray-800 px-3">
        Kích thước ngoài - Dài
      </span>
      <div className="w-1/2 bg-orange-500 flex items-center">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          placeholder="0"
          value={height}
          onChange={(e) => onHeightChange(e.target.value)}
          className="w-full bg-orange-500 px-3 py-2 text-sm text-white placeholder:text-white/70 outline-none font-mono text-center font-bold"
        />
      </div>
    </div>
  </div>
</div>

      <div className="space-y-4">
        {/* 1. KHUNG */}
        <div className="flex items-start gap-3">
          <div className="w-16 shrink-0" />
          <div className="flex-1 rounded-lg border border-line overflow-hidden">
            {renderToggleHeader('khung', 'Khung')}
            {toggles.khung && (
              <>
                
                <FormRow label="Loại khung">
                  <div className="w-full py-1">
                    <select
                      value={selections.khungType}
                      onChange={(e) => onSelectionChange('khungType', e.target.value)}
                      className="w-full bg-transparent px-3 py-1.5 text-sm text-black outline-none font-mono cursor-pointer"
                    >
                      {khungTypeOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </FormRow>
              </>
            )}
          </div>
        </div>

        {/* 2. IN TRANH */}
        <div className="flex items-start gap-3">
          {renderLeftThumbnail(toggles.tranhIn, selections.tranhInType)}
          <div className="flex-1 rounded-lg border border-line overflow-hidden">
            {renderToggleHeader('tranhIn', 'In tranh')}
            {toggles.tranhIn && (
              <div className="flex flex-col">
                <OptionSelect
                  label="Loại tranh in"
                  value={selections.tranhInType}
                  options={tranhInTypeOptions}
                  onChange={(val) => onSelectionChange('tranhInType', val)}
                />
                {renderYouTubeLink(tranhInYoutubeUrl)}
              </div>
            )}
          </div>
        </div>

        {/* 3. KÍNH / MICA */}
        <div className="flex items-start gap-3">
          {renderLeftThumbnail(toggles.micaKinh, selections.micaKinhType)}
          <div className="flex-1 rounded-lg border border-line overflow-hidden">
            {renderToggleHeader('micaKinh', 'Kính / Mica')}
            {toggles.micaKinh && (
              <div className="flex flex-col">
                <OptionSelect
                  label="Loại Kính / Mica"
                  value={selections.micaKinhType}
                  options={glassMicaOptions}
                  onChange={(val) => onSelectionChange('micaKinhType', val)}
                />
                {renderYouTubeLink(glassMicaYoutubeUrl)}
              </div>
            )}
          </div>
        </div>

        {/* 4. VÁN LÓT */}
        <div className="flex items-start gap-3">
          {renderLeftThumbnail(toggles.van, selections.vanLy)}
          <div className="flex-1 rounded-lg border border-line overflow-hidden">
            {renderToggleHeader('van', 'Ván lót')}
            {toggles.van && (
              <div className="flex flex-col">
                <OptionSelect
                  label="Loại ván lót"
                  value={selections.vanLy}
                  options={vanTypeOptions}
                  onChange={(val) => onSelectionChange('vanLy', val)}
                />
                {renderYouTubeLink(vanYoutubeUrl)}
              </div>
            )}
          </div>
        </div>

        {/* 5. GIẤY BO */}
        <div className="flex items-start gap-3">
          {renderLeftThumbnail(toggles.giayBo, selections.giayBoType)}
          <div className="flex-1 rounded-lg border border-line overflow-hidden">
            {renderToggleHeader('giayBo', 'Giấy bo')}
            {toggles.giayBo && (
              <div className="flex flex-col">
                <OptionSelect
                  label="Loại giấy bo"
                  value={selections.giayBoType}
                  options={giayBoTypeOptions}
                  onChange={(val) => onSelectionChange('giayBoType', val)}
                />
                {renderYouTubeLink(giayBoYoutubeUrl)}
              </div>
            )}
          </div>
        </div>

        {/* 6. SẮT XI */}
        <div className="flex items-start gap-3">
          {renderLeftThumbnail(toggles.satXi, 'sat_xi')}
          <div className="flex-1 rounded-lg border border-line overflow-hidden">
            {renderToggleHeader('satXi', 'Sắt xi')}
          </div>
        </div>

        {/* 7. SƠN */}
        <div className="flex items-start gap-3">
          {renderLeftThumbnail(toggles.son, 'son')}
          <div className="flex-1 rounded-lg border border-line overflow-hidden">
            {renderToggleHeader('son', 'Sơn')}
          </div>
        </div>

        {/* 8. ĐÓNG GÓI */}
        <div className="flex items-start gap-3">
          {renderLeftThumbnail(toggles.dongGoi, 'dong_goi')}
          <div className="flex-1 rounded-lg border border-line overflow-hidden">
            {renderToggleHeader('dongGoi', 'Đóng gói')}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label
          htmlFor="quantity"
          className="block font-mono text-xs uppercase tracking-widest text-blueprint-light mb-2"
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
          className="w-full bg-white border-2 border-line focus:border-amber rounded-md py-2.5 px-3 outline-none transition-colors text-blueprint font-mono"
        />
      </div>
    </div>
  )
}