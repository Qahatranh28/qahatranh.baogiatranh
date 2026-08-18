import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  fetchMoebeFrameTypes,
  fetchMoebeSizes,
  filterMoebeSizesByFrame,
  formatMoebeSizeOption,
} from '../../services/moebeSizeService.js'
import { getTranhInDetail } from '../../services/tranhInService.js'
import { getGlassMicaDetail } from '../../services/glassMicaService.js'
import { computeFrameCost } from '../../utils/frameCosting.js'
import { getStaticFrameImage } from '../../utils/imageMapper.js'

const DEFAULT_TRANH_IN_ID = 'tranh_in_giay_my_thuat'
const DEFAULT_GLASS_ID = 'kinh'

export function useMoebeQuoteState({ settings, dbMaterialsList, canSeeCost }) {
  const [frameTypes, setFrameTypes] = useState([])
  const [allSizes, setAllSizes] = useState([])
  const [selectedFrameId, setSelectedFrameId] = useState(null)
  const [selectedSizeId, setSelectedSizeId] = useState(null)
  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [toggles, setToggles] = useState({ tranhIn: true, dongGoi: false })
  const [printWidth, setPrintWidth] = useState('')
  const [printHeight, setPrintHeight] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [types, sizes] = await Promise.all([fetchMoebeFrameTypes(), fetchMoebeSizes()])
        setFrameTypes(types)
        setAllSizes(sizes)
        if (types.length > 0) setSelectedFrameId(String(types[0].frame_id))
      } catch (err) {
        console.error('Lỗi tải dữ liệu Moebe:', err)
      }
    }
    load()
  }, [])

  const sizeOptions = useMemo(() => {
    const filtered = filterMoebeSizesByFrame(allSizes, selectedFrameId)
    return filtered.map(formatMoebeSizeOption)
  }, [allSizes, selectedFrameId])

  useEffect(() => {
    if (sizeOptions.length > 0 && !sizeOptions.some((s) => s.id === selectedSizeId)) {
      setSelectedSizeId(sizeOptions[0].id)
    }
  }, [sizeOptions, selectedSizeId])

  const selectedFrame = useMemo(
    () => frameTypes.find((f) => String(f.frame_id) === String(selectedFrameId)) || null,
    [frameTypes, selectedFrameId]
  )

  // Đổi loại khung → chọn lại size đầu tiên của khung đó
  useEffect(() => {
    if (sizeOptions.length > 0) {
      setSelectedSizeId(sizeOptions[0].id)
    }
  }, [selectedFrameId])

  const selectedSize = useMemo(
    () => sizeOptions.find((s) => s.id === selectedSizeId) || sizeOptions[0] || null,
    [sizeOptions, selectedSizeId]
  )

  useEffect(() => {
    if (selectedSize) {
      setPrintWidth(String(selectedSize.innerWidth || selectedSize.width))
      setPrintHeight(String(selectedSize.innerHeight || selectedSize.height))
    }
  }, [selectedSize?.id])

  const activeWidth = selectedSize?.width || 0
  const activeHeight = selectedSize?.height || 0
  const activeInnerWidth = selectedSize?.innerWidth || 0
  const activeInnerHeight = selectedSize?.innerHeight || 0

  const khungRate = Number(selectedFrame?.price_cost) || 0
  const glassMat = getGlassMicaDetail(DEFAULT_GLASS_ID, dbMaterialsList)
  const tranhInMat = getTranhInDetail(DEFAULT_TRANH_IN_ID, dbMaterialsList)

  const costResult = useMemo(() => {
    const base = computeFrameCost(
      activeWidth,
      activeHeight,
      { khung: true, micaKinh: true, tranhIn: false, dongGoi: toggles.dongGoi },
      settings,
      true,
      khungRate,
      1,
      true,
      0,
      '',
      glassMat.price,
      glassMat.label,
      0,
      '',
      0,
      '',
      0,
      '',
      'moebe',
      activeInnerWidth,
      activeInnerHeight,
      glassMat.price,
      glassMat.label,
      0,
      '',
      'nhom'
    )

    let extraPrintCost = 0
    let printArea = 0
    const materialRows = [...(base.materialRows || [])]

    if (toggles.tranhIn) {
      const pw = parseFloat(printWidth) || 0
      const ph = parseFloat(printHeight) || 0
      printArea = (pw * ph) / 10000
      extraPrintCost = printArea * tranhInMat.price
      if (extraPrintCost > 0) {
        materialRows.push({
          label: tranhInMat.label || 'In tranh',
          unit: 'm²',
          qty: printArea,
          unitPrice: tranhInMat.price,
          total: extraPrintCost,
        })
      }
    }

    return {
      ...base,
      materialRows,
      grandTotal: base.grandTotal + extraPrintCost,
      printCost: extraPrintCost,
      printArea,
    }
  }, [
    activeWidth,
    activeHeight,
    activeInnerWidth,
    activeInnerHeight,
    toggles,
    settings,
    khungRate,
    glassMat,
    tranhInMat,
    printWidth,
    printHeight,
  ])

  const unitPrice = useMemo(() => {
    if (!selectedSize) return 0
    if (toggles.tranhIn && selectedSize.pricePrint > 0) return selectedSize.pricePrint
    return selectedSize.price
  }, [selectedSize, toggles.tranhIn])

  const lineTotal = (parseInt(quantity, 10) || 0) * unitPrice

  const previewImage =
    selectedFrame?.image_url ||
    getStaticFrameImage(selectedFrame?.name, selectedSize?.label) ||
    '/images/placeholder.svg'

  const handleToggleChange = useCallback((key, value) => {
    setToggles((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => {
    setProductName('')
    setQuantity('1')
    setToggles({ tranhIn: true, dongGoi: false })
  }, [])

  const buildCartItem = useCallback(() => {
    const qty = parseInt(quantity, 10) || 1
    const name = productName.trim() || `Khung Moebe ${selectedFrame?.name || ''} ${selectedSize?.label || ''}`.trim()

    return {
      id: crypto.randomUUID(),
      name,
      mode: 'moebe',
      width: activeWidth,
      height: activeHeight,
      innerWidth: activeInnerWidth,
      innerHeight: activeInnerHeight,
      printWidth: parseFloat(printWidth) || 0,
      printHeight: parseFloat(printHeight) || 0,
      quantity: qty,
      toggles: { ...toggles, khung: true },
      selections: {
        khungType: selectedFrame?.name,
        frameId: selectedFrameId,
        sizeId: selectedSizeId,
        sizeLabel: selectedSize?.label,
      },
      unitPrice,
      lineTotal: unitPrice * qty,
      cost: costResult.grandTotal * qty,
      costBreakdown: costResult,
    }
  }, [
    quantity,
    productName,
    selectedFrame,
    selectedSize,
    activeWidth,
    activeHeight,
    activeInnerWidth,
    activeInnerHeight,
    printWidth,
    printHeight,
    toggles,
    selectedFrameId,
    selectedSizeId,
    unitPrice,
    costResult,
  ])

  const canAdd =
    activeWidth > 0 &&
    activeHeight > 0 &&
    (parseInt(quantity, 10) || 0) > 0 &&
    unitPrice > 0

  return {
    productName,
    setProductName,
    quantity,
    setQuantity,
    toggles,
    handleToggleChange,
    frameTypes,
    selectedFrameId,
    setSelectedFrameId,
    selectedFrame,
    sizeOptions,
    selectedSizeId,
    setSelectedSizeId,
    selectedSize,
    printWidth,
    setPrintWidth,
    printHeight,
    setPrintHeight,
    activeWidth,
    activeHeight,
    unitPrice,
    lineTotal,
    area: costResult.areaM2,
    costResult,
    costDisplay: canSeeCost ? costResult.grandTotal : null,
    previewImage,
    canAdd,
    reset,
    buildCartItem,
    tranhInLabel: tranhInMat.label,
  }
}
