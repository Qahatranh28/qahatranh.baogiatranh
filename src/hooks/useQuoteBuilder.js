import { useMemo, useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAdminAuth } from './useAdminAuth.js'
import { useOrders } from './useOrders.js'
import { useProductCatalog } from './useProductCatalog.js'
import { useFrameSettings } from './useFrameSettings.js'
import { useStandardPrices } from './useStandardPrices.js'
import { useTypeRates } from './useTypeRates.js'
import { getStaticFrameImage } from '../utils/imageMapper.js'
import {
  khungTypeOptions,
  micaKinhTypeOptions,
  micaKinhLyOptions,
  vanLyOptions,
  giayBoTypeOptions,
  isKinhType,
  isNhomType,
} from '../data/frameDefaults.js'
import { computeFrameCost } from '../utils/frameCosting.js'
import { khungCategoryOptions, getKhungTypesByCategory } from '../data/khungCatalog.js'
import {
  defaultToggles,
  simpleToggles,
  oversizeCustomToggles,
  defaultSelections,
  findRoundUpStandardSize,
  OVERSIZE_THRESHOLD_CM,
} from '../config/quoteDefaults.js'
import { parseDimensionsFromSizeName } from '../utils/sizeParsing.js'

// IMPORTS CÁC DỊCH VỤ TRUY XUẤT VẬT TƯ
import { getGlassMicaDetail, getGlassMicaOptions } from '../services/glassMicaService.js'
import { getTranhInOptions, getTranhInDetail } from '../services/tranhInService.js'
import { getVanOptions, getVanDetail } from '../services/vanService.js'
import { getGiayBoOptions, getGiayBoDetail } from '../services/giayBoService.js'
import { getSatXiDetail } from '../services/satXiService.js'

/**
 * useQuoteBuilder
 * Gom toàn bộ state + tính toán giá của trang báo giá (App.jsx) vào 1 custom hook,
 * giúp App.jsx chỉ còn nhiệm vụ render giao diện.
 */
export function useQuoteBuilder() {
  const [isManageProductsModalOpen, setIsManageProductsModalOpen] = useState(false)
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [mode, setMode] = useState('simple')

  const [khungCategory, setKhungCategory] = useState('Khung Composite Mỏng')
  const [sizeLabel, setSizeLabel] = useState('10 x 15 cm')
  const [productName, setProductName] = useState('')
  const [width, setWidth] = useState('10')
  const [height, setHeight] = useState('15')

  // 🌟 SIZE LẺ (trong khung tiêu chuẩn): sale nhập W x H tự do, hệ thống tự áp giá
  // của size chuẩn nhỏ nhất mà cả 2 chiều đều đủ lớn (làm tròn lên).
  const [isOddSize, setIsOddSize] = useState(false)
  const [oddWidth, setOddWidth] = useState('')
  const [oddHeight, setOddHeight] = useState('')

  const [innerWidth, setInnerWidth] = useState('8')
  const [innerHeight, setInnerHeight] = useState('12')

  const [quantity, setQuantity] = useState('1')

  // 🌟 KHAI BÁO STATE ĐỘC LẬP CHO CÁC FORM
  const [toggles, setToggles] = useState(defaultToggles)
  const [moebeToggles, setMoebeToggles] = useState({ dongGoi: false })

  const [selections, setSelections] = useState(() => ({
    ...defaultSelections,
    khungType: 'Khung Composite Mỏng Đen',
  }))

  const [moebeSelections, setMoebeSelections] = useState({
    khungType: 'Khung Composite Mỏng Đen',
    micaKinhId: 'kinh',
    ruotMaterialId: 'tranh_in_giay_my_thuat',
  })

  // 1. LẤY TOÀN BỘ VẬT TƯ TỪ BẢNG MATERIAL TRÊN SUPABASE
  const [dbMaterialsList, setDbMaterialsList] = useState([])

  useEffect(() => {
    async function loadDbMaterials() {
      try {
        const { data, error } = await supabase.from('material').select('*')
        if (!error && data) {
          setDbMaterialsList(data)
        }
      } catch (err) {
        console.error('Lỗi lấy bảng material từ DB:', err)
      }
    }
    loadDbMaterials()
  }, [])

  // 2. TẠO MẢNG OPTIONS ĐỘNG TỪ SUPABASE CHO CÁC DROPDOWN
  const dynamicTranhInOptions = useMemo(() => getTranhInOptions(dbMaterialsList), [dbMaterialsList])
  const dynamicVanOptions = useMemo(() => getVanOptions(dbMaterialsList), [dbMaterialsList])
  const dynamicGiayBoOptions = useMemo(() => getGiayBoOptions(dbMaterialsList), [dbMaterialsList])
  const dynamicGlassMicaOptions = useMemo(() => getGlassMicaOptions(dbMaterialsList), [dbMaterialsList])

  // 3. TỰ ĐỘNG CHỌN MÃ ID HỢP LỆ CHO TẤT CẢ DROPDOWN
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

  const [discountPercent, setDiscountPercent] = useState('0')
  const [items, setItems] = useState([])
  const [showLogin, setShowLogin] = useState(false)
  const [view, setView] = useState('create')
  const [exportMessage, setExportMessage] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { user, isAdmin, login, logout } = useAdminAuth()
  // 🌟 "sale" đăng nhập vẫn tính là isAdmin (để nhận diện đã đăng nhập, gắn tên vào báo giá),
  // nhưng KHÔNG được xem giá vốn/lợi nhuận/quản trị sản phẩm — chỉ admin & editor mới được (canSeeCost)
  const isSaleRole = isAdmin && user?.role === 'sale'
  const canSeeCost = isAdmin && user?.role !== 'sale'
  const { orders, saveOrder, deleteOrder, updateOrderStatus } = useOrders()
  const { settings, updateSetting, resetSettings } = useFrameSettings()
  const { standardPrices, updateStandardPrice, resetStandardPrices } = useStandardPrices()
  const { typeRates, updateTypeRate, resetTypeRates } = useTypeRates()

  const handleLogout = () => logout()

  const {
    categories: activeCategories,
    typesByCategory: activeTypesByCategory,
    getStandardSizesForType: activeGetSizes,
    getFrameImage: activeGetImage,
    getMaterialImage: activeGetMaterialImage,
    rawCatalog,
  } = useProductCatalog()

  const currentTypeOptions = useMemo(() => {
    const fromDb = activeTypesByCategory[khungCategory]
    if (fromDb && fromDb.length > 0) return fromDb
    return getKhungTypesByCategory(khungCategory) || khungTypeOptions
  }, [activeTypesByCategory, khungCategory])

  useEffect(() => {
    if (currentTypeOptions.length > 0) {
      if (!currentTypeOptions.includes(selections.khungType)) {
        setSelections((prev) => ({ ...prev, khungType: currentTypeOptions[0] }))
      }
      if (!currentTypeOptions.includes(moebeSelections.khungType)) {
        setMoebeSelections((prev) => ({ ...prev, khungType: currentTypeOptions[0] }))
      }
    }
  }, [currentTypeOptions])

  const productNameOptions = rawCatalog ? Array.from(new Set(rawCatalog.map((c) => c.name))) : []
  const activeKhungType = mode === 'moebe' ? moebeSelections.khungType : selections.khungType

  // 🌟 CẬP NHẬT activeToggles ĐỂ SỬ DỤNG moebeToggles KHI Ở MODE MOEBE
  const activeToggles = useMemo(() => {
    if (mode === 'simple') return simpleToggles
    if (mode === 'moebe') {
      return {
        ...moebeToggles,
        khung: true,
        dongGoi: Boolean(moebeToggles.dongGoi),
      }
    }
    return toggles
  }, [mode, toggles, moebeToggles])

  const isKinh = isKinhType(selections.micaKinhType)
  const isNhom = isNhomType(activeKhungType)

  const currentSizes = useMemo(() => {
    let sizes = []
    try {
      if (typeof activeGetSizes === 'function') {
        sizes = activeGetSizes(activeKhungType)
      }
    } catch (e) {
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

  const getDimensionsFromSizeLabel = (label) => {
    // 🌟 Dùng chung parser với useProductCatalog (hỗ trợ số thập phân, vd 59.4)
    // để tránh 2 nơi tách số ra 2 kiểu khác nhau.
    const { width, height } = parseDimensionsFromSizeName(label)
    return { w: width, h: height }
  }

  const presetDims = useMemo(() => {
    if (selectedPreset && typeof selectedPreset === 'object' && selectedPreset.width && selectedPreset.height) {
      return { w: Number(selectedPreset.width), h: Number(selectedPreset.height) }
    }
    return getDimensionsFromSizeLabel(sizeLabel)
  }, [selectedPreset, sizeLabel])

  const activeWidth =
    mode === 'simple' ? (isOddSize ? parseFloat(oddWidth) || 0 : presetDims.w) : parseFloat(width) || 0
  const activeHeight =
    mode === 'simple' ? (isOddSize ? parseFloat(oddHeight) || 0 : presetDims.h) : parseFloat(height) || 0

  // 🌟 Size lẻ: tìm size chuẩn nhỏ nhất (đã có giá) mà cả 2 chiều đều đủ lớn để áp giá bán.
  // Chỉ có ý nghĩa khi kích thước còn trong ngưỡng chuẩn (≤ OVERSIZE_THRESHOLD_CM),
  // vì vượt ngưỡng sẽ tự chuyển sang tab Custom (xem effect bên dưới).
  const oddSizeMatch = useMemo(() => {
    if (mode !== 'simple' || !isOddSize) return null
    const result = findRoundUpStandardSize(currentSizes, activeWidth, activeHeight)
    // 🔍 DEBUG TẠM: in ra dữ liệu size chuẩn thật của khung đang chọn để chẩn đoán
    // vì sao size lẻ không match được. Mở Console (F12) để xem, sẽ xoá sau khi debug xong.
    // eslint-disable-next-line no-console
    console.log('[DEBUG size lẻ]', {
      activeKhungType,
      activeWidth,
      activeHeight,
      currentSizes,
      result,
    })
    return result
  }, [mode, isOddSize, currentSizes, activeWidth, activeHeight])

  // 🌟 Size lẻ vượt ngưỡng OVERSIZE_THRESHOLD_CM (chiều dài HOẶC chiều rộng > 100cm) →
  // tự động chuyển sang tab "Custom" kèm bộ toggles mặc định (chỉ bật In tranh + Sắt xi,
  // các mục khác tắt hết) để sale không quên bật, rồi tự điều chỉnh thêm nếu cần.
  // Dưới ngưỡng 100cm: KHÔNG tự nhảy tab nữa (dù không tìm được size chuẩn khớp), luôn giữ
  // ở khung tiêu chuẩn — giá sẽ áp theo size chuẩn làm tròn lên gần nhất (oddSizeMatch).
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
  }, [mode, isOddSize, activeWidth, activeHeight])

  useEffect(() => {
    if (mode === 'simple' && presetDims) {
      setWidth(String(presetDims.w))
      setHeight(String(presetDims.h))
    }
  }, [mode, sizeLabel, activeKhungType, presetDims])

  const activeInnerWidth = mode === 'moebe' ? parseFloat(innerWidth) || 0 : 0
  const activeInnerHeight = mode === 'moebe' ? parseFloat(innerHeight) || 0 : 0

  const isOversizeCustom = (mode === 'custom' || mode === 'moebe') && (activeWidth > 100 || activeHeight > 100)

  const matchedStandardSize =
    (mode === 'custom' || mode === 'moebe') && !isOversizeCustom && Array.isArray(currentSizes)
      ? currentSizes.find((s) => {
          const sw = typeof s === 'object' ? s.width : 0
          const sh = typeof s === 'object' ? s.height : 0
          return (sw === activeWidth && sh === activeHeight) || (sw === activeHeight && sh === activeWidth)
        })
      : null

  const pricingWidth = activeWidth
  const pricingHeight = activeHeight

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

  const moebeGlassMatInfo = getGlassMicaDetail(moebeSelections.micaKinhId, dbMaterialsList)
  const moebeGlassPrice = moebeGlassMatInfo.price
  const moebeGlassLabel = moebeGlassMatInfo.label

  const moebeCoreMatInfo = moebeSelections.ruotMaterialId?.includes('van')
    ? getVanDetail(moebeSelections.ruotMaterialId, dbMaterialsList)
    : getTranhInDetail(moebeSelections.ruotMaterialId, dbMaterialsList)

  const moebeCorePrice = moebeCoreMatInfo.price
  const moebeCoreLabel = moebeCoreMatInfo.label

  const costResult = useMemo(
    () =>
      computeFrameCost(
        pricingWidth,
        pricingHeight,
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
        activeInnerWidth,
        activeInnerHeight,
        moebeGlassPrice,
        moebeGlassLabel,
        moebeCorePrice,
        moebeCoreLabel,
        khungCategory
      ),
    [
      pricingWidth,
      pricingHeight,
      activeToggles,
      settings,
      isKinh,
      khungRate,
      isNhom,
      tranhInMat,
      glassMat,
      vanMat,
      giayBoMat,
      satXiMat,
      mode,
      activeInnerWidth,
      activeInnerHeight,
      moebeGlassPrice,
      moebeGlassLabel,
      moebeCorePrice,
      moebeCoreLabel,
    ]
  )

  const standardPrice = useMemo(() => {
    if (mode !== 'simple') return null

    // 🌟 Size lẻ: lấy giá của size chuẩn đã làm tròn lên (bỏ qua size đang chọn trên dropdown)
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

  const { area, unitPrice, lineTotal } = useMemo(() => {
    const qty = parseInt(quantity, 10) || 0
    const customCalculatedSell = Math.round(costResult.grandTotal / 0.35)

    const sell = mode === 'simple' && standardPrice && standardPrice > 0 ? standardPrice : customCalculatedSell

    return {
      area: costResult.areaM2,
      unitPrice: sell,
      lineTotal: sell * qty,
    }
  }, [costResult, quantity, standardPrice, mode])

  const customCostDisplay = canSeeCost ? costResult.grandTotal : null
  const customCostDisplayLabel = canSeeCost ? 'Giá vốn' : 'Giá bán'

  const previewImage =
    getStaticFrameImage(activeKhungType, sizeLabel) ||
    activeGetImage(mode === 'simple' ? khungCategory : null, activeKhungType, sizeLabel)

  const hasAnyComponent = mode === 'moebe' ? true : Object.values(activeToggles).some(Boolean)
  // 🌟 Khách vãng lai (chưa đăng nhập) chỉ được XEM giá, không được thêm sản phẩm vào danh sách báo giá
  const canAdd =
    isAdmin &&
    activeWidth > 0 &&
    activeHeight > 0 &&
    (parseInt(quantity, 10) || 0) > 0 &&
    hasAnyComponent

  const handleSelectExistingProduct = (name) => {
    setProductName(name)
  }

  // 🌟 TÁCH RIÊNG 2 HÀM XỬ LÝ SỰ KIỆN CHO 2 MODE
  const handleToggleChange = (key, value) => {
    setToggles((prev) => ({ ...prev, [key]: value }))
  }

  const handleMoebeToggleChange = (key, value) => {
    setMoebeToggles((prev) => ({ ...prev, [key]: value }))
  }

  const handleSelectionChange = (key, value) => {
    if (mode === 'moebe') {
      setMoebeSelections((prev) => ({ ...prev, [key]: value }))
    } else {
      setSelections((prev) => ({ ...prev, [key]: value }))
      if (key === 'khungType') {
        const newSizeOptions = (typeof activeGetSizes === 'function' ? activeGetSizes(value) : []) || []
        if (Array.isArray(newSizeOptions) && newSizeOptions.length > 0) {
          const firstLabel = typeof newSizeOptions[0] === 'object' ? newSizeOptions[0].label : newSizeOptions[0]
          const hasCurrentLabel = newSizeOptions.some((o) => (typeof o === 'object' ? o.label : o) === sizeLabel)
          if (!hasCurrentLabel) {
            setSizeLabel(firstLabel)
          }
        }
      }
    }
  }

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    if (nextMode === 'simple') {
      const cat = Object.keys(activeTypesByCategory).find((k) => activeTypesByCategory[k].includes(selections.khungType))
      if (cat) setKhungCategory(cat)
    } else {
      // 🌟 Rời khỏi tab "Tiêu chuẩn" thì tắt luôn Size lẻ để tránh trạng thái lửng lơ
      setIsOddSize(false)
    }
  }

  const handleKhungCategoryChange = (category) => {
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
      if (!hasCurrentLabel) {
        setSizeLabel(firstLabel)
      }
    }
  }

  const handleAddItem = () => {
    if (!canAdd) return
    const qty = parseInt(quantity, 10) || 1

    let name = productName.trim()
    if (!name) {
      if (mode === 'simple') name = selections.khungType || khungCategory
      else if (mode === 'moebe') name = `Khung Moebe ${moebeSelections.khungType}`
      else name = 'Sản phẩm khung tranh'
    }

    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        mode,
        width: activeWidth,
        height: activeHeight,
        innerWidth: activeInnerWidth,
        innerHeight: activeInnerHeight,
        quantity: qty,
        toggles: activeToggles,
        selections: mode === 'moebe' ? { ...moebeSelections } : { ...selections },
        unitPrice,
        lineTotal,
        cost: costResult.grandTotal * qty,
        costBreakdown: costResult,
      },
    ])

    const nextCategory = activeCategories[0] || khungCategoryOptions[0]
    const nextTypeForCategory = (activeTypesByCategory[nextCategory] || getKhungTypesByCategory(nextCategory) || [])[0]
    setProductName('')
    setKhungCategory(nextCategory)

    const defaultSizes = (typeof activeGetSizes === 'function' ? activeGetSizes(nextTypeForCategory) : []) || []
    if (Array.isArray(defaultSizes) && defaultSizes.length > 0) {
      const firstLabel = typeof defaultSizes[0] === 'object' ? defaultSizes[0].label : defaultSizes[0]
      setSizeLabel(firstLabel)
    }

    setQuantity('1')
    setToggles(defaultToggles)
    setMoebeToggles({ dongGoi: false }) // 🌟 RESET LẠI STATE MOEBE KHI THÊM VÀO GIỎ HÀNG
    setIsOddSize(false) // 🌟 Reset Size lẻ sau khi đã thêm vào danh sách
    setOddWidth('')
    setOddHeight('')
    setSelections({
      ...defaultSelections,
      khungType: mode === 'simple' && nextTypeForCategory ? nextTypeForCategory : defaultSelections.khungType,
    })
  }

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const itemsSubtotal = useMemo(() => items.reduce((sum, item) => sum + item.lineTotal, 0), [items])
  const itemsCost = useMemo(() => items.reduce((sum, item) => sum + item.cost, 0), [items])
  const discount = Math.min(100, Math.max(0, parseFloat(discountPercent) || 0))
  const itemsTotal = itemsSubtotal * (1 - discount / 100)
  const profit = itemsTotal - itemsCost
  const margin = itemsTotal > 0 ? (profit / itemsTotal) * 100 : 0

  // 🌟 Chỉ người đã đăng nhập (admin/editor/sale) mới được xuất/lưu báo giá
  const canExport = isAdmin && items.length > 0

  const handleExport = () => {
    if (!canExport) return
    saveOrder({
      customerName: customerName.trim(),
      items,
      itemsSubtotal,
      discountPercent: discount,
      itemsTotal,
      itemsCost,
      profit,
      margin,
      idUser: user?.id ?? null, // 🌟 gắn báo giá này với user (sale) đang đăng nhập, nếu có
    })
    setExportMessage(`Đã lưu báo giá cho "${customerName.trim() || 'khách lẻ'}". Bắt đầu đơn mới.`)
    setCustomerName('')
    setItems([])
    setDiscountPercent('0')
    setTimeout(() => setExportMessage(''), 4000)
  }

  const handleLogin = async (username, password) => {
    return await login(username, password)
  }

  const allKhungTypes = Object.values(activeTypesByCategory).flat()

  const formProps = {
    productName,
    width,
    height,
    innerWidth,
    innerHeight,
    quantity,
    toggles: activeToggles,
    selections: mode === 'moebe' ? moebeSelections : selections,

    // 🌟 ĐIỀU HƯỚNG HÀM XỬ LÝ THEO TỪNG TRẠNG THÁI MODE
    onToggleChange: mode === 'moebe' ? handleMoebeToggleChange : handleToggleChange,

    productNameOptions,
    khungCategory,
    sizeLabel,
    categoryOptions: activeCategories.length > 0 ? activeCategories : khungCategoryOptions,
    typeOptions: currentTypeOptions,
    sizeOptions: currentSizes,
    khungTypeOptions: allKhungTypes,
    tranhInTypeOptions: dynamicTranhInOptions,
    vanTypeOptions: dynamicVanOptions,
    giayBoTypeOptions: dynamicGiayBoOptions,
    glassMicaOptions: dynamicGlassMicaOptions,

    tranhInYoutubeUrl: tranhInMat.youtubeUrl,
    glassMicaYoutubeUrl: glassMat.youtubeUrl,
    vanYoutubeUrl: vanMat.youtubeUrl,
    giayBoYoutubeUrl: giayBoMat.youtubeUrl,

    onProductNameChange: setProductName,
    onSelectExistingProduct: handleSelectExistingProduct,
    onWidthChange: setWidth,
    onHeightChange: setHeight,
    onInnerWidthChange: setInnerWidth,
    onInnerHeightChange: setInnerHeight,
    onQuantityChange: setQuantity,
    onSelectionChange: handleSelectionChange,
    onKhungCategoryChange: handleKhungCategoryChange,
    onKhungTypeChange: (v) => handleSelectionChange('khungType', v),
    onSizeChange: setSizeLabel,
    // 🌟 Size lẻ (khung tiêu chuẩn)
    isOddSize,
    oddWidth,
    oddHeight,
    oddSizeMatchLabel: oddSizeMatch?.label ?? null,
    onToggleOddSize: (v) => {
      setIsOddSize(v)
      if (!v) {
        setOddWidth('')
        setOddHeight('')
      }
    },
    onOddWidthChange: setOddWidth,
    onOddHeightChange: setOddHeight,
    getMaterialImage: activeGetMaterialImage,
  }

  const resultPanelProps = {
    width: activeWidth,
    height: activeHeight,
    quantity: parseInt(quantity, 10) || 0,
    area,
    toggles: activeToggles,
    unitPrice,
    lineTotal,
    onAdd: handleAddItem,
    canAdd,
    canOrder: isAdmin, // 🌟 true nếu đã đăng nhập (admin/editor/sale) — false với khách vãng lai
    imageSrc: previewImage,
    costDisplay: customCostDisplay,
    costDisplayLabel: customCostDisplayLabel,
    isAdmin: canSeeCost,
    matchedStandardSizeLabel: mode === 'simple' && isOddSize && oddSizeMatch ? oddSizeMatch.label : null,
  }

  return {
    // modals
    isManageProductsModalOpen,
    setIsManageProductsModalOpen,
    isAddProductModalOpen,
    setIsAddProductModalOpen,
    isCreateAdminModalOpen,
    setIsCreateAdminModalOpen,
    // customer / view / sidebar
    customerName,
    setCustomerName,
    view,
    setView,
    sidebarOpen,
    setSidebarOpen,
    showLogin,
    setShowLogin,
    exportMessage,
    // mode
    mode,
    handleModeChange,
    // auth
    user,
    isAdmin,
    canSeeCost,
    isSaleRole,
    handleLogin,
    handleLogout,
    // orders
    orders,
    deleteOrder,
    updateOrderStatus,
    // items / totals
    items,
    handleRemoveItem,
    itemsSubtotal,
    itemsCost,
    itemsTotal,
    discountPercent,
    setDiscountPercent,
    canExport,
    handleExport,
    // admin settings (Frame cost calculator)
    settings,
    updateSetting,
    resetSettings,
    standardPrices,
    updateStandardPrice,
    resetStandardPrices,
    typeRates,
    updateTypeRate,
    resetTypeRates,
    // form / result panel
    formProps,
    resultPanelProps,
  }
}
