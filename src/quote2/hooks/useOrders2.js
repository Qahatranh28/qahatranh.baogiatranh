import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabaseClient'
import { docTotals } from '../lib/docs.js'

// Danh sách chỉ lấy cột nhẹ (không kéo nội dung phiếu chứa logo/QR) — mở đơn mới tải đầy đủ.
const LIST_COLS = 'id,quote_id,quote_code,customer_name,amount,status,has_quote_doc,has_delivery_doc,owner_id,owner_name,created_at,updated_at'

const fromRow = (r) => ({
  id: r.id,
  quoteId: r.quote_id || null,
  quoteCode: r.quote_code || '',
  customerName: r.customer_name || '',
  amount: Number(r.amount) || 0,
  status: r.status || 'quoted',
  hasQuoteDoc: !!r.has_quote_doc,
  hasDeliveryDoc: !!r.has_delivery_doc,
  ownerId: r.owner_id || '',
  ownerName: r.owner_name || '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  quoteDoc: r.quote_doc ?? null,       // chỉ có khi tải đầy đủ
  deliveryDoc: r.delivery_doc ?? null,
})

// Mỗi báo giá = đúng 1 "đơn" gồm 1 phiếu báo giá + 1 phiếu giao hàng (UNIQUE quote_id ở DB).
export function useOrders2(user, seeAll) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      let q = supabase.from('quote2_orders').select(LIST_COLS).order('updated_at', { ascending: false })
      if (!seeAll) q = q.eq('owner_id', String(user.id))
      const { data, error: err } = await q
      if (err) throw err
      setOrders((data || []).map(fromRow))
    } catch (err) {
      setError(
        /relation .* does not exist|schema cache/i.test(err.message)
          ? 'Chưa có bảng đơn phiếu. Hãy chạy file sql/quote2_orders.sql trong Supabase SQL Editor.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }, [user?.id, seeAll]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { refresh() }, [refresh])

  const fetchOrder = useCallback(async (id) => {
    const { data, error: err } = await supabase.from('quote2_orders').select('*').eq('id', id).maybeSingle()
    if (err) throw err
    return data ? fromRow(data) : null
  }, [])

  const upsertLocal = (o) =>
    setOrders((prev) => [{ ...o, quoteDoc: null, deliveryDoc: null }, ...prev.filter((x) => x.id !== o.id)].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))

  const createOrder = async ({ quote, quoteDoc, deliveryDoc }) => {
    const { data: row, error: err } = await supabase
      .from('quote2_orders')
      .insert([{
        quote_id: quote.id,
        quote_code: quote.code,
        customer_name: quote.customerName || '',
        amount: docTotals(quoteDoc).grand,
        status: 'quoted',
        has_quote_doc: true, has_delivery_doc: true,
        quote_doc: quoteDoc, delivery_doc: deliveryDoc,
        owner_id: String(user.id), owner_name: user.full_name || user.user || '',
      }])
      .select(LIST_COLS)
      .single()
    if (err) {
      // Báo giá này đã có đơn (UNIQUE) -> trả về đơn có sẵn, không tạo trùng
      if (err.code === '23505') {
        const { data: ex } = await supabase.from('quote2_orders').select('*').eq('quote_id', quote.id).maybeSingle()
        if (ex) return { ok: true, existed: true, order: fromRow(ex) }
      }
      return { ok: false, error: err.message }
    }
    const o = { ...fromRow(row), quoteDoc, deliveryDoc } // nội dung phiếu đã có sẵn ở máy, không cần tải lại
    upsertLocal(o)
    return { ok: true, order: o }
  }

  // draft: { status, quoteDoc, deliveryDoc }
  const saveOrder = async (order, draft) => {
    const patch = {
      status: draft.status,
      customer_name: draft.quoteDoc?.customerName ?? draft.deliveryDoc?.customerName ?? order.customerName,
      amount: draft.quoteDoc ? docTotals(draft.quoteDoc).grand : order.amount,
      quote_doc: draft.quoteDoc ?? null,
      delivery_doc: draft.deliveryDoc ?? null,
      has_quote_doc: !!draft.quoteDoc,
      has_delivery_doc: !!draft.deliveryDoc,
      updated_at: new Date().toISOString(),
    }
    const { data: row, error: err } = await supabase.from('quote2_orders').update(patch).eq('id', order.id).select(LIST_COLS).single()
    if (err) return { ok: false, error: err.message }
    const o = { ...fromRow(row), quoteDoc: draft.quoteDoc ?? null, deliveryDoc: draft.deliveryDoc ?? null }
    upsertLocal(o)
    return { ok: true, order: o }
  }

  const deleteOrder = async (id) => {
    const { error: err } = await supabase.from('quote2_orders').delete().eq('id', id)
    if (err) return { ok: false, error: err.message }
    setOrders((prev) => prev.filter((x) => x.id !== id))
    return { ok: true }
  }

  return { orders, loading, error, refresh, fetchOrder, createOrder, saveOrder, deleteOrder }
}
