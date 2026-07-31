import FormRow from './FormRow.jsx'
import OptionSelect from './OptionSelect.jsx'
import ProductNameCombobox from './ProductNameCombobox.jsx'
import {
  khungTypeOptions,
  tranhInTypeOptions,
  micaKinhTypeOptions,
  micaKinhLyOptions,
  vanLyOptions,
  giayBoTypeOptions,
} from '../data/frameDefaults.js'

// Chế độ Custom: gom tất cả các trường chi tiết (khung, in tranh, mica/kính,
// ván, giấy bo, sắt xi, sơn...) — dùng khi báo giá cho sản phẩm bán lẻ khác
// loại, không theo mẫu khung tranh tiêu chuẩn. Trường "Mica" và "Kính" trước
// đây tách riêng nay đã được gộp làm một.
export default function CustomQuoteForm({
  productName,
  width,
  height,
  quantity,
  toggles,
  selections,
  productNameOptions,
  onProductNameChange,
  onSelectExistingProduct,
  onWidthChange,
  onHeightChange,
  onQuantityChange,
  onToggleChange,
  onSelectionChange,
}) {
  const kichThuocBaoGia =
    width && height ? `${Number(width)}x${Number(height)}` : '—'

  // Component tiện ích để render thanh tiêu đề chứa Checkbox
  const renderToggleHeader = (key, label) => (
    <label className="bg-blueprint text-paper px-3 py-2.5 font-mono text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer select-none hover:bg-blueprint-light transition-colors m-0">
      <input
        type="checkbox"
        checked={toggles[key]}
        onChange={(e) => onToggleChange(key, e.target.checked)}
        className="w-4 h-4 cursor-pointer accent-amber"
      />
      <span>{label}</span>
    </label>
  )

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

      <div className="space-y-6">
        {/* KHUNG */}
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('khung', 'Khung')}
          
          <FormRow label="Kích thước ngoài - Rộng (cm)" highlight>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="0"
              value={width}
              onChange={(e) => onWidthChange(e.target.value)}
              className="w-full h-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none font-mono"
            />
          </FormRow>
          <FormRow label="Kích thước ngoài - Dài (cm)" highlight>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="0"
              value={height}
              onChange={(e) => onHeightChange(e.target.value)}
              className="w-full h-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none font-mono"
            />
          </FormRow>

          {/* Khi tích chọn Khung thì mới hiện Loại Khung */}
          {toggles.khung && (
            <FormRow label="Loại khung">
              <OptionSelect
                id="khungType"
                value={selections.khungType}
                onChange={(v) => onSelectionChange('khungType', v)}
                options={khungTypeOptions}
              />
            </FormRow>
          )}
        </div>

        {/* IN TRANH */}
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('tranhIn', 'In tranh')}
          
          {/* Khi tích chọn In Tranh thì mới hiện các tùy chọn */}
          {toggles.tranhIn && (
            <>
              <FormRow label="Loại Tranh in">
                <OptionSelect
                  id="tranhInType"
                  value={selections.tranhInType}
                  onChange={(v) => onSelectionChange('tranhInType', v)}
                  options={tranhInTypeOptions}
                />
              </FormRow>
              <FormRow label="Kích thước tranh báo giá" readOnly>
                <span className="px-3 py-2 text-sm font-mono text-blueprint/70">
                  {kichThuocBaoGia}
                </span>
              </FormRow>
            </>
          )}
        </div>

        {/* MICA / KÍNH */}
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('micaKinh', 'Mica / Kính')}
          
          {toggles.micaKinh && (
            <>
              <FormRow label="Loại mica/kính">
                <OptionSelect
                  id="micaKinhType"
                  value={selections.micaKinhType}
                  onChange={(v) => onSelectionChange('micaKinhType', v)}
                  options={micaKinhTypeOptions}
                />
              </FormRow>
              
              {/* CÔNG THỨC MỚI: CHỈ HIỆN CHỌN LY NẾU TÊN KHÔNG CHỨA CHỮ "KÍNH" */}
              {!String(selections.micaKinhType).toLowerCase().includes('kính') && (
                <FormRow label="Ly">
                  <OptionSelect
                    id="micaKinhLy"
                    value={selections.micaKinhLy}
                    onChange={(v) => onSelectionChange('micaKinhLy', v)}
                    options={micaKinhLyOptions}
                  />
                </FormRow>
              )}
            </>
          )}
        </div>
        {/* VÁN */}
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('van', 'Ván lót')}
          
          {toggles.van && (
            <FormRow label="Ly">
              <OptionSelect
                id="vanLy"
                value={selections.vanLy}
                onChange={(v) => onSelectionChange('vanLy', v)}
                options={vanLyOptions}
              />
            </FormRow>
          )}
        </div>

        {/* GIẤY BO */}
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('giayBo', 'Giấy bo (matboard)')}
          
          {toggles.giayBo && (
            <FormRow label="Loại giấy bo">
              <OptionSelect
                id="giayBoType"
                value={selections.giayBoType}
                onChange={(v) => onSelectionChange('giayBoType', v)}
                options={giayBoTypeOptions}
              />
            </FormRow>
          )}
        </div>

        {/* SẮT XI */}
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('satXi', 'Sắt xi')}
          {/* Không có FormRow con, chỉ cần bật/tắt ở Header */}
        </div>

        {/* SƠN */}
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('son', 'Sơn')}
          {/* Không có FormRow con, chỉ cần bật/tắt ở Header */}
        </div>

        {/* ĐÓNG GÓI */}
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('dongGoi', 'Đóng gói')}
          {/* Không có FormRow con, chỉ cần bật/tắt ở Header */}
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