import { useMemo, useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import ManageProductsModal from './components/ManageProductsModal.jsx'
import AddProductModal from './components/AddProductModal.jsx' 
import CreateAdminModal from './components/CreateAdminModal.jsx'
import QuoteForm from './components/QuoteForm.jsx'
import ResultPanel from './components/ResultPanel.jsx'
import ProductListTable from './components/ProductListTable.jsx'
import OrderDiscountSummary from './components/OrderDiscountSummary.jsx'
import CustomerInfo from './components/CustomerInfo.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import AdminLogin from './components/AdminLogin.jsx'
import ExportQuoteButton from './components/ExportQuoteButton.jsx'
import OrderHistory from './components/OrderHistory.jsx'
import Sidebar from './components/Sidebar.jsx'
import QuoteHeader from './components/QuoteHeader.jsx'
import FrameCostCalculator from './components/FrameCostCalculator.jsx'
import { useAdminAuth } from './hooks/useAdminAuth.js'
import { useOrders } from './hooks/useOrders.js'
import { useProductCatalog } from './hooks/useProductCatalog.js'
import { useFrameSettings } from './hooks/useFrameSettings.js'
import { useStandardPrices } from './hooks/useStandardPrices.js'
import { useTypeRates } from './hooks/useTypeRates.js'
import { formatVND } from './utils/format.js'
import {
  frameComponentToggles,
  khungTypeOptions,
  micaKinhTypeOptions,
  micaKinhLyOptions,
  vanLyOptions,
  giayBoTypeOptions,
  isKinhType,
  isNhomType,
} from './data/frameDefaults.js'
import { computeFrameCost } from './utils/frameCosting.js'
import {
  khungCategoryOptions,
  getKhungTypesByCategory,
} from './data/khungCatalog.js'

// IMPORTS CÁC DỊCH VỤ TRUY XUẤT VẬT TƯ
import { getGlassMicaDetail, getGlassMicaOptions } from './services/glassMicaService.js'
import { getTranhInOptions, getTranhInDetail } from './services/tranhInService.js'
import { getVanOptions, getVanDetail } from './services/vanService.js'
import { getGiayBoOptions, getGiayBoDetail } from './services/giayBoService.js'
import { getSatXiDetail } from './services/satXiService.js'

const defaultToggles = Object.fromEntries(
  frameComponentToggles.map((t) => [t.key, t.default])
)

// 🌟 CẤU HÌNH TOGGLES CHO KHUNG TIÊU CHUẨN (Khung, Tranh in, Kính, Đóng gói - TẮT VÁN LÓT)
const simpleToggles = {
  khung: true,
  tranhIn: true,
  micaKinh: true,
  van: false,
  giayBo: false,
  satXi: false,
  son: false,
  dongGoi: true,
}

const defaultSelections = {
  khungType: khungTypeOptions[0],
  tranhInType: 'tranh_in_5ly_mo', // Tranh in 5 li mờ làm mặc định
  micaKinhType: micaKinhTypeOptions[0],
  micaKinhLy: micaKinhLyOptions[0],
  vanLy: vanLyOptions[0],
  giayBoType: giayBoTypeOptions[0],
}

export default function App() {
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
  
  const [innerWidth, setInnerWidth] = useState('8')
  const [innerHeight, setInnerHeight] = useState('12')

  const [quantity, setQuantity] = useState('1')
  const [toggles, setToggles] = useState(defaultToggles)
  
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
      let hasChanges = false;
      
      if (dynamicTranhInOptions.length > 0 && !dynamicTranhInOptions.some(o => o.value === next.tranhInType)) {
        next.tranhInType = dynamicTranhInOptions[0].value; hasChanges = true;
      }
      if (dynamicVanOptions.length > 0 && !dynamicVanOptions.some(o => o.value === next.vanLy)) {
        next.vanLy = dynamicVanOptions[0].value; hasChanges = true;
      }
      if (dynamicGiayBoOptions.length > 0 && !dynamicGiayBoOptions.some(o => o.value === next.giayBoType)) {
        next.giayBoType = dynamicGiayBoOptions[0].value; hasChanges = true;
      }
      if (dynamicGlassMicaOptions.length > 0 && !dynamicGlassMicaOptions.some(o => o.value === next.micaKinhType)) {
        next.micaKinhType = dynamicGlassMicaOptions[0].value; hasChanges = true;
      }
      
      return hasChanges ? next : prev;
    })
  }, [dynamicTranhInOptions, dynamicVanOptions, dynamicGiayBoOptions, dynamicGlassMicaOptions])

  const [discountPercent, setDiscountPercent] = useState('0')
  const [items, setItems] = useState([])
  const [showLogin, setShowLogin] = useState(false)
  const [view, setView] = useState('create') 
  const [exportMessage, setExportMessage] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { user, isAdmin, login, logout } = useAdminAuth()
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
    rawCatalog 
  } = useProductCatalog()

  const currentTypeOptions = useMemo(() => {
    const fromDb = activeTypesByCategory[khungCategory]
    if (fromDb && fromDb.length > 0) return fromDb
    return getKhungTypesByCategory(khungCategory) || khungTypeOptions
  }, [activeTypesByCategory, khungCategory])

  useEffect(() => {
    if (currentTypeOptions.length > 0) {
      if (!currentTypeOptions.includes(selections.khungType)) {
        setSelections(prev => ({ ...prev, khungType: currentTypeOptions[0] }))
      }
      if (!currentTypeOptions.includes(moebeSelections.khungType)) {
        setMoebeSelections(prev => ({ ...prev, khungType: currentTypeOptions[0] }))
      }
    }
  }, [currentTypeOptions])

  const productNameOptions = rawCatalog ? Array.from(new Set(rawCatalog.map(c => c.name))) : []
  const activeKhungType = mode === 'moebe' ? moebeSelections.khungType : selections.khungType

  // 🌟 FIX LỖI CÚ PHÁP TOGGLES TẠI ĐÂY:
  // 🌟 ĐỒNG BỘ TOGGLES CHO MOEBE MODE
  const activeToggles = useMemo(() => {
    if (mode === 'simple') return simpleToggles
    if (mode === 'moebe') {
      return {
        ...toggles,
        khung: true, // Moebe luôn bật khung
        dongGoi: Boolean(toggles.dongGoi)// 🌟 Đọc chính xác trạng thái đóng gói
      }
    }
    return toggles
  }, [mode, toggles])

  const isKinh = isKinhType(selections.micaKinhType)
  const isNhom = isNhomType(activeKhungType)

  const currentSizes = useMemo(() => activeGetSizes(activeKhungType) || [], [activeGetSizes, activeKhungType])
  
  const selectedPreset = useMemo(() => {
    if (!currentSizes || currentSizes.length === 0) return { width: 0, height: 0, price: 0 }
    return currentSizes.find((o) => (typeof o === 'object' ? o.label : o) === sizeLabel) || currentSizes[0]
  }, [currentSizes, sizeLabel])

  useEffect(() => {
    if (!sizeLabel && currentSizes.length > 0) {
      const firstLabel = typeof currentSizes[0] === 'object' ? currentSizes[0].label : currentSizes[0]
      setSizeLabel(firstLabel)
    }
  }, [currentSizes, sizeLabel])

  const getDimensionsFromSizeLabel = (label) => {
    if (!label) return { w: 0, h: 0 }
    const nums = String(label).match(/\d+/g)
    if (nums && nums.length >= 2) return { w: Number(nums[0]), h: Number(nums[1]) }
    return { w: 0, h: 0 }
  }

  const presetDims = useMemo(() => {
    if (selectedPreset && typeof selectedPreset === 'object' && selectedPreset.width && selectedPreset.height) {
      return { w: Number(selectedPreset.width), h: Number(selectedPreset.height) }
    }
    return getDimensionsFromSizeLabel(sizeLabel)
  }, [selectedPreset, sizeLabel])

  const activeWidth = mode === 'simple' ? presetDims.w : (parseFloat(width) || 0)
  const activeHeight = mode === 'simple' ? presetDims.h : (parseFloat(height) || 0)
  
  useEffect(() => {
    if (mode === 'simple' && presetDims) {
      setWidth(String(presetDims.w))
      setHeight(String(presetDims.h))
    }
  }, [mode, sizeLabel, activeKhungType, presetDims])

  const activeInnerWidth = mode === 'moebe' ? (parseFloat(innerWidth) || 0) : 0
  const activeInnerHeight = mode === 'moebe' ? (parseFloat(innerHeight) || 0) : 0

  const isOversizeCustom = (mode === 'custom' || mode === 'moebe') && (activeWidth > 100 || activeHeight > 100)
  
  const matchedStandardSize = (mode === 'custom' || mode === 'moebe') && !isOversizeCustom
    ? currentSizes.find(s => {
        const sw = typeof s === 'object' ? s.width : 0
        const sh = typeof s === 'object' ? s.height : 0
        return (sw === activeWidth && sh === activeHeight) || (sw === activeHeight && sh === activeWidth)
      })
    : null

  const pricingWidth = activeWidth
  const pricingHeight = activeHeight

  // LẤY ĐƠN GIÁ MÉT KHUNG TỪ BẢNG FRAME_CATALOG
  const catalogItem = rawCatalog?.find(
    (c) => c.name?.trim().toLowerCase() === activeKhungType?.trim().toLowerCase()
  )
  const khungRate = catalogItem && Number(catalogItem.price_cost) > 0 
    ? Number(catalogItem.price_cost) 
    : 0

  // 🌟 FIX LỖI TRUYỀN ACTIVE_TRANH_IN_TYPE VÀO HÀM TÍNH GIÁ VỐN
  const glassMat = getGlassMicaDetail(selections.micaKinhType, dbMaterialsList)
  const activeTranhInType = mode === 'simple' ? 'tranh_in_5ly_mo' : selections.tranhInType
  const tranhInMat = getTranhInDetail(activeTranhInType, dbMaterialsList) // 👈 Đã sửa dùng activeTranhInType chuẩn!
  
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

  // 🌟 TÍNH GIÁ VỐN (COST PRICE) SẢN PHẨM
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
        moebeCoreLabel
      ),
    [
      pricingWidth, pricingHeight, activeToggles, settings, isKinh, 
      khungRate, isNhom, tranhInMat, glassMat, vanMat, giayBoMat, satXiMat,
      mode, activeInnerWidth, activeInnerHeight, moebeGlassPrice, moebeGlassLabel, moebeCorePrice, moebeCoreLabel
    ]
  )

  // 🌟 BÓC TÁCH GIÁ BÁN MẶC ĐỊNH THEO SIZE TRÊN DB CHO KHUNG TIÊU CHUẨN
  const standardPrice = useMemo(() => {
    if (mode !== 'simple') return null

    // 1. Lấy từ preset size được chọn
    if (selectedPreset && typeof selectedPreset === 'object') {
      const p = Number(selectedPreset.price ?? selectedPreset.price_sell ?? selectedPreset.standard_price)
      if (!isNaN(p) && p > 0) return p
    }

    // 2. Lấy từ hook standardPrices
    if (standardPrices && typeof standardPrices === 'object') {
      const keyType = `${activeKhungType}_${sizeLabel}`
      const keyCat = `${khungCategory}_${sizeLabel}`
      if (Number(standardPrices[keyType]) > 0) return Number(standardPrices[keyType])
      if (Number(standardPrices[keyCat]) > 0) return Number(standardPrices[keyCat])
      if (Number(standardPrices[sizeLabel]) > 0) return Number(standardPrices[sizeLabel])
    }

    return null
  }, [mode, selectedPreset, standardPrices, activeKhungType, khungCategory, sizeLabel])

  // 🌟 CÔNG THỨC GIÁ BÁN & TỔNG TIỀN
  const { area, unitPrice, lineTotal } = useMemo(() => {
    const qty = parseInt(quantity, 10) || 0
    const customCalculatedSell = Math.round(costResult.grandTotal / 0.35)

    // Khung tiêu chuẩn: Ưu tiên lấy giá niêm yết theo size từ DB (standardPrice).
    // Nếu không có mới tính = Giá vốn / 0.35
    const sell = (mode === 'simple' && standardPrice && standardPrice > 0) 
      ? standardPrice 
      : customCalculatedSell
    
    return {
      area: costResult.areaM2,
      unitPrice: sell,
      lineTotal: sell * qty,
    }
  }, [costResult, quantity, standardPrice, mode])

  // GIÁ VỐN CHỈ HIỂN THỊ CHO ADMIN VỚI TẤT CẢ CÁC MODE
  const customCostDisplay = isAdmin ? costResult.grandTotal : null
  const customCostDisplayLabel = isAdmin ? 'Giá vốn' : 'Giá bán'

  const previewImage = activeGetImage(mode === 'simple' ? khungCategory : null, activeKhungType, sizeLabel)

  const hasAnyComponent = mode === 'moebe' ? true : Object.values(activeToggles).some(Boolean)
  const canAdd =
    activeWidth > 0 &&
    activeHeight > 0 &&
    (parseInt(quantity, 10) || 0) > 0 &&
    hasAnyComponent

  const handleSelectExistingProduct = (name) => {
    setProductName(name)
  }

  const handleToggleChange = (key, value) => {
    setToggles((prev) => ({ ...prev, [key]: value }))
  }

  const handleSelectionChange = (key, value) => {
    if (mode === 'moebe') {
      setMoebeSelections((prev) => ({ ...prev, [key]: value }))
    } else {
      setSelections((prev) => ({ ...prev, [key]: value }))
      if (key === 'khungType') {
        const newSizeOptions = activeGetSizes(value)
        if (newSizeOptions.length > 0) {
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
      const cat = Object.keys(activeTypesByCategory).find(k => activeTypesByCategory[k].includes(selections.khungType))
      if (cat) setKhungCategory(cat)
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
    
    const newSizeOptions = activeGetSizes(newKhungType)
    if (newSizeOptions.length > 0) {
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
    
    const defaultSizes = activeGetSizes(nextTypeForCategory)
    if (defaultSizes.length > 0) {
      const firstLabel = typeof defaultSizes[0] === 'object' ? defaultSizes[0].label : defaultSizes[0]
      setSizeLabel(firstLabel)
    }

    setQuantity('1')
    setToggles(defaultToggles)
    setSelections({
      ...defaultSelections,
      khungType: mode === 'simple' && nextTypeForCategory ? nextTypeForCategory : defaultSelections.khungType,
    })
  }

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const itemsSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.lineTotal, 0),
    [items]
  )
  const itemsCost = useMemo(
    () => items.reduce((sum, item) => sum + item.cost, 0),
    [items]
  )
  const discount = Math.min(100, Math.max(0, parseFloat(discountPercent) || 0))
  const itemsTotal = itemsSubtotal * (1 - discount / 100)
  const profit = itemsTotal - itemsCost
  const margin = itemsTotal > 0 ? (profit / itemsTotal) * 100 : 0

  const canExport = items.length > 0 

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
    })
    setExportMessage(
      `Đã lưu báo giá cho "${customerName.trim() || 'khách lẻ'}". Bắt đầu đơn mới.`
    )
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
    onToggleChange: handleToggleChange,
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
    imageSrc: previewImage,
    costDisplay: customCostDisplay,
    costDisplayLabel: customCostDisplayLabel,
    isAdmin,
    matchedStandardSizeLabel: (mode === 'simple' && matchedStandardSize) ? matchedStandardSize.label : null,
  }

  return (
    <div className="min-h-screen bg-paper font-body flex">
      <Sidebar
        view={view}
        onViewChange={setView}
        isAdmin={isAdmin}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLoginClick={() => setShowLogin(true)}
        onLogout={handleLogout}
        user={user}
        onAddProductClick={() => setIsAddProductModalOpen(true)}
        onCreateAdminClick={() => setIsCreateAdminModalOpen(true)}
        onManageProductsClick={() => setIsManageProductsModalOpen(true)}
      />

      <div className="flex-1 min-w-0 pb-28 lg:pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 lg:pt-10 pb-6">
          <QuoteHeader onMenuClick={() => setSidebarOpen(true)} />
        </div>

        {view === 'history' ? (
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <OrderHistory 
              orders={orders} 
              onDelete={deleteOrder} 
              isAdmin={isAdmin} 
              onUpdateStatus={updateOrderStatus}
            />
          </div>
        ) : (
          <>
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <CustomerInfo value={customerName} onChange={setCustomerName} />
            </div>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-6 items-start">
              <QuoteForm mode={mode} onModeChange={handleModeChange} {...formProps} />

              <div className="hidden lg:block lg:sticky lg:top-6">
                <ResultPanel {...resultPanelProps} />
              </div>
            </main>

            <div className="lg:hidden max-w-5xl mx-auto px-4 sm:px-6 mt-6">
              <ResultPanel {...resultPanelProps} />
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
              <h2 className="font-display font-semibold text-lg text-blueprint mb-3">
                Danh sách báo giá
              </h2>
              <ProductListTable
                items={items}
                onRemove={handleRemoveItem}
                itemsSubtotal={itemsSubtotal}
              />
              <OrderDiscountSummary
                itemsSubtotal={itemsSubtotal}
                discountPercent={discountPercent}
                onDiscountChange={setDiscountPercent}
                itemsTotal={itemsTotal}
                disabled={items.length === 0}
              />
              <ExportQuoteButton
                onExport={handleExport}
                disabled={!canExport}
                message={exportMessage}
              />
            </div>

            {isAdmin && (
              <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <AdminPanel itemsCost={itemsCost} itemsTotal={itemsTotal} />
                <FrameCostCalculator
                  settings={settings}
                  updateSetting={updateSetting}
                  resetSettings={resetSettings}
                  standardPrices={standardPrices}
                  updateStandardPrice={updateStandardPrice}
                  resetStandardPrices={resetStandardPrices}
                  typeRates={typeRates}
                  updateTypeRate={updateTypeRate}
                  resetTypeRates={resetTypeRates}
                />
              </div>
            )}
          </>
        )}

        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-blueprint text-paper px-4 py-3 flex items-center justify-between border-t border-paper/10">
          <span className="font-mono text-xs uppercase tracking-widest text-paper/60">
            Tổng đơn ({items.length} SP)
          </span>
          <span className="font-mono text-xl font-bold text-amber">
            {formatVND(itemsTotal)}
          </span>
        </div>
      </div>

      {showLogin && (
        <AdminLogin 
          onLogin={handleLogin} 
          onCancel={() => setShowLogin(false)}
        />
      )}

      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
      />

      <CreateAdminModal
        isOpen={isCreateAdminModalOpen}
        onClose={() => setIsCreateAdminModalOpen(false)}
      />

      <ManageProductsModal
        isOpen={isManageProductsModalOpen}
        onClose={() => setIsManageProductsModalOpen(false)}
      />
    </div>
  )
}