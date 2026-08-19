import { useState, useEffect, useMemo } from 'react'
import { formatVND } from '../utils/format.js'
import { supabase } from '../supabaseClient'
import {
  frameComponentToggles,
  micaKinhTypeOptions,
  micaKinhLyOptions,
  vanLyOptions,
  giayBoTypeOptions,
  isNhomType,
  isKinhType,
  micaTypeRates,
  vanTypeRates,
  giayBoTypeRates,
} from '../data/frameDefaults.js'
import { computeFrameCost } from '../utils/frameCosting.js'
import { useProductCatalog } from '../hooks/useProductCatalog.js'

// 🌟 CHỈ GIỮ LAI 9 MỤC VẬT TƯ CÓ TRÊN DATABASE (BẢNG material)
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
]

// 🌟 Từ nay component này KHÔNG còn chứa 3 bảng "Giá bán mặc định" (Khung
// tiêu chuẩn / Moebe / Áo đấu) nữa — 3 bảng đó đã chuyển sang
// DefaultPricesPanel.jsx và vẫn hiển thị ngay trên giao diện báo giá chính.
// Component này (phần còn lại của "Công cụ tính giá thành khung tranh") giờ
// chỉ mở được qua nút "Công cụ tính giá thành" ở Sidebar, nằm dưới nút
// "Tạo tài khoản hệ thống".
export default function FrameCostCalculator({
  settings,
  updateSetting,
  resetSettings,
  typeRates,
  updateTypeRate,
  resetTypeRates,
}) {
  const [savingSettings, setSavingSettings] = useState(false)

  // 🌟 HÀM LƯU 9 ĐƠN GIÁ VẬT TƯ TRỰC TIẾP LÊN BẢNG material TRÊN SUPABASE
  const handleSaveSettingsToDB = async () => {
    setSavingSettings(true)
    try {
      const materialMapping = [
        { key: 'satXiPerM', id: 'sat_xi' },
        { key: 'keGocPerBo', id: 'ke_goc' },
        { key: 'mocTreoPerCai', id: 'moc_treo' },
        { key: 'dayTreoPerM', id: 'day_treo' },
        { key: 'dinhGhimPerCai', id: 'dinh_ghim' },
        { key: 'peCuonPerKg', id: 'pe_cuon' },
        { key: 'xopBongKhiPerCay', id: 'xop_bong_khi' },
        { key: 'cartonPerKg', id: 'carton' },
        { key: 'bangKeoPerCay', id: 'bang_keo' },
      ]

      const updatePromises = materialMapping.map(({ key, id }) => {
        const val = Number(settings[key]) || 0
        return supabase
          .from('material')
          .update({ price_cost: val })
          .eq('id_material', id)
      })

      const results = await Promise.all(updatePromises)
      const hasError = results.some((res) => res.error)

      if (hasError) {
        throw new Error('Có lỗi xảy ra khi lưu một số vật tư!')
      }

      setSyncStatus('Đã lưu vật tư ✓')
      setTimeout(() => setSyncStatus(''), 2500)
      alert('Đã lưu thành công các đơn giá vật tư lên cơ sở dữ liệu!')
    } catch (err) {
      console.error('Lỗi khi lưu đơn giá vật tư:', err.message)
      alert('Lỗi khi lưu: ' + err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  const [showSettings, setShowSettings] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')

  const { typesByCategory, rawCatalog, updateFrameCostRate } = useProductCatalog()

  const [width, setWidth] = useState('80')
  const [height, setHeight] = useState('110')
  
  const [khungType, setKhungType] = useState('')
  const [tranhInType, setTranhInType] = useState('')
  const [micaKinhType, setMicaKinhType] = useState(micaKinhTypeOptions[0])
  const [micaKinhLy, setMicaKinhLy] = useState(micaKinhLyOptions[0])
  const [vanLy, setVanLy] = useState(vanLyOptions[0])
  const [giayBoType, setGiayBoType] = useState(giayBoTypeOptions[0])

  const [toggles, setToggles] = useState(() =>
    Object.fromEntries(frameComponentToggles.map((t) => [t.key, t.default]))
  )

  const allKhungTypes = Object.values(typesByCategory).flat()
  const allTranhInTypes = Object.keys(typeRates?.tranhIn || {})

  useEffect(() => {
    if (allKhungTypes.length > 0 && !khungType) setKhungType(allKhungTypes[0])
  }, [allKhungTypes, khungType])

  useEffect(() => {
    if (allTranhInTypes.length > 0 && !tranhInType) setTranhInType(allTranhInTypes[0])
  }, [allTranhInTypes, tranhInType])

  const isNhom = khungType ? isNhomType(khungType) : false
  const isKinh = isKinhType(micaKinhType)

  const khungRate = typeRates?.khung?.[khungType] ?? settings.khungPerM
  const tranhInRate = typeRates?.tranhIn?.[tranhInType] ?? settings.tranhInPerM2

  const syncMaterialToDatabase = async (materialId, priceValue) => {
    try {
      setSyncStatus('Đang lưu DB...')
      const { error } = await supabase
        .from('material')
        .update({ price_cost: Number(priceValue) })
        .eq('id_material', materialId)

      if (error) throw error
      setSyncStatus('Đã lưu DB ✓')
      setTimeout(() => setSyncStatus(''), 2500)
    } catch (err) {
      console.error('Lỗi đồng bộ DB:', err.message)
      setSyncStatus('Lỗi lưu DB!')
      setTimeout(() => setSyncStatus(''), 2500)
    }
  }

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
        <div className="flex items-center gap-3">
          {syncStatus && (
            <span className="text-xs font-mono text-amber animate-pulse">
              {syncStatus}
            </span>
          )}
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="text-sm text-blueprint/60 hover:text-blueprint underline underline-offset-2"
          >
            {showSettings ? 'Ẩn cài đặt mặc định' : 'Cài đặt mặc định'}
          </button>
        </div>
      </div>
      <p className="text-sm text-blueprint-light mb-6">
        Chỉnh sửa các tùy chọn bên dưới để xem sự thay đổi giá vốn.
      </p>

      {/* 🌟 PHẦN CÀI ĐẶT MẶC ĐỊNH ĐÃ ĐƯỢC LỌC CHỈ CÒN 9 MỤC CÓ TRÊN DATABASE */}
      {showSettings && (
        <div className="bg-paper rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <p className="text-xs uppercase tracking-widest text-blueprint/50">
              Đơn giá vật tư mặc định (lưu trực tiếp lên DB)
            </p>
            <button
              onClick={handleSaveSettingsToDB}
              disabled={savingSettings}
              className="bg-amber text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-amber/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {savingSettings ? 'Đang lưu lên DB...' : 'Lưu đơn giá vật tư lên DB'}
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
                  value={settings[key] ?? ''}
                  onChange={(e) => updateSetting(key, Number(e.target.value))}
                  className="w-28 border border-line rounded-md px-2 py-1.5 text-sm outline-none focus:border-amber font-mono"
                />
              </div>
            ))}
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
        <button onClick={resetTypeRates} className="text-xs text-red-600 hover:underline">
          Khôi phục giá gốc mặc định
        </button>
      </div>
      <p className="text-sm text-blueprint-light mb-4">
        Bật/tắt các thành phần bên dưới để xem chi tiết chi phí. Nhập giá mới và bấm nút Lưu để cập nhật.
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
                  {allKhungTypes.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-blueprint/70 mb-1.5">
                  Giá gốc (VND/m){isNhom && <span className="text-amber"> · Nhôm</span>}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={
                      rawCatalog.find((c) => c.name === khungType)?.price_cost ??
                      typeRates?.khung?.[khungType] ??
                      settings.khungPerM
                    }
                    onChange={(e) => {
                      const val = e.target.value
                      updateTypeRate('khung', khungType, val)
                    }}
                    className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const currentVal = rawCatalog.find((c) => c.name === khungType)?.price_cost ?? typeRates?.khung?.[khungType] ?? settings.khungPerM
                      updateFrameCostRate(khungType, currentVal)
                      setSyncStatus('Đã lưu khung ✓')
                      setTimeout(() => setSyncStatus(''), 2500)
                    }}
                    className="bg-amber text-white px-3 py-2 rounded text-xs font-medium hover:bg-amber/90 whitespace-nowrap"
                  >
                    Lưu
                  </button>
                </div>
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
                  {allTranhInTypes.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-blueprint/70 mb-1.5">Giá gốc (VND/m²)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={typeRates?.tranhIn?.[tranhInType] ?? ''}
                    placeholder={String(settings.tranhInPerM2)}
                    onChange={(e) => {
                      updateTypeRate('tranhIn', tranhInType, e.target.value)
                    }}
                    className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => syncMaterialToDatabase('tranh_in', typeRates?.tranhIn?.[tranhInType] || settings.tranhInPerM2)}
                    className="bg-amber text-white px-3 py-2 rounded text-xs font-medium hover:bg-amber/90 whitespace-nowrap"
                  >
                    Lưu
                  </button>
                </div>
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
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={isKinh ? settings.kinhPerM2 : settings.micaPerM2}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      updateSetting(isKinh ? 'kinhPerM2' : 'micaPerM2', val)
                    }}
                    className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => syncMaterialToDatabase(isKinh ? 'kinh' : 'mica', isKinh ? settings.kinhPerM2 : settings.micaPerM2)}
                    className="bg-amber text-white px-3 py-2 rounded text-xs font-medium hover:bg-amber/90 whitespace-nowrap"
                  >
                    Lưu
                  </button>
                </div>
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
                    if (vanTypeRates[val]) updateSetting('vanPerM2', vanTypeRates[val]);
                  }}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber"
                >
                  {vanLyOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-blueprint/70 mb-1.5">Giá gốc (VND/m²)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.vanPerM2}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      updateSetting('vanPerM2', val)
                    }}
                    className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => syncMaterialToDatabase('van_lot', settings.vanPerM2)}
                    className="bg-amber text-white px-3 py-2 rounded text-xs font-medium hover:bg-amber/90 whitespace-nowrap"
                  >
                    Lưu
                  </button>
                </div>
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
                    if (giayBoTypeRates[val]) updateSetting('giayBoPerM2', giayBoTypeRates[val]);
                  }}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber"
                >
                  {giayBoTypeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-blueprint/70 mb-1.5">Giá gốc (VND/m²)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.giayBoPerM2}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      updateSetting('giayBoPerM2', val)
                    }}
                    className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-amber font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => syncMaterialToDatabase('giay_bo', settings.giayBoPerM2)}
                    className="bg-amber text-white px-3 py-2 rounded text-xs font-medium hover:bg-amber/90 whitespace-nowrap"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CÁC THÀNH PHẦN KHÁC */}
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