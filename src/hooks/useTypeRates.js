import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
// Import giá tranh in mặc định làm dự phòng
import { tranhInTypeRates as defaultTranhInRates } from '../data/frameDefaults.js'

export function useTypeRates() {
  const [typeRates, setTypeRates] = useState({ khung: {}, tranhIn: { ...defaultTranhInRates } })

  // 1. TẢI GIÁ GỐC CỦA KHUNG VÀ TRANH IN TỪ SUPABASE
  useEffect(() => {
    async function fetchTypeRates() {
      try {
        // A. Lấy giá gốc của từng loại khung từ bảng frame_catalog
        const { data: khungData } = await supabase.from('frame_catalog').select('name, price_cost')
        const khungRates = {}
        if (khungData) {
          khungData.forEach(k => {
            if (k.cost_rate != null) khungRates[k.name] = Number(k.price_cost)
          })
        }

        // B. Lấy giá gốc của các loại tranh in từ bảng material
        // Lọc các vật tư có id_material bắt đầu bằng chữ "tranh_in"
        const { data: tranhData } = await supabase
          .from('material')
          .select('name, price_cost')
          .like('id_material', 'tranh_in%')
        
        const tranhRates = { ...defaultTranhInRates }
        if (tranhData) {
          tranhData.forEach(t => {
            if (t.price_cost != null) tranhRates[t.name] = Number(t.price_cost)
          })
        }

        setTypeRates({ khung: khungRates, tranhIn: tranhRates })
      } catch (err) {
        console.error('Lỗi khi tải giá gốc Type Rates:', err.message)
      }
    }

    fetchTypeRates()
  }, [])

  // 2. CẬP NHẬT GIÁ GỐC KHI ADMIN SỬA SỐ TRÊN GIAO DIỆN
  const updateTypeRate = async (category, typeName, value) => {
    const numValue = (value === '' || value === null) ? null : Number(value)

    // Cập nhật giao diện lập tức cho mượt
    setTypeRates(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [typeName]: numValue
      }
    }))

    // Lưu vào đúng bảng tương ứng trên Supabase
    try {
      if (category === 'khung') {
        const { error } = await supabase
          .from('frame_catalog')
          .update({ price_cost: numValue })
          .eq('name', typeName)
          
        if (error) throw error
      } else if (category === 'tranhIn') {
        const { error } = await supabase
          .from('material')
          .update({ price_cost: numValue })
          .eq('name', typeName)
          
        if (error) throw error
      }
    } catch (err) {
      console.error(`Lỗi cập nhật giá gốc cho [${typeName}]:`, err.message)
    }
  }

  // 3. KHÔI PHỤC GIÁ GỐC VỀ MẶC ĐỊNH
  const resetTypeRates = async () => {
    // Có thể cấu hình logic reset nâng cao ở đây nếu Admin cần
    console.log('Đã gọi hàm khôi phục giá gốc')
  }

  return { typeRates, updateTypeRate, resetTypeRates }
}