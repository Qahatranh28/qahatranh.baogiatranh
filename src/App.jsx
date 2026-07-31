import { useMemo, useState } from 'react'
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
  tranhInTypeOptions,
  micaKinhTypeOptions,
  micaKinhLyOptions,
  vanLyOptions,
  giayBoTypeOptions,
  isKinhType,
  isNhomType,
  getTranhInTypeRate,
} from './data/frameDefaults.js'
import { computeFrameCost } from './utils/frameCosting.js'
import {
  getKhungTypeRate,
  khungCategoryOptions,
  getKhungTypesByCategory,
  getCategoryForKhungType,
  getStandardPrice,
  getStandardSizeOptions,
  defaultStandardSizeOptions,
  getKhungImage,
  findNearestStandardSize,
} from './data/khungCatalog.js'

const defaultToggles = Object.fromEntries(
  frameComponentToggles.map((t) => [t.key, t.default])
)

const simpleToggles = Object.fromEntries(
  frameComponentToggles.map((t) => [t.key, t.key === 'khung'])
)

const defaultSelections = {
  khungType: khungTypeOptions[0],
  tranhInType: tranhInTypeOptions[0],
  micaKinhType: micaKinhTypeOptions[0],
  micaKinhLy: micaKinhLyOptions[0],
  vanLy: vanLyOptions[0],
  giayBoType: giayBoTypeOptions[0],
}

export default function App() {
  const [customerName, setCustomerName] = useState('')
  const [mode, setMode] = useState('simple') 
  const [khungCategory, setKhungCategory] = useState(khungCategoryOptions[0])
  
  // Khởi tạo sizeLabel dựa trên loại khung mặc định đầu tiên
  const [sizeLabel, setSizeLabel] = useState(
    () => getStandardSizeOptions(defaultSelections.khungType)[0]?.label || ''
  )
  
  const [productName, setProductName] = useState('')
  const [width, setWidth] = useState('') 
  const [height, setHeight] = useState('') 
  const [quantity, setQuantity] = useState('1')
  const [toggles, setToggles] = useState(defaultToggles)
  const [selections, setSelections] = useState(() => ({
    ...defaultSelections,
    khungType: getKhungTypesByCategory(khungCategoryOptions[0])[0] || defaultSelections.khungType,
  }))
  const [discountPercent, setDiscountPercent] = useState('0')
  const [items, setItems] = useState([])
  const [showLogin, setShowLogin] = useState(false)
  const [view, setView] = useState('create') 
  const [exportMessage, setExportMessage] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { isAdmin, login, logout } = useAdminAuth()
  const { orders, saveOrder, deleteOrder } = useOrders()
  const { names: productNameOptions } = useProductCatalog(orders)
  const { settings, updateSetting, resetSettings } = useFrameSettings()
  const { prices: standardPrices, updatePrice: updateStandardPrice, resetPrices: resetStandardPrices } =
    useStandardPrices()
  const { typeRates, updateTypeRate, resetTypeRates } = useTypeRates()

  const activeToggles = mode === 'simple' ? simpleToggles : toggles
  const isKinh = isKinhType(selections.micaKinhType)
  const isNhom = isNhomType(selections.khungType)

  // ✅ LẤY KÍCH THƯỚC DỰA TRÊN LOẠI KHUNG CỤ THỂ (VD: 'Khung gỗ đỏ')
  const currentSizes = getStandardSizeOptions(selections.khungType)
  const selectedPreset =
    currentSizes.find((o) => o.label === sizeLabel) || currentSizes[0] || { width: 0, height: 0 }
    
  const activeWidth = mode === 'simple' ? selectedPreset.width : parseFloat(width) || 0
  const activeHeight = mode === 'simple' ? selectedPreset.height : parseFloat(height) || 0

  const isOversizeCustom = mode === 'custom' && (activeWidth > 100 || activeHeight > 100)
  const matchedStandardSize =
    mode === 'custom' && !isOversizeCustom
      ? findNearestStandardSize(activeWidth, activeHeight, selections.khungType)
      : null

  const pricingWidth = matchedStandardSize ? matchedStandardSize.width : activeWidth
  const pricingHeight = matchedStandardSize ? matchedStandardSize.height : activeHeight

  const khungRateOverride = typeRates.khung[selections.khungType]
  const khungRate =
    khungRateOverride !== '' && khungRateOverride != null
      ? Number(khungRateOverride)
      : getKhungTypeRate(selections.khungType, settings.khungPerM)
  const tranhInRateOverride = typeRates.tranhIn[selections.tranhInType]
  const tranhInRate =
    tranhInRateOverride !== '' && tranhInRateOverride != null
      ? Number(tranhInRateOverride)
      : getTranhInTypeRate(selections.tranhInType, settings.tranhInPerM2)

  const standardPrice =
    mode === 'simple'
      ? getStandardPrice(standardPrices, selections.khungType, sizeLabel)
      : matchedStandardSize
      ? getStandardPrice(standardPrices, selections.khungType, matchedStandardSize.label)
      : null

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
        tranhInRate
      ),
    [pricingWidth, pricingHeight, activeToggles, settings, isKinh, khungRate, isNhom, tranhInRate]
  )

  const previewImage = activeToggles.khung
    ? getKhungImage(mode === 'simple' ? khungCategory : null, selections.khungType, sizeLabel)
    : null

 const { area, unitPrice, lineTotal } = useMemo(() => {
    const qty = parseInt(quantity, 10) || 0
    
    // 1. Tính giá bán theo công thức mới: Giá Vốn x 285.71% (x 2.8571)
    const formulaSell = Math.round(costResult.grandTotal * 2.8571)
    
    // 2. Chốt giá bán cuối cùng (Nếu có giá niêm yết chuẩn thì dùng giá chuẩn, 
    // nếu là size lẻ custom thì tự động dùng công thức nhân 2.8571 ở trên)
    const sell = standardPrice != null ? standardPrice : formulaSell
    
    return {
      area: costResult.areaM2,
      unitPrice: sell,
      lineTotal: sell * qty,
    }
  }, [costResult, quantity, standardPrice])
  // Chế độ Custom: Admin xem đúng giá vốn thực tế; người dùng bình thường
  // không cần thấy giá vốn — thay vào đó xem "Giá bán (tham khảo)" được tính
  // theo biên lợi nhuận cố định 65% so với giá vốn (giá bán = giá vốn x 1.65).
  const CUSTOM_REFERENCE_MARGIN_OVER_COST = 0.65
  const customCostDisplay =
    mode === 'custom'
      ? isAdmin
        ? costResult.grandTotal
        : costResult.grandTotal * (1 + CUSTOM_REFERENCE_MARGIN_OVER_COST)
      : null
  const customCostDisplayLabel = isAdmin ? 'Giá vốn' : 'Giá bán'

  const hasAnyComponent = Object.values(activeToggles).some(Boolean)
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

  // Cập nhật sizes khi đổi riêng Loại khung
  const handleSelectionChange = (key, value) => {
    setSelections((prev) => ({ ...prev, [key]: value }))
    if (key === 'khungType') {
      const newSizeOptions = getStandardSizeOptions(value)
      if (newSizeOptions.length > 0 && !newSizeOptions.some((o) => o.label === sizeLabel)) {
        setSizeLabel(newSizeOptions[0].label)
      }
    }
  }

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    if (nextMode === 'simple') {
      const cat = getCategoryForKhungType(selections.khungType)
      if (cat) setKhungCategory(cat)
    }
  }

  // Cập nhật sizes khi đổi Danh mục khung lớn
  const handleKhungCategoryChange = (category) => {
    setKhungCategory(category)
    const typesInCategory = getKhungTypesByCategory(category)
    
    let newKhungType = selections.khungType;
    if (typesInCategory.length && !typesInCategory.includes(selections.khungType)) {
      newKhungType = typesInCategory[0]
      setSelections((prev) => ({ ...prev, khungType: newKhungType }))
    }
    
    const newSizeOptions = getStandardSizeOptions(newKhungType)
    if (newSizeOptions.length > 0 && !newSizeOptions.some((o) => o.label === sizeLabel)) {
      setSizeLabel(newSizeOptions[0].label)
    }
  }

  const handleAddItem = () => {
    if (!canAdd) return
    const qty = parseInt(quantity, 10) || 1
    const name =
      mode === 'simple'
        ? `${khungCategory}${selections.khungType ? ` — ${selections.khungType}` : ''}`
        : productName.trim() || 'Sản phẩm khung tranh'

    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        mode,
        width: activeWidth,
        height: activeHeight,
        quantity: qty,
        toggles: { ...activeToggles },
        selections: { ...selections },
        unitPrice,
        lineTotal,
        cost: costResult.grandTotal * qty,
        costBreakdown: costResult,
      },
    ])
    const nextCategory = khungCategoryOptions[0]
    const nextTypeForCategory = getKhungTypesByCategory(nextCategory)[0]
    setProductName('')
    setKhungCategory(nextCategory)
    
    const defaultSizes = getStandardSizeOptions(nextTypeForCategory)
    if (defaultSizes.length > 0) {
      setSizeLabel(defaultSizes[0].label)
    }

    setWidth('')
    setHeight('')
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

  // Người dùng bình thường (không phải Admin) không được xuất báo giá nếu
  // mức chiết khấu đã đặt khiến biên lợi nhuận so với giá vốn (profit / giá
  // vốn) tụt xuống dưới 55%. Admin luôn được phép xuất bình thường vì đã
  // thấy đầy đủ giá vốn/lợi nhuận thực tế ở bảng "Chi tiết lợi nhuận".
  const MIN_MARGIN_OVER_COST_PERCENT = 55
  const isMarginTooLowForExport =
    items.length > 0 && margin < MIN_MARGIN_OVER_COST_PERCENT

  const canExport = items.length > 0 && !isMarginTooLowForExport

  const handleExport = () => {
    if (!canExport || isMarginTooLowForExport) return
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

  const handleLogin = (username, password) => {
    const success = login(username, password)
    if (success) setShowLogin(false)
    return success
  }

  const handleLogout = () => {
    logout()
  }

  const formProps =
    mode === 'simple'
      ? {
          khungCategory,
          khungType: selections.khungType,
          sizeLabel,
          categoryOptions: khungCategoryOptions,
          typeOptions: getKhungTypesByCategory(khungCategory),
          // ✅ TRUYỀN TÊN LOẠI KHUNG VÀO ĐỂ LẤY KÍCH THƯỚC CHUẨN XÁC
          sizeOptions: getStandardSizeOptions(selections.khungType),
          quantity,
          onKhungCategoryChange: handleKhungCategoryChange,
          onKhungTypeChange: (v) => handleSelectionChange('khungType', v),
          onSizeChange: setSizeLabel,
          onQuantityChange: setQuantity,
        }
      : {
          productName,
          width,
          height,
          quantity,
          toggles,
          selections,
          productNameOptions,
          onProductNameChange: setProductName,
          onSelectExistingProduct: handleSelectExistingProduct,
          onWidthChange: setWidth,
          onHeightChange: setHeight,
          onQuantityChange: setQuantity,
          onToggleChange: handleToggleChange,
          onSelectionChange: handleSelectionChange,
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
    matchedStandardSizeLabel: matchedStandardSize ? matchedStandardSize.label : null,
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
      />

      <div className="flex-1 min-w-0 pb-28 lg:pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 lg:pt-10 pb-6">
          <QuoteHeader onMenuClick={() => setSidebarOpen(true)} />
        </div>

        {view === 'history' ? (
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <OrderHistory orders={orders} onDelete={deleteOrder} isAdmin={isAdmin} />
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
                warning={
                  isMarginTooLowForExport
                    ? `Mức chiết khấu hiện tại khiến biên lợi nhuận so với giá vốn dưới ${MIN_MARGIN_OVER_COST_PERCENT}% — vui lòng giảm chiết khấu để có thể xuất báo giá.`
                    : ''
                }
              />
              <ExportQuoteButton
                onExport={handleExport}
                disabled={!canExport}
                message={exportMessage}
                warning={
                  isMarginTooLowForExport
                    ? `Không thể xuất báo giá: biên lợi nhuận so với giá vốn dưới ${MIN_MARGIN_OVER_COST_PERCENT}%.`
                    : ''
                }
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
        <AdminLogin onLogin={handleLogin} onClose={() => setShowLogin(false)} />
      )}
    </div>
  )
}