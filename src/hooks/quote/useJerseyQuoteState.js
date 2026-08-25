import { useState, useEffect, useMemo, useCallback } from 'react'
import { fetchJerseyFrameTypes, fetchJerseyPrices, mapJerseyCategory } from '../../services/jerseyPriceService.js'
import { computeJerseyCost } from '../../utils/jerseyCosting.js'
import { isNhomType } from '../../data/frameDefaults.js'
import { getJerseyImage } from '../../utils/imageMapper.js'

// 🌟 Hàm hỗ trợ: Quét tự động nhiều định dạng tên cột category từ Database
const getCat = (f) => f.category || f.category_id || f.frame_category;

export function useJerseyQuoteState({ settings, dbMaterialsList, canSeeCost }) {
  const [frameTypes, setFrameTypes] = useState([])
  const [jerseyPrices, setJerseyPrices] = useState([])
  const [tier, setTier] = useState('basic')
  const [selectedCategory, setSelectedCategory] = useState('composite_2x3')
  const [selectedFrameId, setSelectedFrameId] = useState(null)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [selectedJerseySizeId, setSelectedJerseySizeId] = useState(null)
  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [toggles, setToggles] = useState({ dongGoi: true })

  useEffect(() => {
    async function load() {
      try {
        const [types, prices] = await Promise.all([fetchJerseyFrameTypes(), fetchJerseyPrices()])
        setFrameTypes(types)
        setJerseyPrices(prices)
        if (types.length > 0) {
          const hasDefaultCategory = types.some((f) => getCat(f) === 'composite_2x3')
          const firstCategory = hasDefaultCategory ? 'composite_2x3' : getCat(types[0])
          setSelectedCategory(firstCategory)
          setSelectedFrameId(types.find((f) => getCat(f) === firstCategory)?.frame_id ?? types[0].frame_id)
        }
        if (prices.length > 0) setSelectedJerseySizeId(prices[0].id)
      } catch (err) {
        console.error('Lỗi tải dữ liệu Khung áo đấu:', err)
      }
    }
    load()
  }, [])

  // 🌟 Tự động chuyển loại khung về "nhom_day" khi chọn "2 mặt cao cấp"
  useEffect(() => {
    if (tier === '2_faces_premium') {
      setSelectedCategory('nhom_day')
    }
  }, [tier])

  const categoryOptions = useMemo(() => {
    const allowedCategories = ['composite_2x3', 'nhom', 'nhom_day']
    return allowedCategories.map((cat) => ({
      value: cat,
      label: cat === 'nhom' ? 'Khung Nhôm' : cat === 'nhom_day' ? 'Khung Nhôm Dày 3,5' : 'Khung Composite 2x3',
      hasFrames: frameTypes.some((f) => getCat(f) === cat),
    }))
  }, [frameTypes])

  // 🌟 Logic lọc: Lấy danh sách khung tương ứng với loại khung đang chọn
  const filteredFrameTypes = useMemo(() => {
    if (!selectedCategory) return []
    return frameTypes.filter((f) => {
      const matchCat = getCat(f) === selectedCategory;
      const isThinFrame = f.name?.toLowerCase().includes('mỏng') || f.slug?.toLowerCase().includes('mong');
      return matchCat && !isThinFrame;
    })
  }, [frameTypes, selectedCategory])

  useEffect(() => {
    if (!selectedCategory && categoryOptions.length > 0) {
      setSelectedCategory(categoryOptions[0].value)
      return
    }

    if (filteredFrameTypes.length === 0) {
      if (selectedFrameId !== null) setSelectedFrameId(null)
      return
    }

    const isValid = filteredFrameTypes.some((f) => String(f.frame_id) === String(selectedFrameId))
    if (!isValid) setSelectedFrameId(filteredFrameTypes[0].frame_id)
  }, [filteredFrameTypes, selectedFrameId, selectedCategory, categoryOptions])

  const selectedFrame = useMemo(
    () =>
      frameTypes.find(
        (f) => String(f.frame_id) === String(selectedFrameId) && getCat(f) === selectedCategory
      ) || filteredFrameTypes[0] || null,
    [frameTypes, selectedFrameId, filteredFrameTypes, selectedCategory]
  )

  const selectedJerseySize = useMemo(
    () => jerseyPrices.find((p) => p.id === selectedJerseySizeId) || jerseyPrices[0] || null,
    [jerseyPrices, selectedJerseySizeId]
  )

  const activeWidth = parseFloat(width) || 0
  const activeHeight = parseFloat(height) || 0
  const khungRate = Number(selectedFrame?.price_cost) || 0
  const isNhom = selectedFrame ? isNhomType(selectedFrame.name) || getCat(selectedFrame) === 'nhom' : false

  const handleFrameCategoryChange = useCallback((nextCategory) => {
    setSelectedCategory(nextCategory)
    const firstOfCategory = frameTypes.find((f) => getCat(f) === String(nextCategory))
    if (firstOfCategory) setSelectedFrameId(firstOfCategory.frame_id)
  }, [frameTypes])

  // 🌟 ĐÃ TRUYỀN THÊM `tier` VÀO HÀM TÍNH CHI PHÍ ĐỂ NHÂN ĐÔI KHI LÀ 2 MẶT CAO CẤP
  const costResult = useMemo(
    () =>
      computeJerseyCost(activeWidth, activeHeight, khungRate, isNhom, settings, dbMaterialsList, toggles, tier),
    [activeWidth, activeHeight, khungRate, isNhom, settings, dbMaterialsList, toggles, tier]
  )

  const unitPrice = useMemo(() => {
    if (!selectedJerseySize) return 0
    if (tier === '2_faces_premium') {
      return selectedJerseySize.price2FacesPremium || selectedJerseySize.pricePremium || 0
    }
    return tier === 'premium' ? selectedJerseySize.pricePremium : selectedJerseySize.priceBasic
  }, [selectedJerseySize, tier])

  const lineTotal = (parseInt(quantity, 10) || 0) * unitPrice
  const previewImage = getJerseyImage(tier)

  const handleToggleChange = useCallback((key, value) => {
    setToggles((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => {
    setProductName('')
    setQuantity('1')
    setToggles({ dongGoi: true })
    setWidth('')
    setHeight('')
  }, [])

  const buildCartItem = useCallback(() => {
    const qty = parseInt(quantity, 10) || 1
    const tierLabel = tier === '2_faces_premium' ? '2 mặt cao cấp' : tier === 'premium' ? 'Cao cấp' : 'Cơ bản'
    const name =
      productName.trim() ||
      `Khung áo đấu ${tierLabel} — ${selectedJerseySize?.sizeLabel || ''} — ${selectedFrame?.name || ''}`.trim()
    return {
      id: crypto.randomUUID(),
      name,
      mode: 'jersey',
      width: activeWidth,
      height: activeHeight,
      quantity: qty,
      toggles: { ...toggles },
      selections: {
        tier,
        frameId: selectedFrameId,
        khungType: selectedFrame?.name,
        jerseySizeId: selectedJerseySizeId,
        jerseySizeLabel: selectedJerseySize?.sizeLabel,
      },
      unitPrice,
      lineTotal: unitPrice * qty,
      cost: costResult.grandTotal * qty,
      costBreakdown: costResult,
    }
  }, [
    quantity,
    productName,
    tier,
    selectedJerseySize,
    selectedFrame,
    activeWidth,
    activeHeight,
    toggles,
    selectedFrameId,
    selectedJerseySizeId,
    unitPrice,
    costResult,
  ])

  const canAdd =
    activeWidth > 0 &&
    activeHeight > 0 &&
    (parseInt(quantity, 10) || 0) > 0 &&
    unitPrice > 0 &&
    selectedJerseySize != null &&
    selectedFrame != null

  return {
    productName,
    setProductName,
    quantity,
    setQuantity,
    toggles,
    handleToggleChange,
    tier,
    setTier,
    frameTypes,
    filteredFrameTypes,
    categoryOptions,
    selectedCategory,
    setSelectedCategory,
    handleFrameCategoryChange,
    selectedFrameId,
    setSelectedFrameId,
    selectedFrame,
    width,
    setWidth,
    height,
    setHeight,
    jerseyPrices,
    selectedJerseySizeId,
    setSelectedJerseySizeId,
    selectedJerseySize,
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
  }
}