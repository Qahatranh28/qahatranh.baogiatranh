import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { useProductCatalog } from '../hooks/useProductCatalog.js'
import { useStandardPrices } from '../hooks/useStandardPrices.js'
import { useMoebePrices } from '../hooks/useMoebePrices.js'
import { useJerseyPrices } from '../hooks/useJerseyPrices.js'
import MoebePriceTable, { JerseyPriceTable } from './admin/SpecialPriceTables.jsx'
import { parseDimensionsFromSizeName } from '../utils/sizeParsing.js'

export default function DefaultPricesPanel() {
  const { standardPrices: initialPrices } = useStandardPrices()

  const [localPrices, setLocalPrices] = useState({})
  const [localPrintPrices, setLocalPrintPrices] = useState({}) 
  const [savingPrices, setSavingPrices] = useState(false)
  const [savingPrintPrices, setSavingPrintPrices] = useState(false) 
  const [syncStatus, setSyncStatus] = useState('')
  const [syncPrintStatus, setSyncPrintStatus] = useState('')

  useEffect(() => {
    if (initialPrices) {
      setLocalPrices(initialPrices)
    }
  }, [initialPrices])

  const { categories, typesByCategory, getStandardSizesForType, rawSizes, refreshCatalog } = useProductCatalog()

  const handleLocalChange = (type, sizeLabel, value) => {
    const numValue = (value === '' || value === null || value === undefined) ? null : Number(value)
    setLocalPrices((prev) => ({
      ...prev,
      [type]: {
        ...(prev[type] || {}),
        [sizeLabel]: numValue,
      },
    }))
  }

  const handlePrintLocalChange = (type, sizeLabel, value) => {
    const numValue = (value === '' || value === null || value === undefined) ? null : Number(value)
    setLocalPrintPrices((prev) => ({
      ...prev,
      [type]: {
        ...(prev[type] || {}),
        [sizeLabel]: numValue,
      },
    }))
  }

  const handleSaveAllToDB = async () => {
    setSavingPrices(true)
    try {
      const { data: catalogData, error: catError } = await supabase
        .from('frame_catalog')
        .select('frame_id, name')

      if (catError) throw catError

      const nameToIdMap = {}
      catalogData.forEach((item) => {
        nameToIdMap[item.name] = item.frame_id
      })

      const upsertRows = []
      for (const [khungType, sizes] of Object.entries(localPrices)) {
        const frameId = nameToIdMap[khungType]
        if (!frameId) continue

        for (const [sizeLabel, price] of Object.entries(sizes)) {
          if (price !== null && price !== '' && price !== undefined) {
            const { width, height } = parseDimensionsFromSizeName(sizeLabel)
            upsertRows.push({
              frame_id: frameId,
              size_name: sizeLabel,
              width,
              height,
              price: Number(price),
            })
          }
        }
      }

      if (upsertRows.length === 0) {
        alert('Không có dữ liệu giá nào để lưu!')
        setSavingPrices(false)
        return
      }

      const { error: upsertError } = await supabase
        .from('frame_size')
        .upsert(upsertRows, { onConflict: ['frame_id', 'size_name'] })

      if (upsertError) throw upsertError

      setSyncStatus('Đã lưu ✓')
      setTimeout(() => setSyncStatus(''), 2500)
      alert('Đã lưu tất cả thay đổi bảng giá lên cơ sở dữ liệu thành công!')
    } catch (err) {
      console.error('Lỗi khi lưu bảng giá:', err.message)
      alert('Lỗi khi lưu: ' + err.message)
    } finally {
      setSavingPrices(false)
    }
  }

  const handleSavePrintPricesToDB = async () => {
    setSavingPrintPrices(true)
    try {
      const { data: catalogData, error: catError } = await supabase
        .from('frame_catalog')
        .select('frame_id, name')

      if (catError) throw catError

      const nameToIdMap = {}
      catalogData.forEach((item) => {
        nameToIdMap[item.name] = item.frame_id
      })

      const upsertRows = []
      for (const [khungType, sizes] of Object.entries(localPrintPrices)) {
        const frameId = nameToIdMap[khungType]
        if (!frameId) continue

        for (const [sizeLabel, pricePrint] of Object.entries(sizes)) {
          if (pricePrint !== null && pricePrint !== '' && pricePrint !== undefined) {
            upsertRows.push({
              frame_id: frameId,
              size_name: sizeLabel,
              price_print: Number(pricePrint),
            })
          }
        }
      }

      if (upsertRows.length === 0) {
        alert('Không có dữ liệu giá in tranh nào để lưu!')
        setSavingPrintPrices(false)
        return
      }

      const { error: upsertError } = await supabase
        .from('frame_size')
        .upsert(upsertRows, { onConflict: ['frame_id', 'size_name'] })

      if (upsertError) throw upsertError

      setSyncPrintStatus('Đã lưu ✓')
      setTimeout(() => setSyncPrintStatus(''), 2500)
      alert('Đã lưu bảng giá in tranh (price_print) lên cơ sở dữ liệu thành công!')
      await refreshCatalog()
    } catch (err) {
      console.error('Lỗi khi lưu giá in tranh:', err.message)
      alert('Lỗi khi lưu giá in tranh: ' + err.message)
    } finally {
      setSavingPrintPrices(false)
    }
  }

  const [showStandardPrices, setShowStandardPrices] = useState(false)
  const [showPrintPrices, setShowPrintPrices] = useState(false)
  const [showMoebePrices, setShowMoebePrices] = useState(false)
  const [showJerseyPrices, setShowJerseyPrices] = useState(false)

  const {
    frameTypes: moebeFrameTypes,
    sizes: moebeSizes,
    loading: loadingMoebePrices,
    saving: savingMoebePrices,
    updateLocalSize: updateMoebeLocal,
    saveAllToDB: saveMoebePrices,
  } = useMoebePrices()

  const {
    prices: jerseyPrices,
    loading: loadingJerseyPrices,
    saving: savingJerseyPrices,
    updateLocal: updateJerseyLocal,
    saveAllToDB: saveJerseyPrices,
  } = useJerseyPrices()

  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPrintCategory, setSelectedPrintCategory] = useState('')

  useEffect(() => {
    if (categories.length > 0) {
      if (!selectedCategory) setSelectedCategory(categories[0])
      if (!selectedPrintCategory) setSelectedPrintCategory(categories[0])
    }
  }, [categories, selectedCategory, selectedPrintCategory])

  const currentTypesForTable = typesByCategory[selectedCategory] || []
  
  // 🌟 Chỉ ẩn tiêu đề loại khung khăn lụa nếu hoàn toàn KHÔNG CÓ BẤT KỲ SIZE NÀO có dữ liệu price_print
  const currentPrintTypesForTable = useMemo(() => {
    const rawTypes = typesByCategory[selectedPrintCategory] || []
    return rawTypes.filter((type) => {
      const isSilkFrame = type.toLowerCase().includes('lụa') || type.toLowerCase().includes('silk') || selectedPrintCategory?.toLowerCase().includes('silk')
      if (!isSilkFrame) return true // Giữ nguyên các khung chuẩn khác

      const sizes = getStandardSizesForType(type) || []
      // Kiểm tra xem khung lụa này có ít nhất 1 size có giá in tranh hay không
      const hasAnyPrintPrice = sizes.some((s) => s.pricePrint !== null && s.pricePrint !== undefined && s.pricePrint !== '')
      return hasAnyPrintPrice // Nếu hoàn toàn không có thì ẩn tiêu đề dòng đó đi
    })
  }, [typesByCategory, selectedPrintCategory, getStandardSizesForType])

  const tableColumns = useMemo(() => {
    if (currentTypesForTable.length === 0) return []
    const sizesMap = new Map()

    currentTypesForTable.forEach((type) => {
      const sizes = getStandardSizesForType(type) || []
      sizes.forEach((sizeObj) => {
        if (!sizesMap.has(sizeObj.label)) {
          sizesMap.set(sizeObj.label, sizeObj)
        }
      })
    })

    return Array.from(sizesMap.values())
  }, [currentTypesForTable, getStandardSizesForType])

  const tablePrintColumns = useMemo(() => {
    if (currentPrintTypesForTable.length === 0) return []
    const sizesMap = new Map()

    currentPrintTypesForTable.forEach((type) => {
      const sizes = getStandardSizesForType(type) || []
      sizes.forEach((sizeObj) => {
        if (!sizesMap.has(sizeObj.label)) {
          sizesMap.set(sizeObj.label, sizeObj)
        }
      })
    })

    return Array.from(sizesMap.values())
  }, [currentPrintTypesForTable, getStandardSizesForType])

  return (
    <section className="bg-white rounded-2xl border border-amber/30 shadow-sm p-6 sm:p-8 mt-6">
      <div className="flex items-center justify-between gap-4 mb-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest bg-[#ff4f25] text-white px-2 py-0.5 rounded">
            Admin
          </span>
          <h2 className="font-display font-semibold text-lg text-blueprint">
            Giá bán mặc định — Giao diện báo giá
          </h2>
        </div>
        {syncStatus && (
          <span className="text-xs font-mono text-amber animate-pulse">{syncStatus}</span>
        )}
      </div>
      <p className="text-sm text-blueprint-light mb-6">
        Gán/sửa giá bán mặc định dùng ở giao diện báo giá cho khách. Muốn chỉnh chi tiết vật tư & giá
        vốn, vào Sidebar &gt; "Công cụ tính giá thành".
      </p>

      {/* Bảng giá tiêu chuẩn */}
      <div className="flex items-center justify-between gap-4 mb-1 mt-2">
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
        Gán giá bán mặc định cho từng cặp Loại khung + Kích thước.
      </p>

      {showStandardPrices && (
        <div className="bg-paper rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
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
              onClick={handleSaveAllToDB}
              disabled={savingPrices}
              className="bg-amber text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-amber/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {savingPrices ? 'Đang lưu lên DB...' : 'Lưu tất cả thay đổi lên DB'}
            </button>
          </div>

          <div className="overflow-x-auto relative border border-line rounded-lg max-h-[600px] shadow-sm">
            <table className="w-full min-w-[640px] text-sm border-collapse">
              <thead>
                <tr className="bg-blueprint/5 text-blueprint">
                  <th className="sticky left-0 z-20 bg-white text-left font-mono text-xs uppercase tracking-widest px-4 py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)] border-b border-line">
                    Loại khung
                  </th>
                  {tableColumns.map((size) => (
                    <th
                      key={size.label}
                      className="text-right font-mono text-xs uppercase tracking-widest px-3 py-3 whitespace-nowrap border-b border-line"
                    >
                      {size.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {currentTypesForTable.map((type) => {
                  const validSizes = getStandardSizesForType(type)

                  return (
                    <tr key={type} className="border-b border-line hover:bg-gray-50 transition-colors">
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 text-blueprint whitespace-nowrap font-medium shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                        {type}
                      </td>
                      {tableColumns.map((size) => {
                        const matchedSizeObj = validSizes.find((s) => s.label === size.label)
                        const isValidSize = !!matchedSizeObj
                        const cellKey = `${type}-${size.label}`
                        
                        const displayVal = localPrices?.[type]?.[size.label] !== undefined 
                          ? localPrices?.[type]?.[size.label] 
                          : (matchedSizeObj?.price ?? '')

                        return (
                          <td key={cellKey} className="px-2 py-2 text-right">
                            {isValidSize ? (
                              <input
                                type="number"
                                value={displayVal}
                                onChange={(e) => handleLocalChange(type, size.label, e.target.value)}
                                placeholder="—"
                                className="w-24 border border-line rounded-md px-2 py-1.5 text-sm text-right outline-none focus:border-amber font-mono bg-white"
                              />
                            ) : (
                              <div className="w-24 mx-auto text-gray-400 text-xs flex items-center justify-center bg-gray-50 h-8 rounded-md border border-transparent select-none">
                                —
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BẢNG GIÁ IN TRANH (price_print) */}
      <div className="flex items-center justify-between gap-4 mb-1 mt-8">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-semibold text-base text-blueprint">
            Giá bán kèm In tranh (Price Print) – Khung tiêu chuẩn
          </h3>
          {syncPrintStatus && (
            <span className="text-xs font-mono text-amber animate-pulse">{syncPrintStatus}</span>
          )}
        </div>
        <button
          onClick={() => setShowPrintPrices((v) => !v)}
          className="text-sm text-blueprint/60 hover:text-blueprint underline underline-offset-2"
        >
          {showPrintPrices ? 'Ẩn bảng giá in' : 'Sửa giá in tranh'}
        </button>
      </div>
      <p className="text-sm text-blueprint-light mb-4">
        Gán giá bán kèm theo dịch vụ in tranh cho từng kích thước của khung tiêu chuẩn.
      </p>

      {showPrintPrices && (
        <div className="bg-paper rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedPrintCategory(category)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedPrintCategory === category
                      ? 'bg-blueprint text-paper border-blueprint'
                      : 'border-line text-blueprint/60 hover:border-blueprint'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <button
              onClick={handleSavePrintPricesToDB}
              disabled={savingPrintPrices}
              className="bg-amber text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-amber/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {savingPrintPrices ? 'Đang lưu giá in...' : 'Lưu giá in tranh lên DB'}
            </button>
          </div>

          <div className="overflow-x-auto relative border border-line rounded-lg max-h-[600px] shadow-sm">
            <table className="w-full min-w-[640px] text-sm border-collapse">
              <thead>
                <tr className="bg-blueprint/5 text-blueprint">
                  <th className="sticky left-0 z-20 bg-white text-left font-mono text-xs uppercase tracking-widest px-4 py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)] border-b border-line">
                    Loại khung
                  </th>
                  {tablePrintColumns.map((size) => (
                    <th
                      key={size.label}
                      className="text-right font-mono text-xs uppercase tracking-widest px-3 py-3 whitespace-nowrap border-b border-line"
                    >
                      {size.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {currentPrintTypesForTable.map((type) => {
                  const validSizes = getStandardSizesForType(type)

                  return (
                    <tr key={type} className="border-b border-line hover:bg-gray-50 transition-colors">
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 text-blueprint whitespace-nowrap font-medium shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                        {type}
                      </td>
                      {tablePrintColumns.map((size) => {
                        const matchedSizeObj = validSizes.find((s) => s.label === size.label)
                        const isValidSize = !!matchedSizeObj
                        const cellKey = `print-${type}-${size.label}`

                        const displayVal = localPrintPrices?.[type]?.[size.label] !== undefined
                          ? localPrintPrices?.[type]?.[size.label]
                          : (matchedSizeObj?.pricePrint ?? '')

                        return (
                          <td key={cellKey} className="px-2 py-2 text-right">
                            {isValidSize ? (
                              <input
                                type="number"
                                value={displayVal}
                                onChange={(e) => handlePrintLocalChange(type, size.label, e.target.value)}
                                placeholder="—"
                                className="w-24 border border-line rounded-md px-2 py-1.5 text-sm text-right outline-none focus:border-amber font-mono bg-white"
                              />
                            ) : (
                              <div className="w-24 mx-auto text-gray-400 text-xs flex items-center justify-center bg-gray-50 h-8 rounded-md border border-transparent select-none">
                                —
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bảng giá Khung Moebe */}
      <div className="flex items-center justify-between gap-4 mb-1 mt-8">
        <h3 className="font-display font-semibold text-base text-blueprint">
          Giá bán mặc định – Khung Moebe
        </h3>
        <button
          onClick={() => setShowMoebePrices((v) => !v)}
          className="text-sm text-blueprint/60 hover:text-blueprint underline underline-offset-2"
        >
          {showMoebePrices ? 'Ẩn bảng giá' : 'Sửa bảng giá'}
        </button>
      </div>
      <p className="text-sm text-blueprint-light mb-4">
        Giá bán theo size được lấy từ web.
      </p>
      {showMoebePrices && (
        <MoebePriceTable
          frameTypes={moebeFrameTypes}
          sizes={moebeSizes}
          onUpdate={updateMoebeLocal}
          onSave={saveMoebePrices}
          saving={savingMoebePrices}
          loading={loadingMoebePrices}
        />
      )}

      {/* Bảng giá Khung áo đấu */}
      <div className="flex items-center justify-between gap-4 mb-1 mt-8">
        <h3 className="font-display font-semibold text-base text-blueprint">
          Giá bán mặc định – Khung áo đấu
        </h3>
        <button
          onClick={() => setShowJerseyPrices((v) => !v)}
          className="text-sm text-blueprint/60 hover:text-blueprint underline underline-offset-2"
        >
          {showJerseyPrices ? 'Ẩn bảng giá' : 'Sửa bảng giá'}
        </button>
      </div>
      <p className="text-sm text-blueprint-light mb-4">
        Giá bán theo size áo từ bảng canva.
      </p>
      {showJerseyPrices && (
        <JerseyPriceTable
          prices={jerseyPrices}
          onUpdate={updateJerseyLocal}
          onSave={saveJerseyPrices}
          saving={savingJerseyPrices}
          loading={loadingJerseyPrices}
        />
      )}
    </section>
  )
}