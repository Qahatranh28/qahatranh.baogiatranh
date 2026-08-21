import React from 'react';

export default function LuxurySelect({
  id,
  label,
  value,
  onChange,
  options = [],
  valueKey,
  labelKey,
  className = '',
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1 transition-colors"
        >
          {label}
        </label>
      )}
      
      <div className="relative group w-full">
        <select
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          className="appearance-none w-full bg-white border border-gray-200 rounded-xl py-3.5 pl-4 pr-12 text-sm font-bold text-gray-800 shadow-sm outline-none cursor-pointer transition-all duration-300 hover:border-gray-300 hover:shadow-md focus:border-[#ff4f25] focus:ring-4 focus:ring-[#ff4f25]/15"
        >
          {options.map((opt, index) => {
            if (typeof opt !== 'object' || opt === null) {
              return <option key={index} value={opt}>{opt}</option>;
            }

            // Tự động nhận diện tên cột dữ liệu từ Database
            const val = valueKey ? opt[valueKey] : (opt.value ?? opt.frame_id ?? opt.id ?? opt.code);
            const lbl = labelKey ? opt[labelKey] : (opt.label ?? opt.name ?? opt.title ?? opt.sizeLabel ?? val);

            return (
              <option key={val ?? index} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>

        {/* Icon Mũi tên */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-colors duration-300 group-hover:text-[#ff4f25]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
          </svg>
        </div>
      </div>
    </div>
  );
}