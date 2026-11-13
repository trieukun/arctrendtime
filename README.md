# Bảng giá thị trường

Trang tổng hợp thị trường chia làm hai danh mục. "Thế giới": giá Bitcoin, vàng, dầu thô kèm dự báo tăng/giảm theo 5 mốc thời gian, lãi suất FED và tin tức tốt/xấu có đánh giá tác động. "Trong nước": giá vàng SJC/9999/98/95, giá xăng dầu bán lẻ, lãi suất gửi và vay của Agribank, Vietcombank, Sacombank. Dữ liệu chỉ cập nhật khi bấm nút Làm mới, riêng dòng "Tin nóng" chạy ở đầu tab Thế giới tự kiểm tra tin mới mỗi phút và chỉ thêm tin khi thật sự có.

Built with [Arc Studio](https://studio.arc.io)

## Tech stack

- React, TypeScript, Vite, Tailwind CSS
- Dịch vụ dữ liệu (`scripts/market`) lấy giá và tin từ các nguồn công khai: chạy bằng Bun khi phát triển, và chạy dưới dạng hàm Netlify (`netlify/functions/api.ts`) khi đưa lên Netlify

## Development

Yêu cầu: Bun.

```bash
bun install
bun run api   # dịch vụ dữ liệu, cổng 3001
bun run dev   # giao diện, cổng 5173 (proxy /api sang cổng 3001)
```

Build: `bun run build`. Kiểm tra mã: `bun run check`.

### Đưa lên Netlify

Dự án có sẵn `netlify.toml`: Netlify chạy `bun run build`, phát hành thư mục `dist` và tự đóng gói hàm trong `netlify/functions`. Các đường dẫn `/api/*` do hàm này phục vụ. Hàm Netlify mặc định giới hạn thời gian chạy ngắn, nên lần tải đầu có thể chậm.

### Environment variables

- `MARKET_API_PORT`: cổng của dịch vụ dữ liệu (tùy chọn, mặc định 3001).

## Lưu ý về dữ liệu

Dự báo là kết quả mô hình động lượng kết hợp tin tức, chỉ mang tính tham khảo. Lãi suất vay là khung công bố tham khảo, không phải mức cố định của ngân hàng.
