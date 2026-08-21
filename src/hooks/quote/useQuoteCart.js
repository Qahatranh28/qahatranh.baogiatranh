import { useState, useMemo, useCallback } from 'react'
import {
  computePalletPackagingFee,
  PALLET_PACKAGING_TIERS,
} from '../../services/palletPackagingService.js'

export function useQuoteCart({ isAdmin, user, saveOrder }) {
  const [items, setItems] = useState([])
  const [discountPercent, setDiscountPercent] = useState('0')
  const [palletPackagingEnabled, setPalletPackagingEnabled] = useState(false)
  const [palletPackagingTierId, setPalletPackagingTierId] = useState(null)
  const [exportMessage, setExportMessage] = useState('')

  const handleRemoveItem = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const addItem = useCallback((item) => {
    setItems((prev) => [...prev, item])
  }, [])

  // 🌟 1. Đưa hàm tính phí pallet lên TRƯỚC để tránh lỗi khởi tạo
  const { fee: palletPackagingFee } = useMemo(
    () => computePalletPackagingFee({ enabled: palletPackagingEnabled, tierId: palletPackagingTierId }),
    [palletPackagingEnabled, palletPackagingTierId]
  )

  // 🌟 2. Sau đó mới tính itemsSubtotal (có cộng dồn luôn tiền Pallet vào Tạm tính)
  const itemsSubtotal = useMemo(() => {
    const base = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
    const palletFee = Number(palletPackagingFee) || 0;
    return base + palletFee;
  }, [items, palletPackagingFee]);

  const itemsCost = useMemo(() => items.reduce((sum, item) => sum + item.cost, 0), [items])
  const discount = Math.min(100, Math.max(0, parseFloat(discountPercent) || 0))

  // Lưu ý: Vì itemsSubtotal ở trên đã bao gồm tiền pallet, nên itemsTotal nhân chiết khấu xong ta không cộng thêm palletFee nữa để tránh bị cộng đúp
  const itemsTotal = itemsSubtotal * (1 - discount / 100)
  const profit = itemsTotal - itemsCost
  const margin = itemsTotal > 0 ? (profit / itemsTotal) * 100 : 0
  const isLowMargin = margin < 55 && itemsTotal > 0;
  const canExport = isAdmin && items.length > 0 && !isLowMargin;

  const handlePalletPackagingToggle = useCallback((checked) => {
    setPalletPackagingEnabled(checked)
    if (checked) {
      setPalletPackagingTierId((prev) => prev || PALLET_PACKAGING_TIERS[0]?.id || null)
    } else {
      setPalletPackagingTierId(null)
    }
  }, [])

  const handleExport = useCallback(
    (customerName) => {
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
        palletPackagingFee,
        palletPackagingTierId: palletPackagingEnabled ? palletPackagingTierId : null,
        idUser: user?.id ?? null,
      })
      setExportMessage(`Đã lưu báo giá cho "${customerName.trim() || 'khách lẻ'}". Bắt đầu đơn mới.`)
      setItems([])
      setDiscountPercent('0')
      setPalletPackagingEnabled(false)
      setPalletPackagingTierId(null)
      setTimeout(() => setExportMessage(''), 4000)
    },
    [
      canExport,
      saveOrder,
      items,
      itemsSubtotal,
      discount,
      itemsTotal,
      itemsCost,
      profit,
      margin,
      palletPackagingFee,
      palletPackagingEnabled,
      palletPackagingTierId,
      user,
    ]
  )

  return {
    items,
    addItem,
    handleRemoveItem,
    itemsSubtotal,
    itemsCost,
    itemsTotal,
    discountPercent,
    setDiscountPercent,
    palletPackagingEnabled,
    onPalletPackagingToggle: handlePalletPackagingToggle,
    palletPackagingTierId,
    onPalletPackagingTierChange: setPalletPackagingTierId,
    palletPackagingFee,
    canExport,
    handleExport,
    exportMessage,
    setExportMessage,
  }
}