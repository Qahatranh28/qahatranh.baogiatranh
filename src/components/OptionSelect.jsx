export default function OptionSelect({ label, value, options = [], onChange }) {
  const safeOptions = Array.isArray(options) ? options : []

  return (
    <div className="w-full">
      {label && (
        <label className="block font-mono text-xs uppercase tracking-widest text-blueprint-light mb-2">
          {label}
        </label>
      )}
      <div className="w-full bg-white rounded-lg border-2 border-line focus-within:border-amber transition-colors px-3 py-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-black outline-none font-mono cursor-pointer"
        >
          {safeOptions.map((opt, index) => {
            const optValue = typeof opt === 'object' && opt !== null ? opt.value : opt
            const optLabel = typeof opt === 'object' && opt !== null 
              ? (opt.label || opt.name_material || opt.name || opt.value) 
              : opt

            const uniqueKey = optValue !== undefined && optValue !== null ? `${optValue}-${index}` : index

            return (
              <option key={uniqueKey} value={optValue}>
                {optLabel}
              </option>
            )
          })}
        </select>
      </div>
    </div>
  )
}