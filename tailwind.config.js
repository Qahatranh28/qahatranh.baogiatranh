/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Nền ivory ấm thay cho giấy trắng thô
        paper: '#FAF8F3',
        // "blueprint" giữ tên biến để không phải sửa lại toàn bộ class,
        // nhưng đổi giá trị sang đen than sang trọng
        blueprint: {
          DEFAULT: '#17171B',
          light: '#26262C',
          steel: '#9C9488',
        },
        // "amber" đổi sang vàng đồng (gold) cho cảm giác cao cấp
        amber: {
          DEFAULT: '#B8905A',
          light: '#D4B483',
        },
        line: '#E6DFD2',
      },
      fontFamily: {
        display: ['Roboto', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
        mono: ['"Roboto Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
