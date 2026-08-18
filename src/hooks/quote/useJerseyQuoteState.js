import { useState, useEffect, useMemo, useCallback } from 'react'
import { fetchJerseyFrameTypes, fetchJerseyPrices, mapJerseyCategory } from '../../services/jerseyPriceService.js'
import { computeJerseyCost } from '../../utils/jerseyCosting.js'
import { isNhomType } from '../../data/frameDefaults.js'
import { getJerseyImage } from '../../utils/imageMapper.js'

export function useJerseyQuoteState({ settings, dbMaterialsList, canSeeCost }) {
  const [frameTypes, setFrameTypes] = useState([])
  const [jerseyPrices, setJerseyPrices] = useState([])
  const [tier, setTier] = useState('basic')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedFrameId, setSelectedFrameId] = useState(null)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [selectedJerseySizeId, setSelectedJerseySizeId] = useState(null)
  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [toggles, setToggles] = useState({ dongGoi: false })

  useEffect(() => {
    async function load() {
      try {
        const [types, prices] = await Promise.all([fetchJerseyFrameTypes(), fetchJerseyPrices()])
        setFrameTypes(types)
        setJerseyPrices(prices)

        const allowedTypes = (types || []).filter((f) => ['composite_2x3', 'nhom'].includes(f.category))
        if (allowedTypes.length > 0) {
          setSelectedCategory('all')
          setSelectedFrameId(allowedTypes[0].frame_id)
        }

        if (prices.length > 0) setSelectedJerseySizeId(prices[0].id)
      } catch (err) {
        console.error('Lỗi tải dữ liệu Khung áo đấu:', err)
      }
    }
    load()
  }, [])

  const categoryOptions = useMemo(() => {
    const allowedCategories = ['composite_2x3', 'nhom']
    const uniqueCategories = Array.from(
      new Set(frameTypes.map((f) => f.category).filter((cat) => allowedCategories.includes(cat)))
    )

    return (uniqueCategories.length > 0 ? uniqueCategories : allowedCategories).map((cat) => ({
      value: cat,
      label: cat === 'nhom' ? 'Nhôm' : 'Composite 2x3',
    }))
  }, [frameTypes])

  const filteredFrameTypes = useMemo(() => {
    const allowedCategories = ['composite_2x3', 'nhom']
    return frameTypes
      .filter((f) => allowedCategories.includes(f.category))
      .sort((a, b) => {
        const categoryOrder = { composite_2x3: 0, nhom: 1 }
        const categoryDiff = (categoryOrder[a.category] ?? 99) - (categoryOrder[b.category] ?? 99)
        if (categoryDiff !== 0) return categoryDiff
        return (a.name || '').localeCompare(b.name || '')
      })
  }, [frameTypes])

  useEffect(() => {
    if (!selectedCategory && categoryOptions.length > 0) {
      setSelectedCategory('all')
    }

    if (filteredFrameTypes.length === 0) {
      if (frameTypes.length > 0) {
        setSelectedCategory('all')
      }
      return
    }

    const isValid = filteredFrameTypes.some((f) => String(f.frame_id) === String(selectedFrameId))
    if (!isValid) setSelectedFrameId(filteredFrameTypes[0].frame_id)
  }, [filteredFrameTypes, selectedFrameId, frameTypes, selectedCategory, categoryOptions])

  const selectedFrame = useMemo(
    () =>
      frameTypes.find((f) => String(f.frame_id) === String(selectedFrameId)) || filteredFrameTypes[0] || null,
    [frameTypes, selectedFrameId, filteredFrameTypes]
  )

  const selectedJerseySize = useMemo(
    () => jerseyPrices.find((p) => p.id === selectedJerseySizeId) || jerseyPrices[0] || null,
    [jerseyPrices, selectedJerseySizeId]
  )

  const activeWidth = parseFloat(width) || 0
  const activeHeight = parseFloat(height) || 0
  const khungRate = Number(selectedFrame?.price_cost) || 0
  const isNhom = selectedFrame ? isNhomType(selectedFrame.name) || selectedFrame.category === 'nhom' : false

  const handleFrameCategoryChange = useCallback((nextCategory) => {
    setSelectedCategory(nextCategory || 'all')

    if (nextCategory === 'all') {
      const firstFrame = frameTypes.find((f) => ['composite_2x3', 'nhom'].includes(f.category))
      if (firstFrame) setSelectedFrameId(firstFrame.frame_id)
      return
    }

    const firstOfCategory = frameTypes.find((f) => f.category === String(nextCategory))
    if (firstOfCategory) setSelectedFrameId(firstOfCategory.frame_id)
  }, [frameTypes])

  const costResult = useMemo(
    () =>
      computeJerseyCost(activeWidth, activeHeight, khungRate, isNhom, settings, dbMaterialsList, toggles),
    [activeWidth, activeHeight, khungRate, isNhom, settings, dbMaterialsList, toggles]
  )

  const unitPrice = useMemo(() => {
    if (!selectedJerseySize) return 0
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
    setToggles({ dongGoi: false })
    setWidth('')
    setHeight('')
  }, [])

  const buildCartItem = useCallback(() => {
    const qty = parseInt(quantity, 10) || 1
    const tierLabel = tier === 'premium' ? 'Cao cấp' : 'Cơ bản'
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
    selectedJerseySize != null

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
