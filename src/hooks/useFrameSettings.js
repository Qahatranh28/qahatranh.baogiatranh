import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { defaultFrameSettings } from '../data/frameDefaults.js'

// Bảng ánh xạ TẤT CẢ dữ liệu từ DB sang State của React
const KEY_TO_MATERIAL_ID = {
  // 1. CÁC BIẾN VẬT TƯ CỐ ĐỊNH (Sử dụng chung)
  khungPerM: 'khung_per_m',
  kinhPerM2: 'kinh',
  satXiPerM: 'sat_xi',
  keGocPerBo: 'ke_goc',
  mocTreoPerCai: 'moc_treo',
  dayTreoPerM: 'day_treo',
  dinhGhimPerCai: 'dinh_ghim_oc_vit',
  peCuonPerKg: 'pe_cuon',
  xopBongKhiPerCay: 'xop_bong_khi',
  cartonPerKg: 'carton',
  bangKeoPerCay: 'bang_keo_trong',

  // 2. CÁC BIẾN MẶC ĐỊNH CHO NHÓM (Lấy 1 loại phổ biến làm đại diện)
  micaPerM2: 'mica_2ly',
  vanPerM2: 'van_4ly',
  giayBoPerM2: 'giay_bo_trang_0_8ly',

  // 3. CHI TIẾT TRANH IN
  tranhInGiayMyThuat: 'tranh_in_giay_my_thuật',
  tranhIn9LyMo: 'tranh_in_9ly_mo',
  tranhIn9LyBong: 'tranh_in_9ly_bong',
  tranhIn5LyMo: 'tranh_in_5ly_mo',
  tranhInFormex10LyBong: 'tranh_in_formex_10ly_bong',
  tranhInFormex10LyMo: 'tranh_in_formex_10ly_mo',
  tranhInCanvasDungSize: 'tranh_in_canvas_dung_size',
  tranhInCanvasTranVien: 'tranh_in_canvas_tran_vien',
  tranhInCanvasNoiHoanThien: 'tranh_in_canvas_noi_hoan_thien',

  // 4. CHI TIẾT MICA
  mica1_5Ly: 'mica_1_5ly',
  mica2Ly: 'mica_2ly',
  mica3Ly: 'mica_3ly',
  mica4Ly: 'mica_4ly',

  // 5. CHI TIẾT VÁN
  van2_5Ly: 'van_2_5ly',
  van4Ly: 'van_4ly',
  van8Ly: 'van_8ly',

  // 6. CHI TIẾT GIẤY BO
  giayBoMau0_8Ly: 'giay_bo_mau_0_8ly',
  giayBoTrang0_8Ly: 'giay_bo_trang_0_8ly',
  giayBoKem1_4Ly: 'giay_bo_kem_1_4ly',
  giayBo2Ly: 'giay_bo_2ly',
}

export function useFrameSettings() {
  const [settings, setSettings] = useState(defaultFrameSettings)
  const [loading, setLoading] = useState(true)

  // 1. KÉO DỮ LIỆU ĐƠN GIÁ TỪ BẢNG 'material' TRÊN SUPABASE
  useEffect(() => {
    async function fetchMaterials() {
      try {
        const { data, error } = await supabase
          .from('material')
          .select('id_material, price_cost')

        if (error) throw error

        if (data && data.length > 0) {
          const newSettings = { ...defaultFrameSettings }

          // Quét toàn bộ DB trả về, nếu khớp với KEY_TO_MATERIAL_ID thì gán vào State
          data.forEach((item) => {
            Object.keys(KEY_TO_MATERIAL_ID).forEach((key) => {
              if (KEY_TO_MATERIAL_ID[key] === item.id_material && item.price_cost != null) {
                newSettings[key] = Number(item.price_cost)
              }
            })
          })

          setSettings(newSettings)
        }
      } catch (err) {
        console.error('Lỗi khi tải bảng material từ Supabase:', err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [])

  // 2. CẬP NHẬT CỘT price_cost LÊN SUPABASE KHI ADMIN SỬA
  const updateSetting = async (key, value) => {
    const numValue = Number(value)

    // Cập nhật giao diện lập tức cho mượt
    setSettings((prev) => ({ ...prev, [key]: numValue }))

    const materialId = KEY_TO_MATERIAL_ID[key]
    
    // NẾU KEY KHÔNG CÓ TRONG BẢNG VẬT TƯ (như Lương nhân công, Lợi nhuận...) thì chỉ lưu ở React state (hoặc localStorage tùy bạn)
    if (!materialId) return

    try {
      const { error } = await supabase
        .from('material')
        .update({ price_cost: numValue })
        .eq('id_material', materialId)

      if (error) throw error
    } catch (err) {
      console.error(`Lỗi khi cập nhật ${key} (${materialId}) lên Supabase:`, err.message)
    }
  }

  // 3. KHÔI PHỤC LẠI GIÁ MẶC ĐỊNH
  const resetSettings = async () => {
    setSettings(defaultFrameSettings)
    try {
      // Đẩy lại toàn bộ giá mặc định (từ file cứng) lên Database
      const updates = Object.keys(KEY_TO_MATERIAL_ID).map(key => {
        const idMat = KEY_TO_MATERIAL_ID[key];
        const defaultPrice = defaultFrameSettings[key];
        
        if (defaultPrice !== undefined) {
           return supabase
            .from('material')
            .update({ price_cost: defaultPrice })
            .eq('id_material', idMat)
        }
        return null;
      }).filter(Boolean); // Lọc bỏ các giá trị null
      
      await Promise.all(updates)
    } catch (err) {
      console.error('Lỗi khi khôi phục giá vật tư:', err.message)
    }
  }

  return { settings, updateSetting, resetSettings, loading }
}