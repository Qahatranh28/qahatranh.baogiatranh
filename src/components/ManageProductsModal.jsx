import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ManageProductsModal({ isOpen, onClose, onUpdated }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Tải danh sách sản phẩm từ bảng `frame_catalog` khi mở giao diện quản lý
  useEffect(() => {
    if (isOpen) {
      fetchProducts()
    }
  }, [isOpen])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('frame_catalog')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Lỗi tải danh sách sản phẩm:', err.message)
    } finally {
      setLoading(false)
    }
  }

  // Hàm xóa sản phẩm khỏi DB (cả catalog và kích thước liên quan)
  const handleDeleteProduct = async (frameId, productName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName}" khỏi cơ sở dữ liệu không?`)) {
      return
    }

    try {
      // 1. Xóa các kích thước cố định liên quan trong bảng `frame_size` (nếu có)
      await supabase.from('frame_size').delete().eq('frame_id', frameId)

      // 2. Xóa sản phẩm chính trong bảng `frame_catalog`
      const { error } = await supabase.from('frame_catalog').delete().eq('frame_id', frameId)

      if (error) throw error

      alert('Đã xóa sản phẩm thành công khỏi DB!')
      // Cập nhật lại giao diện danh sách sau khi xóa
      setProducts(products.filter((p) => p.frame_id !== frameId))
      
      // Đồng bộ làm mới dữ liệu toàn ứng dụng nếu cần
      if (onUpdated) onUpdated()
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err.message)
      alert('Lỗi khi xóa: ' + err.message)
    }
  }

  if (!isOpen) return null

  // Lọc sản phẩm theo từ khóa tìm kiếm
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-3xl w-full shadow-xl border border-line my-8 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
          <h3 className="font-display font-semibold text-lg text-blueprint">
            Quản lý và Xóa sản phẩm trên DB ({products.length})
          </h3>
          <button
            onClick={onClose}
            className="text-blueprint/60 hover:text-blueprint text-sm font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên sản phẩm hoặc danh mục..."
            className="w-full border border-line rounded px-3 py-2 text-sm outline-none focus:border-amber"
          />
        </div>

        {/* Danh sách sản phẩm */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <p className="text-center text-sm text-blueprint/50 py-8">Đang tải danh sách sản phẩm từ DB...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-sm text-blueprint/50 py-8">Không tìm thấy sản phẩm nào.</p>
          ) : (
            filteredProducts.map((p) => (
              <div
                key={p.frame_id}
                className="flex items-center justify-between p-3 border border-line rounded-lg bg-paper/50 hover:bg-paper transition-colors gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded border border-line overflow-hidden bg-white flex-shrink-0">
                    <img
                      src={p.image_url || '/images/default.png'}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-blueprint">{p.name}</h4>
                    <p className="text-xs text-blueprint/60 font-mono">
                      Danh mục: <span className="text-amber font-medium">{p.category}</span> | Giá vốn: <span className="font-bold">{Number(p.price_cost || 0).toLocaleString()} đ/m</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteProduct(p.frame_id, p.name)}
                  className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex-shrink-0 border border-red-200"
                >
                  Xóa khỏi DB
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-line mt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-blueprint text-paper px-4 py-2 rounded text-sm font-medium hover:bg-blueprint-light transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}