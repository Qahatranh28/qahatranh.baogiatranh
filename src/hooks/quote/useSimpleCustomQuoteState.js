import { useState, useEffect, useMemo, useCallback } from 'react'
import { getStaticFrameImage } from '../../utils/imageMapper.js'
import {
  khungTypeOptions,
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
import { getMica2LiDetail, getMica4LiDetail } from '../../services/glassMicaService.js'
import { getTranhInDetail } from '../../services/tranhInService.js'
import { getVan4LyDetail } from '../../services/vanService.js'
import { getGiayBoDetail } from '../../services/giayBoService.js'
import { getSatXiDetail } from '../../services/satXiService.js'
import { fetchMaterialSizePrices } from '../../services/materialSizePriceService.js'

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
  
  // Tắt mặc định công tắc Ván lót (van: false) khi vừa mở form
  const [toggles, setToggles] = useState({ ...defaultToggles, van: false })
  
  // Nút bật/tắt "In tranh" riêng cho Khung tiêu chuẩn
  const [simpleTranhInOn, setSimpleTranhInOn] = useState(true)
  
  // Giấy bo (Custom)
  const [giayBoQuantity, setGiayBoQuantity] = useState('1')
  const [giayBoSizePrices, setGiayBoSizePrices] = useState([])
  const [selections, setSelections] = useState(() => ({
    ...defaultSelections,
    khungType: 'Khung Composite Mỏng Đen',
    customTierOption: '1', // Mặc định kiểu 1
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

  // Tải bảng giá theo size từ DB mỗi khi đổi loại giấy bo
  useEffect(() => {
    let cancelled = false
    if (!selections.giayBoType) {
      setGiayBoSizePrices([])
      return
    }
    fetchMaterialSizePrices(selections.giayBoType).then((rows) => {
      if (!cancelled) setGiayBoSizePrices(rows)
    })
    return () => {
      cancelled = true
    }
  }, [selections.giayBoType])

  const simpleToggleState = useMemo(
    () => ({
      ...simpleToggles,
      tranhIn: simpleTranhInOn,
      van: !simpleTranhInOn,
    }),
    [simpleTranhInOn]
  )
  const activeToggles = mode === 'simple' ? simpleToggleState : toggles
  
  const isKinh = false
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

  // Kiểm tra kích thước khổ tối đa 120 x 240 cm cho Mica
  const isMicaSizeExceeded = useMemo(() => {
    const w = parseFloat(activeWidth) || 0;
    const h = parseFloat(activeHeight) || 0;
    const minDim = Math.min(w, h);
    const maxDim = Math.max(w, h);
    return minDim > 120 || maxDim > 240;
  }, [activeWidth, activeHeight]);

  // Tự động tắt Mica nếu kích thước vượt khổ
  useEffect(() => {
    if (isMicaSizeExceeded && toggles.micaKinh) {
      setToggles((prev) => ({ ...prev, micaKinh: false }));
    }
  }, [isMicaSizeExceeded, toggles.micaKinh]);

  const catalogItem = rawCatalog?.find(
    (c) => c.name?.trim().toLowerCase() === activeKhungType?.trim().toLowerCase()
  )
  const khungRate = catalogItem && Number(catalogItem.price_cost) > 0 ? Number(catalogItem.price_cost) : 0

  const isSilkScarf = typeof khungCategory === 'string' && khungCategory.includes('Khăn Lụa')
  const glassMat =
    isSilkScarf && activeWidth > 85 && activeHeight > 85
      ? getMica4LiDetail(dbMaterialsList)
      : getMica2LiDetail(dbMaterialsList)
  const glassSheetMultiplier = mode === 'custom' && Number(selections.micaSheets) === 2 ? 2 : 1
  const activeTranhInType = mode === 'simple' ? 'tranh_in_5ly_mo' : selections.tranhInType
  const tranhInMat = getTranhInDetail(activeTranhInType, dbMaterialsList)
  const vanMat = getVan4LyDetail(dbMaterialsList)
  const giayBoMat = getGiayBoDetail(selections.giayBoType, dbMaterialsList)
  const satXiMat = getSatXiDetail(dbMaterialsList, settings)

  // 🌟 Lấy chi tiết vật liệu Fomex từ DB (dựa vào id_material hoặc tên chứa 'fomex')
  const fomexMat = useMemo(() => {
    if (!Array.isArray(dbMaterialsList)) return { price: 0, label: 'Viền Fomex' }
    const found = dbMaterialsList.find(
      (m) => m.id_material === 'fomex' || m.id_material?.includes('fomex') || m.name?.toLowerCase().includes('fomex')
    )
    return {
      price: found ? Number(found.price_cost || found.price || 0) : 0,
      label: found?.name || 'Viền Fomex',
    }
  }, [dbMaterialsList])

  // Giấy bo (Custom)
  const giayBoSizeMatch = useMemo(() => {
    if (mode !== 'custom' || !activeToggles?.giayBo) return null;

    // Chuẩn hóa chiều ngắn/dài để không phân biệt ngang/dọc
    const minInput = Math.min(activeWidth, activeHeight);
    const maxInput = Math.max(activeWidth, activeHeight);

    // 1. Quá giới hạn max 75x105 -> Không trả về size nào (chặn tính giá)
    if (minInput > 105 || maxInput > 105) {
      return null; 
    }

    // 2. Kích thước > 70x100 nhưng vẫn <= 75x105 -> Ép lấy giá của dòng 70x100
    if (minInput > 70 || maxInput > 100) {
      return giayBoSizePrices.find(size => 
        (size.width === 70 && size.height === 100) || 
        (size.width === 100 && size.height === 70)
      );
    }

    // 3. Các trường hợp nhỏ hơn 70x100 -> Vẫn giữ nguyên hàm tìm size gần nhất của bạn
    return findRoundUpStandardSize(giayBoSizePrices, activeWidth, activeHeight);
    
  }, [mode, activeToggles?.giayBo, giayBoSizePrices, activeWidth, activeHeight]);

  const giayBoSellAddon = useMemo(() => {
    if (mode !== 'custom' || !activeToggles?.giayBo || !giayBoSizeMatch) return 0
    const qty = parseInt(giayBoQuantity, 10) || 1
    return (giayBoSizeMatch.price || 0) * qty
  }, [mode, activeToggles?.giayBo, giayBoSizeMatch, giayBoQuantity])

  // Bảng Chi tiết Vật tư (Giá vốn) chính -> Có truyền thêm Fomex và Kiểu
  const costResult = useMemo(
    () =>
      computeFrameCost(
        activeWidth, activeHeight, activeToggles, settings, isKinh, khungRate, 1, isNhom,
        tranhInMat.price, tranhInMat.label, glassMat.price, glassMat.label, vanMat.price, vanMat.label,
        giayBoMat.price, giayBoMat.label, satXiMat.price, satXiMat.label, mode,
        0, 0, 0, '', 0, '', khungCategory, glassSheetMultiplier,
        selections.customTierOption || '1',
        fomexMat.price,
        fomexMat.label
      ),
    [
      activeWidth, activeHeight, activeToggles, settings, isKinh, khungRate, isNhom,
      tranhInMat, glassMat, vanMat, giayBoMat, satXiMat, mode, khungCategory, glassSheetMultiplier,
      selections.customTierOption, fomexMat
    ]
  )

  const pickStandardPrice = useCallback(
    (basePrice, pricePrint) => {
      const base = Number(basePrice) || 0
      if (!simpleTranhInOn) return base > 0 ? base : null
      if (pricePrint != null && Number(pricePrint) > 0) return Number(pricePrint)
      if (base > 0) return Math.ceil((base * 1.2) / 10000) * 10000 - 1000
      return null
    },
    [simpleTranhInOn]
  )

  const standardPrice = useMemo(() => {
    if (mode !== 'simple') return null
    if (isOddSize) {
      if (!oddSizeMatch) return null
      return pickStandardPrice(oddSizeMatch.price, oddSizeMatch.pricePrint)
    }
    if (selectedPreset && typeof selectedPreset === 'object') {
      const p = pickStandardPrice(
        selectedPreset.price ?? selectedPreset.price_sell ?? selectedPreset.standard_price,
        selectedPreset.pricePrint
      )
      if (p != null) return p
    }
    if (standardPrices && typeof standardPrices === 'object') {
      const keyType = `${activeKhungType}_${sizeLabel}`
      const keyCat = `${khungCategory}_${sizeLabel}`
      const base =
        Number(standardPrices[keyType]) > 0
          ? Number(standardPrices[keyType])
          : Number(standardPrices[keyCat]) > 0
          ? Number(standardPrices[keyCat])
          : Number(standardPrices[sizeLabel]) > 0
          ? Number(standardPrices[sizeLabel])
          : 0
      if (base > 0) return pickStandardPrice(base, null)
    }
    return null
  }, [
    mode, isOddSize, oddSizeMatch, selectedPreset, standardPrices,
    activeKhungType, khungCategory, sizeLabel, pickStandardPrice,
  ])

  // TÍNH ĐƠN GIÁ BÁN (unitPrice) — Chạy ngầm hàm tính giá vốn KHÔNG GỒM GIẤY BO để tách giá
  const unitPrice = useMemo(() => {
    const costWithoutGiayBo = computeFrameCost(
      activeWidth, activeHeight,
      { ...activeToggles, giayBo: false },
      settings, isKinh, khungRate, 1, isNhom,
      tranhInMat.price, tranhInMat.label, glassMat.price, glassMat.label, vanMat.price, vanMat.label,
      giayBoMat.price, giayBoMat.label, satXiMat.price, satXiMat.label, mode,
      0, 0, 0, '', 0, '', khungCategory, glassSheetMultiplier,
      selections.customTierOption || '1',
      fomexMat.price,
      fomexMat.label
    );

    const S = (activeWidth * activeHeight) / 10000;
    const BaseAdjust = 9874 - 107286 * S;
    const totalCost = costWithoutGiayBo.grandTotal || 0;
    
    let price = (totalCost / 0.30) + BaseAdjust;
    
    const hasPrint = mode === 'simple' ? simpleTranhInOn : Boolean(activeToggles?.tranhIn);

    if (hasPrint) {
      const PrintAdjust = 56250 - 318016 * S;
      price = price + PrintAdjust;
    }

    const beautifulPrice = Math.ceil(price / 10000) * 10000 - 1000;
    let customCalculatedSell = Math.max(0, beautifulPrice);

    let finalPrice = mode === 'simple' && standardPrice && standardPrice > 0 
      ? standardPrice 
      : customCalculatedSell;

    if (mode === 'custom' && activeToggles?.giayBo) {
      finalPrice += giayBoSellAddon;
    }

    if (mode === 'custom' && activeToggles?.hoanThien) {
      finalPrice = Math.round(finalPrice * 1.3);
    }

    return finalPrice;
  }, [
    costResult, standardPrice, mode, activeWidth, activeHeight, 
    simpleTranhInOn, activeToggles, settings, isKinh, khungRate, isNhom,
    tranhInMat, glassMat, vanMat, giayBoMat, satXiMat, khungCategory, glassSheetMultiplier, giayBoSellAddon,
    selections.customTierOption, fomexMat
  ]);

  // THÀNH TIỀN (lineTotal) ĐẶT SAU unitPrice
  const lineTotal = (parseInt(quantity, 10) || 0) * unitPrice;

  const previewImage =
    getStaticFrameImage(activeKhungType, sizeLabel) ||
    activeGetImage(mode === 'simple' ? khungCategory : null, activeKhungType, sizeLabel)

  const hasAnyComponent = Object.values(activeToggles).some(Boolean)
  const canAdd = activeWidth > 0 && activeHeight > 0 && (parseInt(quantity, 10) || 0) > 0 && hasAnyComponent

  // Chặn bật công tắc Mica nếu kích thước vượt khổ 120 x 240 cm
  const handleToggleChange = useCallback((key, value) => {
    if (key === 'micaKinh' && value === true) {
      if (isMicaSizeExceeded) {
        alert('Kích thước vượt quá khổ Mica tối đa cho phép (120 x 240 cm). Không thể bật Mica!');
        return;
      }
    }

    setToggles((prev) => ({ ...prev, [key]: value }))
  }, [isMicaSizeExceeded])

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
      setToggles({ ...defaultToggles, van: false }) 
      setSimpleTranhInOn(true)
      setIsOddSize(false)
      setOddWidth('')
      setOddHeight('')
      setGiayBoQuantity('1')
      setSelections({
        ...defaultSelections,
        khungType: nextType || defaultSelections.khungType,
        customTierOption: '1',
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
    simpleTranhInOn,
    onToggleSimpleTranhIn: setSimpleTranhInOn,
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
    giayBoQuantity,
    setGiayBoQuantity,
    giayBoSizeMatch,
    giayBoSellAddon,
  }
}