import { useState, useEffect, useMemo, useCallback } from 'react'
import { getStaticFrameImage } from '../../utils/imageMapper.js'
import {
  khungTypeOptions,
  isKinhType,
  isNhomType,
} from '../../data/frameDefaults.js'
import { computeFrameCost } from '../../utils/frameCosting.js'
import { khungCategoryOptions, getKhungTypesByCategory } from '../../data/khungCatalog.js'
import {
  defaultToggles,
  simpleToggles,
  oversizeCustomToggles,
  defaultSelections,
  findRoundUpStandardSize,
  OVERSIZE_THRESHOLD_CM,
} from '../../config/quoteDefaults.js'
import { parseDimensionsFromSizeName } from '../../utils/sizeParsing.js'
import { getGlassMicaDetail } from '../../services/glassMicaService.js'
import { getTranhInDetail } from '../../services/tranhInService.js'
import { getVanDetail } from '../../services/vanService.js'
import { getGiayBoDetail } from '../../services/giayBoService.js'
import { getSatXiDetail } from '../../services/satXiService.js'

export function useSimpleCustomQuoteState({
  mode,
  setMode,
  settings,
  standardPrices,
  dbMaterialsList,
  dynamicTranhInOptions,
  dynamicVanOptions,
  dynamicGiayBoOptions,
  dynamicGlassMicaOptions,
  activeCategories,
  activeTypesByCategory,
  activeGetSizes,
  activeGetImage,
  rawCatalog,
  canSeeCost,
}) {
  const [khungCategory, setKhungCategory] = useState('Khung Composite Mỏng')
  const [sizeLabel, setSizeLabel] = useState('10 x 15 cm')
  const [productName, setProductName] = useState('')
  const [width, setWidth] = useState('10')
  const [height, setHeight] = useState('15')
  const [isOddSize, setIsOddSize] = useState(false)
  const [oddWidth, setOddWidth] = useState('')
  const [oddHeight, setOddHeight] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [toggles, setToggles] = useState(defaultToggles)
  const [selections, setSelections] = useState(() => ({
    ...defaultSelections,
    khungType: 'Khung Composite Mỏng Đen',
  }))

  useEffect(() => {
    setSelections((prev) => {
      const next = { ...prev }
      let hasChanges = false
      if (dynamicTranhInOptions.length > 0 && !dynamicTranhInOptions.some((o) => o.value === next.tranhInType)) {
        next.tranhInType = dynamicTranhInOptions[0].value
        hasChanges = true
      }
      if (dynamicVanOptions.length > 0 && !dynamicVanOptions.some((o) => o.value === next.vanLy)) {
        next.vanLy = dynamicVanOptions[0].value
        hasChanges = true
      }
      if (dynamicGiayBoOptions.length > 0 && !dynamicGiayBoOptions.some((o) => o.value === next.giayBoType)) {
        next.giayBoType = dynamicGiayBoOptions[0].value
        hasChanges = true
      }
      if (dynamicGlassMicaOptions.length > 0 && !dynamicGlassMicaOptions.some((o) => o.value === next.micaKinhType)) {
        next.micaKinhType = dynamicGlassMicaOptions[0].value
        hasChanges = true
      }
      return hasChanges ? next : prev
    })
  }, [dynamicTranhInOptions, dynamicVanOptions, dynamicGiayBoOptions, dynamicGlassMicaOptions])

  const currentTypeOptions = useMemo(() => {
    const fromDb = activeTypesByCategory[khungCategory]
    if (fromDb && fromDb.length > 0) return fromDb
    return getKhungTypesByCategory(khungCategory) || khungTypeOptions
  }, [activeTypesByCategory, khungCategory])

  useEffect(() => {
    if (currentTypeOptions.length > 0 && !currentTypeOptions.includes(selections.khungType)) {
      setSelections((prev) => ({ ...prev, khungType: currentTypeOptions[0] }))
    }
  }, [currentTypeOptions])

  const activeKhungType = selections.khungType
  const activeToggles = mode === 'simple' ? simpleToggles : toggles
  const isKinh = isKinhType(selections.micaKinhType)
  const isNhom = isNhomType(activeKhungType)

  const currentSizes = useMemo(() => {
    let sizes = []
    try {
      if (typeof activeGetSizes === 'function') sizes = activeGetSizes(activeKhungType)
    } catch {
      sizes = []
    }
    if (!Array.isArray(sizes) || sizes.length === 0) {
      return ['10 x 15 cm', '13 x 18 cm', '15 x 21 cm', '20 x 30 cm']
    }
    return sizes
  }, [activeGetSizes, activeKhungType])

  const selectedPreset = useMemo(() => {
    if (!Array.isArray(currentSizes) || currentSizes.length === 0) {
      return { width: 10, height: 15, price: 0, label: '10 x 15 cm' }
    }
    const found = currentSizes.find((o) => {
      const lbl = typeof o === 'object' ? o.label : o
      return lbl === sizeLabel
    })
    return found || currentSizes[0]
  }, [currentSizes, sizeLabel])

  useEffect(() => {
    if (!sizeLabel && Array.isArray(currentSizes) && currentSizes.length > 0) {
      const firstLabel = typeof currentSizes[0] === 'object' ? currentSizes[0].label : currentSizes[0]
      setSizeLabel(firstLabel)
    }
  }, [currentSizes, sizeLabel])

  const presetDims = useMemo(() => {
    if (selectedPreset && typeof selectedPreset === 'object' && selectedPreset.width && selectedPreset.height) {
      return { w: Number(selectedPreset.width), h: Number(selectedPreset.height) }
    }
    const { width: w, height: h } = parseDimensionsFromSizeName(sizeLabel)
    return { w, h }
  }, [selectedPreset, sizeLabel])

  const activeWidth =
    mode === 'simple' ? (isOddSize ? parseFloat(oddWidth) || 0 : presetDims.w) : parseFloat(width) || 0
  const activeHeight =
    mode === 'simple' ? (isOddSize ? parseFloat(oddHeight) || 0 : presetDims.h) : parseFloat(height) || 0

  const oddSizeMatch = useMemo(() => {
    if (mode !== 'simple' || !isOddSize) return null
    return findRoundUpStandardSize(currentSizes, activeWidth, activeHeight)
  }, [mode, isOddSize, currentSizes, activeWidth, activeHeight])

  useEffect(() => {
    if (
      mode === 'simple' &&
      isOddSize &&
      (activeWidth > OVERSIZE_THRESHOLD_CM || activeHeight > OVERSIZE_THRESHOLD_CM)
    ) {
      setMode('custom')
      setWidth(String(activeWidth))
      setHeight(String(activeHeight))
      setToggles(oversizeCustomToggles)
      setIsOddSize(false)
      setOddWidth('')
      setOddHeight('')
    }
  }, [mode, isOddSize, activeWidth, activeHeight, setMode])

  useEffect(() => {
    if (mode === 'simple' && presetDims) {
      setWidth(String(presetDims.w))
      setHeight(String(presetDims.h))
    }
  }, [mode, sizeLabel, activeKhungType, presetDims])

  const catalogItem = rawCatalog?.find(
    (c) => c.name?.trim().toLowerCase() === activeKhungType?.trim().toLowerCase()
  )
  const khungRate = catalogItem && Number(catalogItem.price_cost) > 0 ? Number(catalogItem.price_cost) : 0

  const glassMat = getGlassMicaDetail(selections.micaKinhType, dbMaterialsList)
  const activeTranhInType = mode === 'simple' ? 'tranh_in_5ly_mo' : selections.tranhInType
  const tranhInMat = getTranhInDetail(activeTranhInType, dbMaterialsList)
  const vanMat = getVanDetail(selections.vanLy, dbMaterialsList)
  const giayBoMat = getGiayBoDetail(selections.giayBoType, dbMaterialsList)
  const satXiMat = getSatXiDetail(dbMaterialsList, settings)

  const costResult = useMemo(
    () =>
      computeFrameCost(
        activeWidth,
        activeHeight,
        activeToggles,
        settings,
        isKinh,
        khungRate,
        1,
        isNhom,
        tranhInMat.price,
        tranhInMat.label,
        glassMat.price,
        glassMat.label,
        vanMat.price,
        vanMat.label,
        giayBoMat.price,
        giayBoMat.label,
        satXiMat.price,
        satXiMat.label,
        mode,
        0,
        0,
        0,
        '',
        0,
        '',
        khungCategory
      ),
    [activeWidth, activeHeight, activeToggles, settings, isKinh, khungRate, isNhom, tranhInMat, glassMat, vanMat, giayBoMat, satXiMat, mode, khungCategory]
  )

  const standardPrice = useMemo(() => {
    if (mode !== 'simple') return null
    if (isOddSize) {
      return oddSizeMatch?.price != null && Number(oddSizeMatch.price) > 0 ? Number(oddSizeMatch.price) : null
    }
    if (selectedPreset && typeof selectedPreset === 'object') {
      const p = Number(selectedPreset.price ?? selectedPreset.price_sell ?? selectedPreset.standard_price)
      if (!isNaN(p) && p > 0) return p
    }
    if (standardPrices && typeof standardPrices === 'object') {
      const keyType = `${activeKhungType}_${sizeLabel}`
      const keyCat = `${khungCategory}_${sizeLabel}`
      if (Number(standardPrices[keyType]) > 0) return Number(standardPrices[keyType])
      if (Number(standardPrices[keyCat]) > 0) return Number(standardPrices[keyCat])
      if (Number(standardPrices[sizeLabel]) > 0) return Number(standardPrices[sizeLabel])
    }
    return null
  }, [mode, isOddSize, oddSizeMatch, selectedPreset, standardPrices, activeKhungType, khungCategory, sizeLabel])

  const unitPrice = useMemo(() => {
    const customCalculatedSell = Math.round(costResult.grandTotal / 0.35)
    return mode === 'simple' && standardPrice && standardPrice > 0 ? standardPrice : customCalculatedSell
  }, [costResult, standardPrice, mode])

  const lineTotal = (parseInt(quantity, 10) || 0) * unitPrice
  const previewImage =
    getStaticFrameImage(activeKhungType, sizeLabel) ||
    activeGetImage(mode === 'simple' ? khungCategory : null, activeKhungType, sizeLabel)

  const hasAnyComponent = Object.values(activeToggles).some(Boolean)
  const canAdd = activeWidth > 0 && activeHeight > 0 && (parseInt(quantity, 10) || 0) > 0 && hasAnyComponent

  const handleToggleChange = useCallback((key, value) => {
    setToggles((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSelectionChange = useCallback(
    (key, value) => {
      setSelections((prev) => ({ ...prev, [key]: value }))
      if (key === 'khungType') {
        const newSizeOptions = (typeof activeGetSizes === 'function' ? activeGetSizes(value) : []) || []
        if (Array.isArray(newSizeOptions) && newSizeOptions.length > 0) {
          const firstLabel = typeof newSizeOptions[0] === 'object' ? newSizeOptions[0].label : newSizeOptions[0]
          const hasCurrentLabel = newSizeOptions.some((o) => (typeof o === 'object' ? o.label : o) === sizeLabel)
          if (!hasCurrentLabel) setSizeLabel(firstLabel)
        }
      }
    },
    [activeGetSizes, sizeLabel]
  )

  const handleKhungCategoryChange = useCallback(
    (category) => {
      setKhungCategory(category)
      const typesInCategory = activeTypesByCategory[category] || getKhungTypesByCategory(category) || []
      let newKhungType = selections.khungType
      if (typesInCategory.length && !typesInCategory.includes(selections.khungType)) {
        newKhungType = typesInCategory[0]
        setSelections((prev) => ({ ...prev, khungType: newKhungType }))
      }
      const newSizeOptions = (typeof activeGetSizes === 'function' ? activeGetSizes(newKhungType) : []) || []
      if (Array.isArray(newSizeOptions) && newSizeOptions.length > 0) {
        const firstLabel = typeof newSizeOptions[0] === 'object' ? newSizeOptions[0].label : newSizeOptions[0]
        const hasCurrentLabel = newSizeOptions.some((o) => (typeof o === 'object' ? o.label : o) === sizeLabel)
        if (!hasCurrentLabel) setSizeLabel(firstLabel)
      }
    },
    [activeTypesByCategory, selections.khungType, activeGetSizes, sizeLabel]
  )

  const handleModeChangeSideEffects = useCallback(
    (nextMode) => {
      if (nextMode === 'simple') {
        const cat = Object.keys(activeTypesByCategory).find((k) =>
          activeTypesByCategory[k].includes(selections.khungType)
        )
        if (cat) setKhungCategory(cat)
      } else {
        setIsOddSize(false)
      }
    },
    [activeTypesByCategory, selections.khungType]
  )

  const reset = useCallback(
    (nextCategory, nextType) => {
      setProductName('')
      setKhungCategory(nextCategory)
      setQuantity('1')
      setToggles(defaultToggles)
      setIsOddSize(false)
      setOddWidth('')
      setOddHeight('')
      setSelections({
        ...defaultSelections,
        khungType: nextType || defaultSelections.khungType,
      })
    },
    []
  )

  const buildCartItem = useCallback(() => {
    const qty = parseInt(quantity, 10) || 1
    let name = productName.trim()
    if (!name) {
      name = mode === 'simple' ? selections.khungType || khungCategory : 'Sản phẩm khung tranh'
    }
    return {
      id: crypto.randomUUID(),
      name,
      mode,
      width: activeWidth,
      height: activeHeight,
      quantity: qty,
      toggles: activeToggles,
      selections: { ...selections },
      unitPrice,
      lineTotal: unitPrice * qty,
      cost: costResult.grandTotal * qty,
      costBreakdown: costResult,
    }
  }, [quantity, productName, mode, selections, khungCategory, activeWidth, activeHeight, activeToggles, unitPrice, costResult])

  const productNameOptions = rawCatalog ? Array.from(new Set(rawCatalog.map((c) => c.name))) : []
  const allKhungTypes = Object.values(activeTypesByCategory).flat()

  return {
    productName,
    setProductName,
    width,
    setWidth,
    height,
    setHeight,
    quantity,
    setQuantity,
    toggles: activeToggles,
    selections,
    khungCategory,
    sizeLabel,
    setSizeLabel,
    isOddSize,
    oddWidth,
    oddHeight,
    oddSizeMatch,
    setIsOddSize,
    setOddWidth,
    setOddHeight,
    currentTypeOptions,
    currentSizes,
    activeWidth,
    activeHeight,
    unitPrice,
    lineTotal,
    area: costResult.areaM2,
    costResult,
    costDisplay: canSeeCost ? costResult.grandTotal : null,
    previewImage,
    canAdd,
    handleToggleChange,
    handleSelectionChange,
    handleKhungCategoryChange,
    handleModeChangeSideEffects,
    reset,
    buildCartItem,
    productNameOptions,
    allKhungTypes,
    tranhInMat,
    glassMat,
    vanMat,
    giayBoMat,
  }
}
