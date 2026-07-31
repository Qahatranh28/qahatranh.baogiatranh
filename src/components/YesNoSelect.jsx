export default function YesNoSelect({ id, value, onChange }) {
  return (
    <select
      id={id}
      value={value ? 'co' : 'khong'}
      onChange={(e) => onChange(e.target.value === 'co')}
      className="w-full h-full bg-transparent px-3 py-2 text-sm text-blueprint outline-none cursor-pointer appearance-none"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%234A6FA5' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
      }}
    >
      <option value="co">Có</option>
      <option value="khong">Không</option>
    </select>
  )
}
