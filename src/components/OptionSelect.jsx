import FormRow from './FormRow.jsx'

export default function OptionSelect({ label, value, options = [], onChange }) {
  return (
    <FormRow label={label}>
      <div className="w-full py-1">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-3 py-1.5 text-sm text-black outline-none font-mono cursor-pointer"
        >
          {options.map((opt) => {
            // Tách lấy giá trị value (để lưu vào state) và label (để hiển thị lên màn hình)
            const optValue = typeof opt === 'object' ? opt.value : opt
            const optLabel = typeof opt === 'object' ? (opt.label || opt.name_material || opt.name || opt.value) : opt

            return (
              <option key={optValue} value={optValue}>
                {optLabel} {/* 🌟 Hiển thị Tên vật liệu Tiếng Việt thay vì Mã ID */}
              </option>
            )
          })}
        </select>
      </div>
    </FormRow>
  )
}