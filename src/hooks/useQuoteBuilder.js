import { useState } from 'react'
import { useAdminAuth } from './useAdminAuth.js'
import { useOrders } from './useOrders.js'
import { useProductCatalog } from './useProductCatalog.js'
import { useFrameSettings } from './useFrameSettings.js'
import { useStandardPrices } from './useStandardPrices.js'
import { useTypeRates } from './useTypeRates.js'
import { khungCategoryOptions, getKhungTypesByCategory } from '../data/khungCatalog.js'
import { useQuoteMaterials } from './quote/useQuoteMaterials.js'
import { useSimpleCustomQuoteState } from './quote/useSimpleCustomQuoteState.js'
import { useMoebeQuoteState } from './quote/useMoebeQuoteState.js'
import { useJerseyQuoteState } from './quote/useJerseyQuoteState.js'
import { useQuoteCart } from './quote/useQuoteCart.js'

export function useQuoteBuilder() {
  const [isManageProductsModalOpen, setIsManageProductsModalOpen] = useState(false)
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [mode, setMode] = useState('simple')
  const [showLogin, setShowLogin] = useState(false)
  const [view, setView] = useState('create')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { user, isAdmin, login, logout } = useAdminAuth()
  const isSaleRole = isAdmin && user?.role === 'sale'
  const canSeeCost = isAdmin && user?.role !== 'sale'
  // 🌟 canSeeMargin: CHỈ role admin — editor "làm mọi thứ" như admin (canSeeCost
  // vẫn đúng cho editor) nhưng KHÔNG được xem giá vốn/biên lợi nhuận/chi tiết vật tư.
  const canSeeMargin = isAdmin && user?.role === 'admin'
  const { orders, saveOrder, deleteOrder, updateOrderStatus } = useOrders()
  const { settings, updateSetting, resetSettings } = useFrameSettings()
  const { standardPrices, updateStandardPrice, resetStandardPrices } = useStandardPrices()
  const { typeRates, updateTypeRate, resetTypeRates } = useTypeRates()

  const {
    categories: activeCategories,
    typesByCategory: activeTypesByCategory,
    getStandardSizesForType: activeGetSizes,
    getFrameImage: activeGetImage,
    getMaterialImage: activeGetMaterialImage,
    rawCatalog,
  } = useProductCatalog()

  const {
    dbMaterialsList,
    dynamicTranhInOptions,
    dynamicVanOptions,
    dynamicGiayBoOptions,
    dynamicGlassMicaOptions,
  } = useQuoteMaterials()

  const simpleCustom = useSimpleCustomQuoteState({
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
    // 🌟 canSeeCost ở đây quyết định có tính/hiện costDisplay (Giá vốn) hay
    // không — cố tình truyền canSeeMargin (chỉ admin) thay vì canSeeCost
    // (admin+editor) để editor không thấy giá vốn trong ResultPanel.
    canSeeCost: canSeeMargin,
  })

  const moebe = useMoebeQuoteState({ settings, dbMaterialsList, canSeeCost: canSeeMargin })
  const jersey = useJerseyQuoteState({ settings, dbMaterialsList, canSeeCost: canSeeMargin })

  const cart = useQuoteCart({ isAdmin, user, saveOrder })

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    if (nextMode === 'simple' || nextMode === 'custom') {
      simpleCustom.handleModeChangeSideEffects(nextMode)
    }
  }

  const handleAddItem = () => {
    if (!isAdmin) return
    let item = null
    if (mode === 'moebe') {
      if (!moebe.canAdd) return
      item = moebe.buildCartItem()
      moebe.reset()
    } else if (mode === 'jersey') {
      if (!jersey.canAdd) return
      item = jersey.buildCartItem()
      jersey.reset()
    } else {
      if (!simpleCustom.canAdd) return
      item = simpleCustom.buildCartItem()
      const nextCategory = activeCategories[0] || khungCategoryOptions[0]
      const nextType =
        (activeTypesByCategory[nextCategory] || getKhungTypesByCategory(nextCategory) || [])[0]
      simpleCustom.reset(nextCategory, mode === 'simple' ? nextType : undefined)
      const defaultSizes = (typeof activeGetSizes === 'function' ? activeGetSizes(nextType) : []) || []
      if (defaultSizes.length > 0) {
        const firstLabel = typeof defaultSizes[0] === 'object' ? defaultSizes[0].label : defaultSizes[0]
        simpleCustom.setSizeLabel(firstLabel)
      }
    }
    if (item) cart.addItem(item)
  }

  const activeState =
    mode === 'moebe' ? moebe : mode === 'jersey' ? jersey : simpleCustom

  const formProps = {
    productName: activeState.productName,
    onProductNameChange: activeState.setProductName,
    productNameOptions: mode === 'moebe' || mode === 'jersey' ? [] : simpleCustom.productNameOptions,
    width: activeState.width ?? String(activeState.activeWidth || ''),
    height: activeState.height ?? String(activeState.activeHeight || ''),
    quantity: activeState.quantity,
    onQuantityChange: activeState.setQuantity,
    toggles: activeState.toggles,
    onToggleChange: activeState.handleToggleChange,
    setWidth: activeState.setWidth,
    setHeight: activeState.setHeight,
    getMaterialImage: activeGetMaterialImage,

    // Simple / Custom
    ...(mode === 'simple' || mode === 'custom'
      ? {
          selections: simpleCustom.selections,
          khungCategory: simpleCustom.khungCategory,
          sizeLabel: simpleCustom.sizeLabel,
          categoryOptions: activeCategories.length > 0 ? activeCategories : khungCategoryOptions,
          typeOptions: simpleCustom.currentTypeOptions,
          sizeOptions: simpleCustom.currentSizes,
          khungTypeOptions: simpleCustom.allKhungTypes,
          tranhInTypeOptions: dynamicTranhInOptions,
          vanTypeOptions: dynamicVanOptions,
          giayBoTypeOptions: dynamicGiayBoOptions,
          glassMicaOptions: dynamicGlassMicaOptions,
          tranhInYoutubeUrl: simpleCustom.tranhInMat.youtubeUrl,
          glassMicaYoutubeUrl: simpleCustom.glassMat.youtubeUrl,
          vanYoutubeUrl: simpleCustom.vanMat.youtubeUrl,
          giayBoYoutubeUrl: simpleCustom.giayBoMat.youtubeUrl,
          onProductNameChange: simpleCustom.setProductName,
          onWidthChange: simpleCustom.setWidth,
          onHeightChange: simpleCustom.setHeight,
          onSelectionChange: simpleCustom.handleSelectionChange,
          onKhungCategoryChange: simpleCustom.handleKhungCategoryChange,
          onKhungTypeChange: (v) => simpleCustom.handleSelectionChange('khungType', v),
          onSizeChange: simpleCustom.setSizeLabel,
          isOddSize: simpleCustom.isOddSize,
          oddWidth: simpleCustom.oddWidth,
          oddHeight: simpleCustom.oddHeight,
          oddSizeMatchLabel: simpleCustom.oddSizeMatch?.label ?? null,
          onToggleOddSize: (v) => {
            simpleCustom.setIsOddSize(v)
            if (!v) {
              simpleCustom.setOddWidth('')
              simpleCustom.setOddHeight('')
            }
          },
          onOddWidthChange: simpleCustom.setOddWidth,
          onOddHeightChange: simpleCustom.setOddHeight,
          // 🌟 Bật/tắt In tranh riêng cho Khung tiêu chuẩn (giống Moebe)
          tranhInOn: simpleCustom.simpleTranhInOn,
          onToggleTranhIn: simpleCustom.onToggleSimpleTranhIn,
        }
      : {}),

    // Moebe
    ...(mode === 'moebe'
      ? {
          frameTypes: moebe.frameTypes,
          selectedFrameId: moebe.selectedFrameId,
          onFrameChange: moebe.setSelectedFrameId,
          sizeOptions: moebe.sizeOptions,
          selectedSizeId: moebe.selectedSizeId,
          onSizeChange: moebe.setSelectedSizeId,
          selectedSize: moebe.selectedSize,
          printWidth: moebe.printWidth,
          printHeight: moebe.printHeight,
          onPrintWidthChange: moebe.setPrintWidth,
          onPrintHeightChange: moebe.setPrintHeight,
          tranhInLabel: moebe.tranhInLabel,
          // 🌟 Size lẻ (giống Khung tiêu chuẩn)
          isOddSize: moebe.isOddSize,
          oddWidth: moebe.oddWidth,
          oddHeight: moebe.oddHeight,
          oddSizeMatch: moebe.oddSizeMatch,
          onToggleOddSize: moebe.onToggleOddSize,
          onOddWidthChange: moebe.onOddWidthChange,
          onOddHeightChange: moebe.onOddHeightChange,
        }
      : {}),

    // Jersey
    ...(mode === 'jersey'
      ? {
          tier: jersey.tier,
          onTierChange: jersey.setTier,
          frameTypes: jersey.frameTypes,
          filteredFrameTypes: jersey.filteredFrameTypes,
          selectedCategory: jersey.selectedCategory,
          onFrameCategoryChange: jersey.handleFrameCategoryChange,
          categoryOptions: jersey.categoryOptions,
          selectedFrameId: jersey.selectedFrameId,
          onFrameChange: jersey.setSelectedFrameId,
          selectedFrame: jersey.selectedFrame,
          jerseyPrices: jersey.jerseyPrices,
          selectedJerseySizeId: jersey.selectedJerseySizeId,
          onJerseySizeChange: jersey.setSelectedJerseySizeId,
          selectedJerseySize: jersey.selectedJerseySize,
          onWidthChange: jersey.setWidth,
          onHeightChange: jersey.setHeight,
        }
      : {}),
  }

  const resultPanelProps = {
    width: activeState.activeWidth,
    height: activeState.activeHeight,
    quantity: parseInt(activeState.quantity, 10) || 0,
    area: activeState.area,
    toggles: activeState.toggles,
    unitPrice: activeState.unitPrice,
    lineTotal: activeState.lineTotal,
    onAdd: handleAddItem,
    canAdd: isAdmin && activeState.canAdd,
    canOrder: isAdmin,
    imageSrc: mode === 'jersey' ? jersey.previewImage : activeState.previewImage,
    costDisplay: activeState.costDisplay,
    costDisplayLabel: canSeeMargin ? 'Giá vốn' : 'Giá bán',
    isAdmin: canSeeMargin,
    matchedStandardSizeLabel:
      mode === 'simple' && simpleCustom.isOddSize && simpleCustom.oddSizeMatch
        ? simpleCustom.oddSizeMatch.label
        : mode === 'moebe' && moebe.isOddSize && moebe.oddSizeMatch
        ? moebe.oddSizeMatch.label
        : null,
    hideArea: mode === 'jersey',
    mode,
    costResult: activeState.costResult,
    khungType: activeState.selections?.khungType || activeState.selectedFrame?.name || '',
    // 🌟 Ô "Chi tiết vật tư cấu thành" chỉ hiển thị khi role thực sự là admin
    // (không hiện với editor/sale), khác với `canSeeCost` vốn cho cả editor.
    isAdminRole: canSeeMargin,
  }

  return {
    isManageProductsModalOpen,
    setIsManageProductsModalOpen,
    isAddProductModalOpen,
    setIsAddProductModalOpen,
    isCreateAdminModalOpen,
    setIsCreateAdminModalOpen,
    customerName,
    setCustomerName,
    view,
    setView,
    sidebarOpen,
    setSidebarOpen,
    showLogin,
    setShowLogin,
    exportMessage: cart.exportMessage,
    mode,
    handleModeChange,
    user,
    isAdmin,
    canSeeCost,
    canSeeMargin,
    isSaleRole,
    handleLogin: login,
    handleLogout: logout,
    orders,
    deleteOrder,
    updateOrderStatus,
    items: cart.items,
    handleRemoveItem: cart.handleRemoveItem,
    itemsSubtotal: cart.itemsSubtotal,
    itemsCost: cart.itemsCost,
    itemsTotal: cart.itemsTotal,
    discountPercent: cart.discountPercent,
    setDiscountPercent: cart.setDiscountPercent,
    palletPackagingEnabled: cart.palletPackagingEnabled,
    onPalletPackagingToggle: cart.onPalletPackagingToggle,
    palletPackagingTierId: cart.palletPackagingTierId,
    onPalletPackagingTierChange: cart.onPalletPackagingTierChange,
    palletPackagingFee: cart.palletPackagingFee,
    canExport: cart.canExport,
    handleExport: () => {
      cart.handleExport(customerName)
      setCustomerName('')
    },
    settings,
    updateSetting,
    resetSettings,
    standardPrices,
    updateStandardPrice,
    resetStandardPrices,
    typeRates,
    updateTypeRate,
    resetTypeRates,
    formProps,
    resultPanelProps,
  }
}