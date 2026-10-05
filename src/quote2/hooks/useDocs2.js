import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabaseClient'
import { docAmount } from '../lib/docs.js'

// Danh sách chỉ lấy cột nhẹ (không kéo `data` chứa logo/QR) — mở phiếu mới tải đầy đủ.
const LIST_COLS = 'id,type,code,quote_id,quote_code,customer_name,amount,owner_id,owner_name,created_at,updated_at'

const fromRow = (r) => ({
  id: r.id,
  type: r.type,
  code: r.code || '',
  quoteId: r.quote_id || null,
  quoteCode: r.quote_code || '',
  customerName: r.customer_name || '',
  amount: Number(r.amount) || 0,
  ownerId: r.owner_id || '',
  ownerName: r.owner_name || '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  data: r.data, // chỉ có khi tải đầy đủ
})

export function useDocs2(user, seeAll) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      let q = supabase.from('quote2_documents').select(LIST_COLS).order('created_at', { ascending: false })
      if (!seeAll) q = q.eq('owner_id', String(user.id))
      const { data, error: err } = await q
      if (err) throw err
      setDocs((data || []).map(fromRow))
    } catch (err) {
      setError(
        /relation .* does not exist|schema cache/i.test(err.message)
          ? 'Chưa có bảng phiếu. Hãy chạy file sql/quote2_documents.sql trong Supabase SQL Editor.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }, [user?.id, seeAll]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { refresh() }, [refresh])

  const fetchDoc = useCallback(async (id) => {
    const { data, error: err } = await supabase.from('quote2_documents').select('*').eq('id', id).maybeSingle()
    if (err) throw err
    return data ? fromRow(data) : null
  }, [])

  const upsertLocal = (d) => setDocs((prev) => [{ ...d, data: undefined }, ...prev.filter((x) => x.id !== d.id)].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))

  const createDoc = async ({ type, quote, data }) => {
    const { data: row, error: err } = await supabase
      .from('quote2_documents')
      .insert([{
        type,
        code: data.code || '',
        quote_id: quote?.id || null,
        quote_code: quote?.code || data.refCode || '',
        customer_name: data.customerName || '',
        amount: docAmount(type, data),
        owner_id: String(user.id),
        owner_name: user.full_name || user.user || '',
        data,
      }])
      .select('*')
      .single()
    if (err) return { ok: false, error: err.message }
    const d = fromRow(row)
    upsertLocal(d)
    return { ok: true, doc: d }
  }

  const saveDoc = async (doc, data) => {
    const patch = {
      code: data.code || '',
      customer_name: data.customerName || '',
      amount: docAmount(doc.type, data),
      data,
      updated_at: new Date().toISOString(),
    }
    const { data: row, error: err } = await supabase.from('quote2_documents').update(patch).eq('id', doc.id).select('*').single()
    if (err) return { ok: false, error: err.message }
    const d = fromRow(row)
    upsertLocal(d)
    return { ok: true, doc: d }
  }

  const deleteDoc = async (id) => {
    const { error: err } = await supabase.from('quote2_documents').delete().eq('id', id)
    if (err) return { ok: false, error: err.message }
    setDocs((prev) => prev.filter((x) => x.id !== id))
    return { ok: true }
  }

  return { docs, loading, error, refresh, fetchDoc, createDoc, saveDoc, deleteDoc }
}
