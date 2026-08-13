import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import {
  khungCategoryOptions as defaultCategories,
  getKhungImage as defaultGetKhungImage,
} from '../data/khungCatalog.js'

const CATEGORY_LABELS = {
  composite_mong: 'Khung Composite Mỏng',
  composite_2x3: 'Khung Composite 2x3',
  go_tu_nhien: 'Khung Gỗ Tự Nhiên',
  nhom: 'Khung Nhôm',
  khac: 'Khung Khác',
  classic_silk: 'Khăn Lụa Khung Classic',
  matboard_silk: 'Khăn Lụa Khung Matboard',
  moebe_silk: 'Khăn Lụa Khung Moebe',
  mirror_silk: 'Khăn Lụa Khung Mirror',
  
}

export function useProductCatalog() {
  const [categories, setCategories] = useState(defaultCategories)
  const [typesByCategory, setTypesByCategory] = useState({})
  const [rawCatalog, setRawCatalog] = useState([])
  const [rawSizes, setRawSizes] = useState([])
  const [rawMaterials, setRawMaterials] = useState([]) // 👈 Đã khai báo đầy đủ state này
  const [loading, setLoading] = useState(true)

  const fetchCatalogData = useCallback(async () => {
    setLoading(true)
    try {
      const [catalogRes, sizeRes, materialRes] = await Promise.all([
        supabase.from('frame_catalog').select('*'),
        supabase.from('frame_size').select('*'),
        supabase.from('material').select('*'),
      ])

      if (catalogRes.error) throw catalogRes.error
      if (sizeRes.error) throw sizeRes.error
      if (materialRes.error) throw materialRes.error

      const catalogData = catalogRes.data || []
      const sizeData = sizeRes.data || []
      const materialData = materialRes.data || []

      setRawCatalog(catalogData)
      setRawSizes(sizeData)
      setRawMaterials(materialData) // 👈 Lưu dữ liệu vào state

      if (catalogData.length > 0) {
        const catMap = {}

        catalogData.forEach((item) => {
          const rawCat = item.category || 'khac'
          const categoryLabel = CATEGORY_LABELS[rawCat] || rawCat
          const typeName = item.name

          if (!catMap[categoryLabel]) {
            catMap[categoryLabel] = []
          }
          if (typeName && !catMap[categoryLabel].includes(typeName)) {
            catMap[categoryLabel].push(typeName)
          }
        })

        setCategories(Object.keys(catMap))
        setTypesByCategory(catMap)
      }
    } catch (err) {
      console.error('Lỗi khi tải Catalog từ Supabase:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCatalogData()
  }, [fetchCatalogData])

  const getStandardSizesForType = useCallback(
    (typeName) => {
      const matchedCatalog = rawCatalog.find((c) => c.name === typeName)
      if (!matchedCatalog) return []

      const matchedSizes = rawSizes.filter((s) => s.frame_id === matchedCatalog.frame_id)

      if (matchedSizes.length > 0) {
        return matchedSizes.map((s) => ({
          label: s.size_name || `${s.width || 0} x ${s.height || 0} cm`,
          width: Number(s.width || 0),
          height: Number(s.height || 0),
          price: s.price != null ? Number(s.price) : null,
        }))
      }

      return []
    },
    [rawCatalog, rawSizes]
  )

  const getFrameImage = useCallback(
    (category, typeName, sizeLabel = '') => {
      const matched = rawCatalog.find((item) => item.name === typeName)

      const sizeStr = String(sizeLabel).toLowerCase()
      if (typeName === 'Khung Gỗ Đỏ' || typeName === 'go_do') {
        if (sizeStr.includes('16 ảnh')) return '/images/go-do-16-anh.png'
        if (sizeStr.includes('9 ảnh')) return '/images/go-do-9-anh.png'
      }

      if (matched && matched.image_url) {
        return matched.image_url
      }

      return defaultGetKhungImage(category, typeName, sizeLabel)
    },
    [rawCatalog]
  )

  // 🌟 Hàm lấy ảnh vật liệu từ bảng material an toàn tuyệt đối
  const getMaterialImage = useCallback(
    (materialKey) => {
      const matched = rawMaterials.find(
        (m) => m.id_material === materialKey || m.name === materialKey
      )
      if (matched && matched.image_url) {
        return matched.image_url
      }
      return '/images/default.png'
    },
    [rawMaterials]
  )

  const addFrameType = async (newFrame, sizesList = [], imageFile = null) => {
    try {
      let imageUrl = newFrame.image_url || '/images/default.png'

      if (imageFile && typeof imageFile === 'object') {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('frames')
          .upload(fileName, imageFile)

        if (!uploadError) {
          const { data: publicURLData } = supabase.storage
            .from('frames')
            .getPublicUrl(fileName)
          
          if (publicURLData?.publicUrl) {
            imageUrl = publicURLData.publicUrl
          }
        }
      }

      const frameId = newFrame.frame_id || `frame_${Date.now()}`

      // 1. Thêm vào bảng frame_catalog (với price_cost)
      const { error: catalogError } = await supabase.from('frame_catalog').insert([
        {
          frame_id: frameId,
          category: newFrame.category || 'khac',
          name: newFrame.name,
          price_cost: Number(newFrame.price_cost || 35000),
          image_url: imageUrl,
        },
      ])

      if (catalogError) throw catalogError

      // 2. Nếu có nhập các size cố định thì đẩy tiếp vào bảng frame_size
      if (sizesList && sizesList.length > 0) {
        const sizePayloads = sizesList.map((s) => ({
          frame_id: frameId,
          size_name: s.label || `${s.width}x${s.height}`,
          width: Number(s.width) || 0,
          height: Number(s.height) || 0,
          price: s.price ? Number(s.price) : null,
        }))

        const { error: sizeError } = await supabase.from('frame_size').insert(sizePayloads)
        if (sizeError) throw sizeError
      }

      await fetchCatalogData()
      return true
    } catch (err) {
      console.error('Lỗi khi thêm sản phẩm mới:', err.message)
      return false
    }
  }

  const deleteFrameType = async (id) => {
    try {
      const { error } = await supabase.from('frame_catalog').delete().eq('frame_id', id)
      if (error) throw error
      await fetchCatalogData()
      return true
    } catch (err) {
      console.error('Lỗi khi xoá loại khung:', err.message)
      return false
    }
  }

// Hàm cập nhật giá vốn (price_cost) của vật liệu lên bảng material trên Supabase
  const updateMaterialCost = async (idMaterial, newPrice) => {
    try {
      const { error } = await supabase
        .from('material')
        .update({ price_cost: Number(newPrice) })
        .eq('id_material', idMaterial)

      if (error) throw error

      // Cập nhật lại state local ngay lập tức để giao diện phản hồi mượt mà
      setRawMaterials((prev) =>
        prev.map((m) =>
          m.id_material === idMaterial ? { ...m, price_cost: Number(newPrice) } : m
        )
      )
      return true
    } catch (err) {
      console.error('Lỗi khi cập nhật giá vốn vật liệu:', err.message)
      return false
    }
  }
  const updateFrameCostRate = async (frameName, newRate) => {
    try {
      const { error } = await supabase
        .from('frame_catalog')
        .update({ price_cost: Number(newRate) })
        .eq('name', frameName)

      if (error) throw error
      await refreshCatalog() // Tải lại dữ liệu mới nhất
      return true
    } catch (err) {
      console.error('Lỗi khi cập nhật cost_rate:', err.message)
      return false
    }
  }
  

  // Đảm bảo trả về hàm này trong return của hook:
  return {
    categories,
    typesByCategory,
    rawCatalog,
    rawSizes,
    rawMaterials,
    loading,
    getStandardSizesForType,
    getFrameImage,
    getMaterialImage,
    updateMaterialCost, // 👈 Thêm vào đây
    addFrameType,
    deleteFrameType,
    refreshCatalog: fetchCatalogData,
  }
}