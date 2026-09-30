import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabaseClient'
import { genQuoteCode } from '../lib/calc.js'

const n = (v) => Number(v) || 0

const fromRow = (r) => ({
  id: r.id,
  code: r.code,
  customerName: r.customer_name || '',
  customerPhone: r.customer_phone || '',
  discountPercent: n(r.discount_percent),
  taxRate: n(r.tax_rate),
  minMargin: n(r.min_margin),
  status: r.status || 'pending',
  lostReason: r.lost_reason || '',
  note: r.note || '',
  previewOverrides: r.preview_overrides || {},
  ownerId: r.owner_id || '',
  ownerName: r.owner_name || '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  items: (r.quote2_items || [])
    .slice()
    .sort((a, b) => n(a.position) - n(b.position))
    .map((i) => ({
      id: i.id,
      position: n(i.position),
      name: i.name || '',
      size: i.size || '',
      quantity: n(i.quantity),
      unitCost: n(i.unit_cost),
      unitPrice: n(i.unit_price),
    })),
})

const toRow = (q) => ({
  code: q.code,
  customer_name: (q.customerName || '').trim(),
  customer_phone: (q.customerPhone || '').trim(),
  discount_percent: n(q.discountPercent),
  tax_rate: n(q.taxRate),
  min_margin: n(q.minMargin),
  status: q.status,
  lost_reason: q.status === 'lost' ? String(q.lostReason || '').trim() : '',
  note: q.note || '',
  preview_overrides: q.previewOverrides || {},
  owner_id: String(q.ownerId ?? ''),
  owner_name: q.ownerName || '',
  updated_at: new Date().toISOString(),
})

// Lịch sử báo giá của trang MỚI nằm ở bảng quote2_quotes / quote2_items (tách hẳn khỏi `oders`).
export function useQuotes2(user, seeAll) {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchQuotes = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      let q = supabase.from('quote2_quotes').select('*, quote2_items(*)').order('created_at', { ascending: false })
      if (!seeAll) q = q.eq('owner_id', String(user.id))
      const { data, error: err } = await q
      if (err) throw err
      setQuotes((data || []).map(fromRow))
    } catch (err) {
      console.error('Lỗi tải báo giá:', err.message)
      setError(
        /relation .* does not exist|schema cache/i.test(err.message)
          ? 'Chưa có bảng dữ liệu. Hãy chạy file sql/quote2_migration.sql trong Supabase SQL Editor.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }, [user?.id, seeAll]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchQuotes()
  }, [fetchQuotes])

  const fetchOne = async (id) => {
    const { data, error: err } = await supabase.from('quote2_quotes').select('*, quote2_items(*)').eq('id', id).single()
    if (err) throw err
    return fromRow(data)
  }

  // Lưu = tạo mới (id null) hoặc cập nhật. Dòng sản phẩm: upsert trước, rồi mới xoá dòng bị bỏ
  // (thứ tự này đảm bảo lỗi giữa chừng không làm mất sản phẩm).
  const saveQuote = async (quote) => {
    try {
      let id = quote.id
      let code = quote.code
      if (!id) {
        for (let attempt = 0; attempt < 4; attempt++) {
          const { data, error: err } = await supabase
            .from('quote2_quotes')
            .insert([{ ...toRow({ ...quote, code }), created_at: quote.createdAt }])
            .select('id')
            .single()
          if (!err) {
            id = data.id
            break
          }
          if (err.code === '23505') {
            code = genQuoteCode() // trùng mã: sinh lại
            continue
          }
          throw err
        }
        if (!id) throw new Error('Không tạo được mã báo giá duy nhất, thử lại.')
      } else {
        const { error: err } = await supabase.from('quote2_quotes').update(toRow(quote)).eq('id', id)
        if (err) throw err
      }

      const rows = quote.items
        .filter((i) => (i.name || '').trim() || n(i.unitPrice) > 0)
        .map((i, idx) => ({
          id: i.id,
          quote_id: id,
          position: idx,
          name: (i.name || '').trim(),
          size: (i.size || '').trim(),
          quantity: n(i.quantity),
          unit_cost: n(i.unitCost),
          unit_price: n(i.unitPrice),
        }))
      if (rows.length) {
        const { error: e1 } = await supabase.from('quote2_items').upsert(rows)
        if (e1) throw e1
      }
      let del = supabase.from('quote2_items').delete().eq('quote_id', id)
      if (rows.length) del = del.not('id', 'in', `(${rows.map((r) => r.id).join(',')})`)
      const { error: e2 } = await del
      if (e2) throw e2

      const saved = await fetchOne(id)
      setQuotes((prev) => [saved, ...prev.filter((x) => x.id !== saved.id)].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ))
      return { ok: true, quote: saved }
    } catch (err) {
      console.error('Lỗi lưu báo giá:', err.message)
      return { ok: false, error: err.message }
    }
  }

  const deleteQuote = async (id) => {
    const { error: err } = await supabase.from('quote2_quotes').delete().eq('id', id)
    if (err) return { ok: false, error: err.message }
    setQuotes((prev) => prev.filter((q) => q.id !== id))
    return { ok: true }
  }

  return { quotes, loading, error, refresh: fetchQuotes, saveQuote, deleteQuote }
}
