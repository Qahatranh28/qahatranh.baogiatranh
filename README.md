# Báo giá sản phẩm

Trang web tính báo giá vật liệu theo diện tích (kích thước nhập bằng **cm**, tính giá theo m²),
xây dựng bằng React + Vite + Tailwind CSS.

## Tính năng
- Font chữ **Roboto**, giao diện tông đen than – vàng đồng sang trọng, layout sidebar + banner
- Kích thước nhập bằng **cm**, tự quy đổi ra m² để tính giá
- **Tên sản phẩm dạng combobox**: vừa gõ tìm kiếm, vừa chọn từ danh sách sản phẩm đã báo giá trước
  đó (lấy từ lịch sử) — khi chọn lại 1 sản phẩm cũ, vật liệu sẽ tự động chọn đúng theo lần gần nhất
- **Chiết khấu (%) theo từng sản phẩm**, nhập ngay dưới ô chọn vật liệu — không cần quyền admin
- Thêm nhiều sản phẩm vào 1 bảng báo giá, có thể xoá từng dòng
- **Xuất báo giá**: lưu đơn hàng hiện tại vào lịch sử, tự động bắt đầu đơn mới
- **Lịch sử báo giá**: xem cho **mọi người dùng** (không cần đăng nhập admin), lọc theo tháng;
  khi đăng nhập admin sẽ thấy thêm giá vốn & biên lợi nhuận từng đơn
- **Xuất Excel**: xuất toàn bộ lịch sử báo giá của tháng đang chọn ra file `.xlsx`
  (2 sheet: Tổng hợp đơn hàng + Chi tiết sản phẩm). Nếu xuất khi đã đăng nhập admin, file sẽ có
  thêm cột giá vốn/lợi nhuận/biên lợi nhuận
- **Công cụ tính giá thành khung tranh (Admin)**: bảng định mức chi phí chi tiết theo từng thành
  phần (khung, tranh in, mica, kính, ván lót, giấy bo, sắt xi, phụ kiện, nhân công, chi phí SXC...),
  chỉ tính lại khi nhập chiều dài/chiều rộng — các đơn giá & hệ số hao hụt là giá trị mặc định có
  thể chỉnh trong phần "Cài đặt mặc định"

## ⚠️ Lưu ý quan trọng về công cụ tính giá thành khung tranh
Công thức trong `src/utils/frameCosting.js` được suy ra từ file mẫu bạn cung cấp và đã khớp với
các ví dụ số liệu đã kiểm tra (khung, tranh in, ke góc, móc treo, đinh/ghim, sắt xi, nhân công, SXC...).
Tuy nhiên một số định mức **không có công thức rõ ràng theo kích thước** trong dữ liệu mẫu, nên tạm
để mặc định cố định — bạn nên kiểm tra và chỉnh lại trong "Cài đặt mặc định" nếu cần chính xác hơn:
- Số lượng móc treo, chiều dài dây treo tiêu hao: hiện để mặc định 2 cái / 1m, chưa scale theo kích thước
- Số lượng Pe cuộn, xốp bóng khí, carton, băng keo trong (đóng gói): hiện mặc định = 0, cần bổ sung
  công thức nếu bạn có quy tắc tính cụ thể

**Công cụ này hiện là máy tính tham khảo độc lập** (nhập rộng/dài cm + bật/tắt thành phần), *chưa*
tự động gắn vào giá vốn của từng sản phẩm trong luồng báo giá chính — vì luồng chính vẫn dùng
"vật liệu tính theo m²" đơn giản (`src/data/materials.js`) để giữ ổn định trải nghiệm nhập liệu.
Nếu bạn muốn 2 hệ thống này liên thông trực tiếp (ví dụ: chọn "sản phẩm khung tranh" sẽ tự tính giá
vốn theo đúng công thức BOM chi tiết), đây là bước nâng cấp tiếp theo mình có thể làm cho bạn.

## Lưu ý về lưu trữ
Lịch sử báo giá và cài đặt mặc định của công cụ tính giá thành đều lưu bằng `localStorage` — chỉ
tồn tại trên trình duyệt/máy đang dùng. Cần nhiều máy/nhân viên dùng chung dữ liệu thì phải chuyển
sang backend thật (xem `src/hooks/useOrders.js`, `src/hooks/useFrameSettings.js`).

### Đăng nhập Admin (demo)
- Tài khoản demo: `admin` / `admin123` (khai báo trong `src/hooks/useAdminAuth.js`)
- ⚠️ Đây chỉ là xác thực phía client, không an toàn cho production — xem ghi chú trong file đó.

## Cấu trúc thư mục
```
src/
  components/
    Sidebar.jsx              # điều hướng trái: Báo giá / Lịch sử báo giá
    QuoteHeader.jsx           # banner tiêu đề
    DimensionInput.jsx        # ô nhập chiều dài / chiều rộng (cm)
    MaterialSelect.jsx        # dropdown chọn vật liệu
    ProductNameCombobox.jsx   # ô tên sản phẩm: gõ tìm + chọn từ lịch sử
    QuoteForm.jsx              # gộp form nhập liệu (tên SP, kích thước, SL, vật liệu, chiết khấu)
    ResultPanel.jsx            # xem trước giá theo thời gian thực
    ProductListTable.jsx       # bảng danh sách sản phẩm trong báo giá hiện tại
    ExportQuoteButton.jsx      # nút lưu báo giá vào lịch sử
    CustomerInfo.jsx           # ô tên khách hàng
    OrderHistory.jsx           # lịch sử báo giá (public + admin xem thêm lợi nhuận), xuất Excel
    AdminLogin.jsx              # form đăng nhập admin (modal)
    AdminPanel.jsx              # giá vốn / lợi nhuận của đơn đang tạo (chỉ admin)
    FrameCostCalculator.jsx     # công cụ tính giá thành khung tranh chi tiết (chỉ admin)
  hooks/
    useAdminAuth.js            # đăng nhập/đăng xuất admin
    useOrders.js                 # lưu & đọc lịch sử báo giá
    useProductCatalog.js         # danh sách tên sản phẩm + vật liệu liên kết, từ lịch sử
    useFrameSettings.js          # cài đặt mặc định của công cụ tính giá thành
  utils/
    exportOrdersToExcel.js       # xuất lịch sử báo giá ra file .xlsx
    frameCosting.js               # công thức tính bảng định mức giá thành khung tranh
  data/
    materials.js                  # danh sách vật liệu + đơn giá/giá vốn theo m²
    frameDefaults.js              # giá trị mặc định cho công cụ tính giá thành
  App.jsx                         # ghép layout + state
  main.jsx                        # entry point
  index.css                       # Tailwind directives
```

## Cài đặt & chạy thử
```bash
npm install
npm run dev
```

## Build production
```bash
npm run build
```

## Tuỳ chỉnh
- Thêm/sửa vật liệu và đơn giá trong `src/data/materials.js`
- Đổi đơn giá/hệ số mặc định của công cụ tính giá thành trong `src/data/frameDefaults.js`
  hoặc trực tiếp trong giao diện Admin > "Cài đặt mặc định"
- Đổi màu sắc / font chữ trong `tailwind.config.js`
