# Ôn Từ Vựng — Vocabulary Review App

## Chức năng

### 1. Import dữ liệu từ Google Sheet
- Nút "Load từ Google Sheet" gọi API Google Apps Script để lấy danh sách các sheet
- Modal popup cho phép chọn sheet cần học
- Dữ liệu bao gồm `term` (từ tiếng Trung) và `meaning` (nghĩa tiếng Việt)

### 2. Hệ thống 3 ngăn (Spaced Repetition)
Mỗi từ được xếp vào 1 trong 3 ngăn:
| Ngăn | Màu | Ý nghĩa |
|------|-----|---------|
| Box 1 | Đỏ | Chưa biết |
| Box 2 | Vàng | Phân vân |
| Box 3 | Xanh | Đã biết |

Trạng thái ngăn được lưu vào `localStorage` (`vocab_boxes`).

### 3. Flashcard
- Click vào thẻ để lật (flip) giữa mặt trước (term) và mặt sau (meaning)
- Nút **Trước/Sau** để di chuyển giữa các từ
- 3 nút đánh giá: Chưa biết / Phân vân / Đã biết → cập nhật ngăn của từ
- Thanh tiến trình hiển thị vị trí hiện tại (VD: 3/20)

### 4. Chế độ Quiz
- Chọn số câu hỏi (5-50)
- Chọn chiều: Việt → Trung / Trung → Việt / Hỗn hợp
- Chọn phạm vi: Tất cả từ / Chỉ Chưa biết + Phân vân
- Nhập đáp án, submit để chấm điểm
- Kết quả đúng/sai, đáp án đúng hiển thị ngay
- Sau khi submit: đúng → tăng ngăn, sai → quay về ngăn 1

### 5. Lọc & Tìm kiếm
- Click vào ô thống kê (Đỏ/Vàng/Xanh/Tất cả) để lọc theo ngăn
- Thanh tìm kiếm: lọc từ theo term hoặc meaning

### 6. Giao diện & Theme
- Toggle sáng/tối (🌙/☀️), lưu vào `localStorage`
- Thiết kế theo phong cách Apple (SF Pro Display, màu sắc, spacing)

---

## Cấu trúc file

```
/vocabulary-review
├── index.html   # HTML chính
├── app.js       # Logic JavaScript
├── styles.css  # CSS (Apple design tokens)
├── DESIGN.md   # Design reference (Apple style guide)
└── README.md   # File này
```

## Công nghệ
- Vanilla HTML/CSS/JS
- Google Apps Script API (fetch)
- localStorage cho persistence

## API Endpoint
```javascript
const API_URL = 'https://script.google.com/macros/s/AKfycbyx1zuC_Gfq0-0zeqykHIjdWG9YsBbIjoQ96pTwdioHKoc-yAdTsScoJRg0BYnZXoEgNQ/exec';
```

- `?action=sheets` → lấy danh sách sheet
- `?sheet=<name>` → lấy dữ liệu sheet