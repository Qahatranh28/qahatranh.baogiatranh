import { useState } from 'react'
import { Modal, Btn } from './ui.jsx'
import CompanyHeader from './CompanyHeader.jsx'
import PaymentBlock from './PaymentBlock.jsx'
import FitWidth from './FitWidth.jsx'
import CompanyForm from './CompanyForm.jsx'
import { DEFAULT_COMPANY } from '../lib/defaults.js'
import { useDialog } from './Dialogs.jsx'

// Chỉnh thông tin công ty MẶC ĐỊNH (áp dụng cho báo giá mới tạo; phiếu đã tạo giữ bản riêng).
export default function CompanyEditModal({ current, onSave, onClose }) {
  const dialog = useDialog()
  const [form, setForm] = useState({ ...DEFAULT_COMPANY, ...current, hotline: current.hotline || current.phone || '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setBusy(true); setErr('')
    const res = await onSave(form)
    setBusy(false)
    if (res?.ok === false) return setErr(res.error || 'Không lưu được')
    onClose()
  }

  return (
    <Modal
      wide
      title="Thông tin công ty"
      onClose={onClose}
      footer={
        <>
          <Btn className="mr-auto" onClick={async () => {
            const ok = await dialog.confirm({ tone: 'warning', icon: 'refresh', title: 'Khôi phục về mẫu ban đầu?', message: 'Toàn bộ thông tin công ty đang nhập trong cửa sổ này (kể cả logo, ngân hàng, mã QR) sẽ được thay bằng mẫu ban đầu. Bạn vẫn cần bấm Lưu để áp dụng.', confirmText: 'Khôi phục mẫu', cancelText: 'Giữ nguyên' })
            if (ok) setForm({ ...DEFAULT_COMPANY })
          }}>Khôi phục mẫu</Btn>
          <Btn onClick={onClose}>Huỷ</Btn>
          <Btn variant="primary" onClick={save} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</Btn>
        </>
      }
    >
      <div className="space-y-4">
        {err && <div className="text-xs bg-red-50 border border-red-100 text-red-600 rounded-md p-2.5">{err}</div>}
        <p className="text-xs text-[#6b7280]">Áp dụng cho mọi báo giá. Xem bản xem trước ở cuối cửa sổ này.</p>
        <CompanyForm form={form} set={set} />
        <div className="border-t border-[#e3e7ec] pt-4">
          <h4 className="font-bold text-sm mb-3">Xem trước</h4>
          <div className="border border-[#e3e7ec] rounded-xl overflow-hidden bg-white">
            <FitWidth width={960}>
              <div className="p-8 space-y-5 text-[13px] text-[#1a1f2c] leading-relaxed">
                <CompanyHeader company={form} code="BG261001-XXXX" date={new Date().toISOString()} />
                <PaymentBlock company={form} code="BG261001-XXXX" />
              </div>
            </FitWidth>
          </div>
        </div>
      </div>
    </Modal>
  )
}
