import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useSupabaseProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase.from('products').select('*')
        if (error) throw error
        setProducts(data || [])
      } catch (error) {
        console.error('Lỗi khi tải sản phẩm từ Supabase:', error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return { products, loading }
}