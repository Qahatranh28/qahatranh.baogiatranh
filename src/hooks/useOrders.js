import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

export function useOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // 1. TẢI LỊCH SỬ BÁO GIÁ TỪ SUPABASE
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      // Tải danh sách đơn hàng từ bảng 'oders'
      const { data: ordersData, error: ordersError } = await supabase
        .from('oders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map(o => o.id_oder)

        // Tải chi tiết từ bảng 'order_items'
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds)

        if (itemsError) throw itemsError

        // Ghép nối dữ liệu 2 bảng
        const formattedOrders = ordersData.map(order => {
          const rawItems = (itemsData || []).filter(item => item.order_id === order.id_oder)

          const items = rawItems.map(oi => {
            let w = 0, h = 0
            if (oi.size_name) {
              const matches = oi.size_name.match(/([\d.]+)\s*x\s*([\d.]+)/)
              if (matches) {
                w = parseFloat(matches[1])
                h = parseFloat(matches[2])
              }
            }

            const breakdown = oi.item_breakdown_data && typeof oi.item_breakdown_data === 'object' 
              ? oi.item_breakdown_data 
              : {}

            return {
              id: oi.id_item,
              name: oi.product_name || 'Sản phẩm',
              quantity: oi.quantity || 1,
              unitPrice: oi.unit_price || 0,
              lineTotal: oi.total_item_revenue || 0,
              cost: Number(oi.item_cost_price) || 0,
              width: w,
              height: h,
              costBreakdown: breakdown,
              ...breakdown
            }
          })

          const totalCost = items.reduce((sum, item) => sum + (item.cost * (item.quantity || 1)), 0)

          const orderDate = order.created_at || new Date().toISOString()

          return {
            id: order.id_oder,
            customerName: order.customer_name || 'Khách lẻ',
            items: items,
            // 🌟 items_subtotal = tổng tiền TRƯỚC chiết khấu/pallet (nếu bản ghi cũ
            // chưa có cột này thì tạm lấy lại total_revenue như trước để không vỡ layout).
            itemsSubtotal:
              order.items_subtotal !== null && order.items_subtotal !== undefined
                ? Number(order.items_subtotal) || 0
                : order.total_revenue || 0,
            itemsTotal: order.total_revenue || 0,
            itemsCost: totalCost,
            profit: order.total_profit || 0,
            margin: order.profit_margin || 0,
            createdAt: orderDate,
            date: orderDate, // Đảm bảo hỗ trợ cả biến date nếu component cũ cần
            status: order.status || 'chua_chot',
            idUser: order.id_user ?? null, // 🌟 định danh sale đã tạo báo giá này
            // 🌟 Đọc lại phí đóng gói Pallet đã lưu — để OrderHistory hiện đúng dòng này.
            palletPackagingFee: Number(order.pallet_packaging_fee) || 0,
            palletPackagingTierId: order.pallet_packaging_tier_id ?? null,
            // 🌟 Đọc lại % chiết khấu đã lưu — để OrderHistory hiện đúng dòng "Chiết khấu".
            discountPercent: Number(order.discount_percent) || 0,
          }
        })
        
        setOrders(formattedOrders)
      } else {
        setOrders([])
      }
    } catch (err) {
      console.error('Lỗi khi tải lịch sử báo giá:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // 2. LƯU BÁO GIÁ MỚI LÊN SUPABASE
  const saveOrder = async (orderData) => {
    try {
      const { data: newOrder, error: orderError } = await supabase
        .from('oders')
        .insert([{ 
          customer_name: orderData.customerName || 'Khách lẻ', 
          total_items_count: orderData.items ? orderData.items.length : 0,
          total_revenue: orderData.itemsTotal || 0,
          total_profit: orderData.profit || 0,
          profit_margin: orderData.margin || 0,
          status: 'chua_chot',
          id_user: orderData.idUser ?? null, // 🌟 gắn báo giá này với user (sale) đang đăng nhập
          // 🌟 Lưu phí đóng gói Pallet để Lịch sử báo giá hiện lại được đúng dòng này.
          // ⚠️ Cần đảm bảo bảng 'oders' đã có các cột sau (nếu chưa có, hãy thêm trên Supabase):
          //   - pallet_packaging_fee (numeric), pallet_packaging_tier_id (text)
          //   - discount_percent (numeric) — % chiết khấu đã áp dụng
          //   - items_subtotal (numeric) — tổng tiền TRƯỚC chiết khấu/pallet
          pallet_packaging_fee: orderData.palletPackagingFee || 0,
          pallet_packaging_tier_id: orderData.palletPackagingTierId ?? null,
          discount_percent: orderData.discountPercent || 0,
          items_subtotal: orderData.itemsSubtotal || 0,
        }])
        .select()
        .single() 

      if (orderError) throw orderError

      const orderId = newOrder.id_oder

      if (orderData.items && orderData.items.length > 0) {
        const itemsToInsert = orderData.items.map(item => ({
          order_id: Number(orderId),                      
          product_name: item.name || 'Sản phẩm khung',    
          size_name: `${item.width || 0} x ${item.height || 0} cm`, 
          quantity: item.quantity || 1,                   
          unit_price: item.unitPrice || 0,                
          total_item_revenue: item.lineTotal || 0,        
          item_cost_price: item.cost || 0,                
          item_breakdown_data: item.costBreakdown || null 
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      await fetchOrders()
      return true
    } catch (err) {
      console.error('Lỗi khi lưu báo giá:', err.message)
      return false
    }
  }

  // 3. XOÁ BÁO GIÁ
  const deleteOrder = async (id) => {
    try {
      await supabase.from('order_items').delete().eq('order_id', id)
      const { error } = await supabase.from('oders').delete().eq('id_oder', id)
      
      if (error) throw error
      
      setOrders(prev => prev.filter(o => o.id !== id))
      return true
    } catch (err) {
      console.error('Lỗi khi xoá báo giá:', err.message)
      return false
    }
  }

  // 4. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (Đã chốt / Chưa chốt)
  const updateOrderStatus = async (orderId, newStatus) => {
    console.log("👉 Đang gọi update với ID:", orderId, "và trạng thái mới:", newStatus);

    try {
      const { data, error } = await supabase
        .from('oders')
        .update({ status: newStatus })
        .eq('id_oder', orderId)
        .select() // Thêm .select() để xem Supabase có thực sự update được dòng nào không

      console.log("👉 Kết quả Supabase trả về sau update:", { data, error });

      if (error) {
        console.error('Lỗi Supabase:', error.message)
        return false
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ Cảnh báo: Supabase không tìm thấy dòng nào khớp với id_oder này để update!')
      }

      setOrders((prevOrders) =>
        prevOrders.map((ord) =>
          ord.id === orderId ? { ...ord, status: newStatus } : ord
        )
      )
      return true
    } catch (err) {
      console.error('Lỗi kết nối:', err)
      return false
    }
  }

  return { orders, saveOrder, deleteOrder, updateOrderStatus, loading, refreshOrders: fetchOrders }
}