import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  fetchMoebeFrameTypes,
  fetchMoebeSizes,
  filterMoebeSizesByFrame,
  formatMoebeSizeOption,
} from '../../services/moebeSizeService.js'
import { getTranhInDetail } from '../../services/tranhInService.js'
import { getMica2LiDetail } from '../../services/glassMicaService.js'
import { computeFrameCost } from '../../utils/frameCosting.js'
import { getStaticFrameImage } from '../../utils/imageMapper.js'
import { findRoundUpStandardSize } from '../../config/quoteDefaults.js'

const DEFAULT_TRANH_IN_ID = 'tranh_in_giay_my_thuat'

export function useMoebeQuoteState({ settings, dbMaterialsList, canSeeCost }) {
  const [frameTypes, setFrameTypes] = useState([])
  const [allSizes, setAllSizes] = useState([])
  const [selectedFrameId, setSelectedFrameId] = useState(null)
  const [selectedSizeId, setSelectedSizeId] = useState(null)
  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [toggles, setToggles] = useState({ tranhIn: true, dongGoi: true })
  const [printWidth, setPrintWidth] = useState('')
  const [printHeight, setPrintHeight] = useState('')

  // 🌟 State mới hỗ trợ Size lẻ
  const [isOddSize, setIsOddSize] = useState(false)
  const [oddWidth, setOddWidth] = useState('')
  const [oddHeight, setOddHeight] = useState('')

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
    if (selectedSize && !isOddSize) {
      setPrintWidth(String(selectedSize.innerWidth || selectedSize.width))
      setPrintHeight(String(selectedSize.innerHeight || selectedSize.height))
    }
  }, [selectedSize?.id, isOddSize])

  // 🌟 Xác định kích thước hoạt động dựa trên việc chọn Size chuẩn hay Size lẻ
  const activeWidth = isOddSize ? parseFloat(oddWidth) || 0 : (selectedSize?.width || 0)
  const activeHeight = isOddSize ? parseFloat(oddHeight) || 0 : (selectedSize?.height || 0)
  const activeInnerWidth = isOddSize ? activeWidth : (selectedSize?.innerWidth || 0)
  const activeInnerHeight = isOddSize ? activeHeight : (selectedSize?.innerHeight || 0)

  // 🌟 Size lẻ (giống Khung tiêu chuẩn): khi bật, vẫn ÁP GIÁ theo size khung
  // chuẩn lớn hơn gần nhất (không lấy đúng size chuẩn nào chứa vừa size lẻ,
  // cho phép xoay ngang/dọc) trong danh sách size của khung Moebe đang chọn.
  const oddSizeMatch = useMemo(() => {
    if (!isOddSize) return null
    return findRoundUpStandardSize(sizeOptions, activeWidth, activeHeight)
  }, [isOddSize, sizeOptions, activeWidth, activeHeight])

  // 🌟 Xử lý chuyển đổi bật/tắt size lẻ
  const handleToggleOddSize = useCallback((value) => {
    setIsOddSize(value)
    if (value) {
      // Khi bật size lẻ, mặc định lấy width/height của size chuẩn hiện tại làm mốc
      if (selectedSize) {
        setOddWidth(String(selectedSize.width || ''))
        setOddHeight(String(selectedSize.height || ''))
      }
    }
  }, [selectedSize])

  // 🌟 Kích tranh in không được vượt quá kích thước khung đã chọn (phủ bì).
  const handlePrintWidthChange = useCallback(
    (value) => {
      if (value === '') {
        setPrintWidth('')
        return
      }
      const num = parseFloat(value)
      if (Number.isNaN(num)) {
        setPrintWidth(value)
        return
      }
      const max = activeWidth > 0 ? activeWidth : Infinity
      setPrintWidth(String(Math.min(num, max)))
    },
    [activeWidth]
  )

  const handlePrintHeightChange = useCallback(
    (value) => {
      if (value === '') {
        setPrintHeight('')
        return
      }
      const num = parseFloat(value)
      if (Number.isNaN(num)) {
        setPrintHeight(value)
        return
      }
      const max = activeHeight > 0 ? activeHeight : Infinity
      setPrintHeight(String(Math.min(num, max)))
    },
    [activeHeight]
  )

  const khungRate = Number(selectedFrame?.price_cost) || 0
  // 🌟 Mặc định vật tư mặt kính/mica của Moebe: Mica 2 ly lấy giá từ DB (thay "Kính").
  const glassMat = getMica2LiDetail(dbMaterialsList)
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

  // 🌟 Tính đơn giá thông minh:
  // - Size chuẩn: ưu tiên giá DB (price/pricePrint), fallback công thức x1.2.
  // - Size lẻ: LẤY GIÁ theo size khung chuẩn LỚN HƠN gần nhất (oddSizeMatch) —
  //   giống hệt cách "Khung tiêu chuẩn" xử lý Size lẻ. Nếu không có size chuẩn
  //   nào đủ lớn (khách đặt vượt size lớn nhất), tạm tính theo giá vốn + markup
  //   (như Custom), thay vì công thức tỉ lệ diện tích cũ.
  const unitPrice = useMemo(() => {
    if (isOddSize) {
      if (oddSizeMatch) {
        if (toggles.tranhIn && oddSizeMatch.pricePrint > 0) return oddSizeMatch.pricePrint
        if (oddSizeMatch.price > 0) return oddSizeMatch.price
      }
      // Chưa có size chuẩn nào đủ lớn phù hợp — tạm tính theo giá vốn + markup.
      return Math.round(costResult.grandTotal / 0.35)
    }

    if (!selectedSize) return 0

    // KHI KHÁCH CÓ CHỌN IN TRANH (Áp dụng Fallback Pricing)
    if (toggles.tranhIn) {
      if (selectedSize.pricePrint && selectedSize.pricePrint > 0) {
        return selectedSize.pricePrint
      }
      if (selectedSize.price && selectedSize.price > 0) {
        return Math.ceil((selectedSize.price * 1.2) / 10000) * 10000 - 1000
      }
    }

    return selectedSize.price || 0
  }, [selectedSize, toggles.tranhIn, isOddSize, oddSizeMatch, costResult])

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
    setToggles({ tranhIn: true, dongGoi: true })
    setIsOddSize(false)
    setOddWidth('')
    setOddHeight('')
  }, [])

  const buildCartItem = useCallback(() => {
    const qty = parseInt(quantity, 10) || 1
    const sizeDescription = isOddSize ? `${activeWidth}x${activeHeight}cm (Size lẻ)` : (selectedSize?.label || '')
    const name = productName.trim() || `Khung Moebe ${selectedFrame?.name || ''} ${sizeDescription}`.trim()

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
        sizeId: isOddSize ? 'odd' : selectedSizeId,
        sizeLabel: sizeDescription,
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
    isOddSize,
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
    setPrintWidth: handlePrintWidthChange,
    printHeight,
    setPrintHeight: handlePrintHeightChange,
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
    // 🌟 Trả thêm các biến size lẻ ra ngoài để form nhận diện
    isOddSize,
    onToggleOddSize: handleToggleOddSize,
    oddWidth,
    onOddWidthChange: setOddWidth,
    oddHeight,
    onOddHeightChange: setOddHeight,
    oddSizeMatch,
  }
}