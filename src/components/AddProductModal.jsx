import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function AddProductModal({ isOpen, onClose, onAdded }) {
  const [name, setName] = useState('')
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  
  // State khi admin muốn thêm danh mục mới hoàn toàn
  const [isAddingNewCat, setIsAddingNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  const [priceCost, setPriceCost] = useState('35000')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const [showSizes, setShowSizes] = useState(false)
  const [sizes, setSizes] = useState([{ label: '', width: '', height: '', price: '' }])
  const [loading, setLoading] = useState(false)

  // Tải danh mục từ bảng `categories` trên Supabase khi mở modal
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*')
      if (error) throw error
      if (data && data.length > 0) {
        setCategories(data)
        setSelectedCategory(data[0].slug) // Mặc định chọn dòng đầu tiên
      }
    } catch (err) {
      console.error('Lỗi tải danh mục:', err.message)
    }
  }

  // Xử lý chọn file ảnh từ máy
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return alert('Vui lòng nhập tên sản phẩm!')

    setLoading(true)
    try {
      let finalCategorySlug = selectedCategory

      // Nếu admin chọn thêm danh mục mới
      if (isAddingNewCat) {
        if (!newCatName.trim()) return alert('Vui lòng nhập tên danh mục mới!')
        
        // Tự động tạo slug không dấu từ tên danh mục mới (vd: "Khung Nhôm Cao Cấp" -> "khung_nhom_cao_cap")
        finalCategorySlug = newCatName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')

        // Lưu danh mục mới vào bảng `categories` trên DB
        const { error: catError } = await supabase.from('categories').insert([
          { slug: finalCategorySlug, name: newCatName.trim() }
        ])
        
        // Bỏ qua lỗi nếu slug đã tồn tại sẵn
        if (catError && !catError.message.includes('duplicate')) {
          throw catError
        }
      }

      // Tự động sinh frame_id độc nhất
      const normalizedId = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
      const frameId = `${normalizedId}_${Date.now()}`

      let imageUrl = '/images/default.png'
// Upload ảnh lên Supabase Storage bucket 'qaha tranh', thư mục 'khung tranh'
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${frameId}.${fileExt}`
        
        // 🌟 Thêm đường dẫn thư mục vào trước tên file
        const filePath = `khung tranh/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('qaha tranh') // 👈 Đổi thành bucket 'qaha tranh'
          .upload(filePath, imageFile, { upsert: true }) // 👈 Upload vào filePath (đã bao gồm thư mục)

        if (uploadError) throw new Error('Lỗi upload ảnh: ' + uploadError.message)

        const { data: publicURLData } = supabase.storage
          .from('qaha tranh') // 👈 Đổi thành bucket 'qaha tranh'
          .getPublicUrl(filePath) // 👈 Lấy link từ filePath (đã bao gồm thư mục)

        if (publicURLData?.publicUrl) {
          imageUrl = publicURLData.publicUrl
        }
      }

      // Thêm sản phẩm vào bảng `frame_catalog`
      const { error: catalogError } = await supabase.from('frame_catalog').insert([
        {
          frame_id: frameId,
          name: name.trim(),
          category: finalCategorySlug, // Lưu chuẩn dạng slug không dấu
          price_cost: Number(priceCost) || 0,
          image_url: imageUrl,
        },
      ])

      if (catalogError) throw catalogError

      // Thêm kích thước cố định nếu có
      const validSizes = showSizes ? sizes.filter(s => s.width && s.height) : []
      if (validSizes.length > 0) {
        const sizePayloads = validSizes.map((s) => ({
          frame_id: frameId,
          size_name: s.label || `${s.width}x${s.height} cm`,
          width: Number(s.width),
          height: Number(s.height),
          price: s.price ? Number(s.price) : null,
        }))

        const { error: sizeError } = await supabase.from('frame_size').insert(sizePayloads)
        if (sizeError) throw sizeError
      }

      alert('Thêm sản phẩm thành công!')
      if (onAdded) onAdded()
      onClose()
    } catch (err) {
      console.error('Lỗi:', err.message)
      alert('Lỗi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl border border-line my-8">
        <h3 className="font-display font-semibold text-lg text-blueprint mb-4">
          Thêm sản phẩm khung mới vào DB
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Tên sản phẩm */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-blueprint/70 mb-1">Tên sản phẩm (name)</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Khung tranh mới..."
              className="w-full border border-line rounded px-3 py-2 text-sm outline-none focus:border-amber"
            />
          </div>

          {/* Danh mục lấy từ bảng categories trên DB */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs uppercase tracking-widest text-blueprint/70">Danh mục (Category)</label>
              <button
                type="button"
                onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                className="text-xs text-amber font-medium hover:underline"
              >
                {isAddingNewCat ? 'Chọn từ danh sách' : '+ Thêm loại danh mục mới'}
              </button>
            </div>

            {!isAddingNewCat ? (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-line rounded px-3 py-2 text-sm outline-none focus:border-amber bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name} ({cat.slug})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nhập tên loại khung mới có dấu (VD: Khung Nhôm Sần)..."
                className="w-full border border-line rounded px-3 py-2 text-sm outline-none focus:border-amber"
              />
            )}
          </div>

          {/* Giá vốn */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-blueprint/70 mb-1">Giá vốn (VND/m) - price_cost</label>
            <input
              type="number"
              required
              value={priceCost}
              onChange={(e) => setPriceCost(e.target.value)}
              className="w-full border border-line rounded px-3 py-2 text-sm outline-none focus:border-amber font-mono"
            />
          </div>

          {/* Upload ảnh máy tính lên Storage */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-blueprint/70 mb-1">Hình ảnh sản phẩm (Tải từ máy)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-xs text-blueprint/70 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber/10 file:text-amber hover:file:bg-amber/20 cursor-pointer"
            />
            {imagePreview && (
              <div className="mt-2 w-20 h-20 border border-line rounded overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Kích thước cố định (Tùy chọn) */}
          <div className="pt-2 border-t border-line">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-widest text-blueprint">
                Kích thước cố định (Tùy chọn)
              </label>
              <button
                type="button"
                onClick={() => setShowSizes(!showSizes)}
                className="text-xs text-amber font-medium hover:underline"
              >
                {showSizes ? 'Ẩn bớt' : '+ Thêm kích thước'}
              </button>
            </div>

            {showSizes && (
              <div className="space-y-3 bg-paper p-3 rounded-lg border border-line">
                {sizes.map((s, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tên (30x40)"
                      value={s.label}
                      onChange={(e) => {
                        const newSizes = [...sizes]
                        newSizes[index].label = e.target.value
                        setSizes(newSizes)
                      }}
                      className="w-24 border border-line rounded px-2 py-1 text-xs outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Rộng cm"
                      value={s.width}
                      onChange={(e) => {
                        const newSizes = [...sizes]
                        newSizes[index].width = e.target.value
                        setSizes(newSizes)
                      }}
                      className="w-20 border border-line rounded px-2 py-1 text-xs outline-none font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Dài cm"
                      value={s.height}
                      onChange={(e) => {
                        const newSizes = [...sizes]
                        newSizes[index].height = e.target.value
                        setSizes(newSizes)
                      }}
                      className="w-20 border border-line rounded px-2 py-1 text-xs outline-none font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Giá set"
                      value={s.price}
                      onChange={(e) => {
                        const newSizes = [...sizes]
                        newSizes[index].price = e.target.value
                        setSizes(newSizes)
                      }}
                      className="w-24 border border-line rounded px-2 py-1 text-xs outline-none font-mono"
                    />
                    {sizes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSizes(sizes.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700 text-xs px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSizes([...sizes, { label: '', width: '', height: '', price: '' }])}
                  className="text-xs text-blueprint hover:text-amber underline mt-1 block"
                >
                  + Thêm dòng kích thước
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-blueprint/60 hover:text-blueprint"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-amber text-white px-4 py-2 rounded text-sm font-medium hover:bg-amber/90 transition-colors"
            >
              {loading ? 'Đang xử lý...' : 'Lưu sản phẩm lên DB'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}