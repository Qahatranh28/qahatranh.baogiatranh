import { useState } from 'react'
import { formatVND } from '../utils/format.js'
import {
  frameComponentToggles,
  khungTypeOptions,
  tranhInTypeOptions,
  micaKinhTypeOptions,
  micaKinhLyOptions,
  vanLyOptions,
  giayBoTypeOptions,
  isNhomType,
  isKinhType,
  getTranhInTypeRate,
  micaTypeRates,
  vanTypeRates,
  giayBoTypeRates,
} from '../data/frameDefaults.js'
import { computeFrameCost } from '../utils/frameCosting.js'
import {
  khungCategoryOptions,
  khungTypesByCategory,
  getStandardSizeOptions,
  getKhungTypeRate,
} from '../data/khungCatalog.js'

// Đã ẩn đi 6 mục đầu (Khung, Tranh in, Mica, Kính, Ván, Giấy bo) theo yêu cầu
const SETTING_LABELS = [
  ['satXiPerM', 'Đơn giá sắt xi (VND/m)'],
  ['keGocPerBo', 'Đơn giá bộ ke góc (VND/bộ)'],
  ['mocTreoPerCai', 'Đơn giá móc treo (VND/cái)'],
  ['dayTreoPerM', 'Đơn giá dây treo (VND/m)'],
  ['dinhGhimPerCai', 'Đơn giá đinh/ghim/ốc vít (VND/cái)'],
  ['peCuonPerKg', 'Đơn giá Pe cuộn (VND/kg)'],
  ['xopBongKhiPerCay', 'Đơn giá xốp bóng khí (VND/cây)'],
  ['cartonPerKg', 'Đơn giá carton (VND/kg)'],
  ['bangKeoPerCay', 'Đơn giá băng keo trong (VND/cây)'],
  ['luongNhanCongPerGio', 'Lương nhân công (VND/giờ)'],
  ['tyLeSXC', 'Tỷ lệ chi phí SXC (%)'],
  ['haoHutKhung_cm', 'Hao hụt khung (cm)'],
  ['gioLam1mKhung', 'Số giờ làm 1m khung (giờ/m)'],
  ['gioLam1m2MicaKinhVan', 'Số giờ làm 1m² mica/kính/ván (giờ/m²)'],
  ['gioLam1m2GiayBo', 'Số giờ làm 1m² giấy bo (giờ/m²)'],
  ['gioSon1mKhung', 'Số giờ sơn 1m khung tranh (giờ/m)'],
  ['gioDongGoi1m2', 'Số giờ đóng gói (giờ/m²)'],
  ['markupPercent', 'Tỷ lệ lợi nhuận cộng vào giá bán khách (%)'],
]

export default function FrameCostCalculator({
  settings,
  updateSetting,
  resetSettings,
  standardPrices,
  updateStandardPrice,
  resetStandardPrices,
  typeRates,
  updateTypeRate,
  resetTypeRates,
}) {
  const [showSettings, setShowSettings] = useState(false)
  const [showStandardPrices, setShowStandardPrices] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(khungCategoryOptions[0])
  
  const [width, setWidth] = useState('80')
  const [height, setHeight] = useState('110')
  
  // State quản lý chi tiết loại vật tư đang chọn
  const [khungType, setKhungType] = useState(khungTypeOptions[0])
  const [tranhInType, setTranhInType] = useState(tranhInTypeOptions[0])
  const [micaKinhType, setMicaKinhType] = useState(micaKinhTypeOptions[0])
  const [micaKinhLy, setMicaKinhLy] = useState(micaKinhLyOptions[0])
  const [vanLy, setVanLy] = useState(vanLyOptions[0])
  const [giayBoType, setGiayBoType] = useState(giayBoTypeOptions[0])

  const [toggles, setToggles] = useState(() =>
    Object.fromEntries(frameComponentToggles.map((t) => [t.key, t.default]))
  )

  // Nhận diện tự động
  const isNhom = isNhomType(khungType)
  const isKinh = isKinhType(micaKinhType)

  const khungRate = getKhungTypeRate(khungType, settings.khungPerM)
  const tranhInRate = getTranhInTypeRate(tranhInType, settings.tranhInPerM2)

  const result = computeFrameCost(
    width,
    height,
    toggles,
    settings,
    isKinh, 
    khungRate,
    1,
    isNhom,
    tranhInRate
  )
  const allRows = [...result.materialRows, ...result.laborRows].filter(
    (row) => isNhom || !row.label.startsWith('Ke góc')
  )

  // Component tiện ích để render thanh tiêu đề chứa Checkbox
  const renderToggleHeader = (key, label) => (
    <label className="bg-blueprint text-paper px-3 py-2.5 font-mono text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer select-none m-0 hover:bg-blueprint-light transition-colors">
      <input
        type="checkbox"
        checked={toggles[key]}
        onChange={(e) => setToggles((prev) => ({ ...prev, [key]: e.target.checked }))}
        className="w-4 h-4 cursor-pointer accent-amber flex-shrink-0"
      />
      <span>{label}</span>
    </label>
  )

  return (
    <section className="bg-white rounded-2xl border border-amber/30 shadow-sm p-6 sm:p-8 mt-6">
      <div className="flex items-center justify-between gap-4 mb-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest bg-amber text-white px-2 py-0.5 rounded">
            Admin
          </span>
          <h2 className="font-display font-semibold text-lg text-blueprint">
            Công cụ tính giá thành khung tranh
          </h2>
        </div>
        <button
          onClick={() => setShowSettings((v) => !v)}
          className="text-sm text-blueprint/60 hover:text-blueprint underline underline-offset-2"
        >
          {showSettings ? 'Ẩn cài đặt mặc định' : 'Cài đặt mặc định'}
        </button>
      </div>
      <p className="text-sm text-blueprint-light mb-6">
        Chỉnh sửa các tùy chọn bên dưới để xem sự thay đổi giá vốn.
      </p>

      {showSettings && (
        <div className="bg-paper rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-blueprint/50">
              Giá trị mặc định (chỉnh sửa nếu cần)
            </p>
            <button
              onClick={resetSettings}
              className="text-xs text-red-600 hover:underline"
            >
              Khôi phục mặc định
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {SETTING_LABELS.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <label htmlFor={key} className="text-xs text-blueprint/70 flex-1">
                  {label}
                </label>
                <input
                  id={key}
                  type="number"
                  value={settings[key]}
                  onChange={(e) => updateSetting(key, Number(e.target.value))}
                  className="w-28 border border-line rounded-md px-2 py-1.5 text-sm outline-none focus:border-amber font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mb-1 mt-8">
        <h3 className="font-display font-semibold text-base text-blueprint">
          Giá bán mặc định – Khung tiêu chuẩn
        </h3>
        <button
          onClick={() => setShowStandardPrices((v) => !v)}
          className="text-sm text-blueprint/60 hover:text-blueprint underline underline-offset-2"
        >
          {showStandardPrices ? 'Ẩn bảng giá' : 'Sửa bảng giá'}
        </button>
      </div>
      <p className="text-sm text-blueprint-light mb-4">
        Gán giá bán mặc định cho từng cặp Loại khung + Kích thước — dùng ở chế
        độ "Khung tiêu chuẩn". Khi khách chọn đúng Loại khung + Kích thước đã
        có giá ở đây, hệ thống lấy đúng giá này (bỏ qua công thức tính theo
        chiều dài/chiều rộng ở trên). Để trống 1 ô nghĩa là ô đó tạm tính theo
        công thức + % lợi nhuận như bình thường.
      </p>

      {showStandardPrices && (
        <div className="bg-paper rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div className="flex flex-wrap gap-2">
              {khungCategoryOptions.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedCategory === category
                      ? 'bg-blueprint text-paper border-blueprint'
                      : 'border-line text-blueprint/60 hover:border-blueprint'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <button
              onClick={resetStandardPrices}
              className="text-xs text-red-600 hover:underline"
            >
              Khôi phục giá mặc định
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-blueprint/5 text-blueprint">
                  <th className="text-left font-mono text-xs uppercase tracking-widest px-3 py-2">
                    Loại khung
                  </th>
                  {getStandardSizeOptions(
                    (khungTypesByCategory[selectedCategory] || [])[0]
                  ).map((size) => (
                    <th
                      key={size.label}
                      className="text-right font-mono text-xs uppercase tracking-widest px-3 py-2"
                    >
                      {size.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(khungTypesByCategory[selectedCategory] || []).map((type) => (
                  <tr key={type} className="border-t border-line">
                    <td className="px-3 py-2 text-blueprint whitespace-nowrap">{type}</td>
                    {getStandardSizeOptions(type).map((size) => (
                      <td key={size.label} className="px-2 py-2 text-right">
                        <input
                          type="number"
                          value={standardPrices?.[type]?.[size.label] ?? ''}
                          onChange={(e) =>
                            updateStandardPrice(type, size.label, e.target.value)
                          }
                          placeholder="—"
                          className="w-24 border border-line rounded-md px-2 py-1.5 text-sm text-right outline-none focus:border-amber font-mono"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6 mb-8 mt-8">
        <div>
          <label className="block text-xs uppercase tracking-widest text-blueprint/50 mb-2">
            Chiều rộng (cm)
          </label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="w-full border-2 border-line focus:border-amber rounded-md px-3 py-2.5 outline-none transition-colors font-mono"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-blueprint/50 mb-2">
            Chiều dài (cm)
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-full border-2 border-line focus:border-amber rounded-md px-3 py-2.5 outline-none transition-colors font-mono"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="font-display font-semibold text-base text-blueprint">
          Chi tiết vật tư & Giá gốc
        </h3>
        <button
          onClick={resetTypeRates}
          className="text-xs text-red-600 hover:underline"
        >
          Khôi phục giá gốc mặc định
        </button>
      </div>
      <p className="text-sm text-blueprint-light mb-4">
        Bật/tắt các thành phần bên dưới để xem chi tiết chi phí. Bạn có thể thay đổi loại vật tư và chỉnh sửa <strong>Giá gốc</strong> trực tiếp tại các ô bên dưới.
      </p>

      <div className="space-y-4 mb-8">
        {/* KHUNG */}
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('khung', 'Khung')}
          {toggles.khung && (
            <div className="p-4 bg-white grid sm:grid-cols-2 gap-4 border-t border-line">
              <div>
                <label className="block text-xs text-blueprint/70 mb-1.5">Loại khung</label>
                <select
                  value={khungType}
                  onChange={(e) => setKhungType(e.target.value)}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber"
                >
                  {khungTypeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-blueprint/70 mb-1.5">
                  Giá gốc (VND/m){isNhom && <span className="text-amber"> · Nhôm</span>}
                </label>
                <input
                  type="number"
                  value={typeRates.khung[khungType] ?? ''}
                  placeholder={String(settings.khungPerM)}
                  onChange={(e) => updateTypeRate('khung', khungType, e.target.value)}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* IN TRANH */}
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('tranhIn', 'In tranh')}
          {toggles.tranhIn && (
            <div className="p-4 bg-white grid sm:grid-cols-2 gap-4 border-t border-line">
              <div>
                <label className="block text-xs text-blueprint/70 mb-1.5">Loại tranh in</label>
                <select
                  value={tranhInType}
                  onChange={(e) => setTranhInType(e.target.value)}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber"
                >
                  {tranhInTypeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-blueprint/70 mb-1.5">Giá gốc (VND/m²)</label>
                <input
                  type="number"
                  value={typeRates.tranhIn[tranhInType] ?? ''}
                  placeholder={String(settings.tranhInPerM2)}
                  onChange={(e) => updateTypeRate('tranhIn', tranhInType, e.target.value)}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* MICA / KÍNH */}
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('micaKinh', 'Mica / Kính')}
          {toggles.micaKinh && (
            <div className="p-4 bg-white grid sm:grid-cols-2 gap-4 border-t border-line">
              <div>
                <label className="block text-xs text-blueprint/70 mb-1.5">Loại mica/kính</label>
                <select
                  value={micaKinhType}
                  onChange={(e) => setMicaKinhType(e.target.value)}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber"
                >
                  {micaKinhTypeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              
              {!isKinh && (
                <div>
                  <label className="block text-xs text-blueprint/70 mb-1.5">Độ dày (Ly)</label>
                  <select
                    value={micaKinhLy}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMicaKinhLy(val);
                      // Tự động cập nhật giá gốc tương ứng khi đổi Ly
                      if (micaTypeRates[val]) updateSetting('micaPerM2', micaTypeRates[val]);
                    }}
                    className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber"
                  >
                    {micaKinhLyOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs text-blueprint/70 mb-1.5">Giá gốc (VND/m²)</label>
                <input
                  type="number"
                  value={isKinh ? settings.kinhPerM2 : settings.micaPerM2}
                  onChange={(e) => updateSetting(isKinh ? 'kinhPerM2' : 'micaPerM2', Number(e.target.value))}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* VÁN LÓT */}
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('van', 'Ván lót')}
          {toggles.van && (
            <div className="p-4 bg-white grid sm:grid-cols-2 gap-4 border-t border-line">
              <div>
                <label className="block text-xs text-blueprint/70 mb-1.5">Độ dày (Ly)</label>
                <select
                  value={vanLy}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVanLy(val);
                    // Tự động cập nhật giá gốc tương ứng khi đổi Ly
                    if (vanTypeRates[val]) updateSetting('vanPerM2', vanTypeRates[val]);
                  }}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber"
                >
                  {vanLyOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-blueprint/70 mb-1.5">Giá gốc (VND/m²)</label>
                <input
                  type="number"
                  value={settings.vanPerM2}
                  onChange={(e) => updateSetting('vanPerM2', Number(e.target.value))}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* GIẤY BO */}
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('giayBo', 'Giấy bo (matboard)')}
          {toggles.giayBo && (
            <div className="p-4 bg-white grid sm:grid-cols-2 gap-4 border-t border-line">
              <div>
                <label className="block text-xs text-blueprint/70 mb-1.5">Loại giấy bo</label>
                <select
                  value={giayBoType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGiayBoType(val);
                    // Tự động cập nhật giá gốc tương ứng khi đổi Loại
                    if (giayBoTypeRates[val]) updateSetting('giayBoPerM2', giayBoTypeRates[val]);
                  }}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber"
                >
                  {giayBoTypeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-blueprint/70 mb-1.5">Giá gốc (VND/m²)</label>
                <input
                  type="number"
                  value={settings.giayBoPerM2}
                  onChange={(e) => updateSetting('giayBoPerM2', Number(e.target.value))}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* SẮT XI, SƠN, ĐÓNG GÓI */}
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('satXi', 'Sắt xi')}
        </div>
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('son', 'Sơn')}
        </div>
        <div className="rounded-lg border border-line overflow-hidden">
          {renderToggleHeader('dongGoi', 'Đóng gói')}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm mb-4">
          <thead>
            <tr className="bg-blueprint/5 text-blueprint">
              <th className="text-left font-mono text-xs uppercase tracking-widest px-3 py-2">
                Khoản mục
              </th>
              <th className="text-left font-mono text-xs uppercase tracking-widest px-3 py-2">
                Đơn vị
              </th>
              <th className="text-right font-mono text-xs uppercase tracking-widest px-3 py-2">
                Số lượng
              </th>
              <th className="text-right font-mono text-xs uppercase tracking-widest px-3 py-2">
                Đơn giá
              </th>
              <th className="text-right font-mono text-xs uppercase tracking-widest px-3 py-2">
                Thành tiền
              </th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((row, i) => (
              <tr key={i} className="border-t border-line">
                <td className="px-3 py-2 text-blueprint">{row.label}</td>
                <td className="px-3 py-2 text-blueprint/60">{row.unit}</td>
                <td className="px-3 py-2 text-right font-mono text-blueprint/70">
                  {row.qty.toFixed(row.qty % 1 === 0 ? 0 : 2)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-blueprint/70">
                  {formatVND(row.unitPrice)}
                </td>
                <td className="px-3 py-2 text-right font-mono font-medium text-blueprint">
                  {formatVND(row.total)}
                </td>
              </tr>
            ))}
            <tr className="bg-amber/10 border-t-2 border-amber/40">
              <td colSpan={4} className="px-3 py-2 text-right font-medium text-blueprint">
                Tổng chi phí nguyên vật liệu trực tiếp
              </td>
              <td className="px-3 py-2 text-right font-mono font-bold text-blueprint">
                {formatVND(result.nvlTotal)}
              </td>
            </tr>
            <tr className="bg-amber/10 border-t border-amber/20">
              <td colSpan={4} className="px-3 py-2 text-right font-medium text-blueprint">
                Tổng chi phí nhân công trực tiếp
              </td>
              <td className="px-3 py-2 text-right font-mono font-bold text-blueprint">
                {formatVND(result.laborTotal)}
              </td>
            </tr>
            <tr className="bg-amber/10 border-t border-amber/20">
              <td colSpan={4} className="px-3 py-2 text-right font-medium text-blueprint">
                Chi phí sản xuất chung ({settings.tyLeSXC}% nhân công)
              </td>
              <td className="px-3 py-2 text-right font-mono font-bold text-blueprint">
                {formatVND(result.sxc)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-blueprint rounded-lg p-4 flex items-center justify-between mt-6">
        <span className="text-paper/70 font-medium">TỔNG GIÁ THÀNH (VND)</span>
        <span className="font-mono text-2xl font-bold text-amber">
          {formatVND(result.grandTotal)}
        </span>
      </div>
    </section>
  )
}