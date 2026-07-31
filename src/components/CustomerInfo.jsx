export default function CustomerInfo({ value, onChange }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <label
        htmlFor="customerName"
        className="font-mono text-xs uppercase tracking-widest text-blueprint-light shrink-0"
      >
        Khách hàng
      </label>
      <input
        id="customerName"
        type="text"
        placeholder="Nhập tên khách hàng..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent border-b-2 border-line focus:border-amber transition-colors py-1.5 outline-none text-blueprint font-medium"
      />
    </div>
  )
}
