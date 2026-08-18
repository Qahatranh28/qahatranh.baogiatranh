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

  const itemsSubtotal = useMemo(() => items.reduce((sum, item) => sum + item.lineTotal, 0), [items])
  const itemsCost = useMemo(() => items.reduce((sum, item) => sum + item.cost, 0), [items])
  const discount = Math.min(100, Math.max(0, parseFloat(discountPercent) || 0))

  const { fee: palletPackagingFee } = useMemo(
    () => computePalletPackagingFee({ enabled: palletPackagingEnabled, tierId: palletPackagingTierId }),
    [palletPackagingEnabled, palletPackagingTierId]
  )

  const itemsTotal = itemsSubtotal * (1 - discount / 100) + palletPackagingFee
  const profit = itemsTotal - itemsCost
  const margin = itemsTotal > 0 ? (profit / itemsTotal) * 100 : 0
  const canExport = isAdmin && items.length > 0

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
