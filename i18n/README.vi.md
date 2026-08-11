[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# LazyMahjong · Four Winds

*Rút bài, so sánh, giải thích rồi xác nhận—mà không để lộ tay bài của người khác.*

[![Lazying Art](https://img.shields.io/badge/Lazying-Art-0EA5E9?style=flat-square)](https://lazying.art) [![App screenshot](https://img.shields.io/badge/App-screenshot-173F5F?style=flat-square)](../docs/images/app.png) [![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyMahjong là công cụ dạy quyết định Mạt chược ưu tiên chạy cục bộ cho Riichi Nhật Bản, MCR Trung Quốc và luật Hong Kong. TypeScript tất định phụ trách tường bài, hành động hợp lệ, che giấu thông tin, kiểm tra hoàn thành, lịch sử và lưu trữ.

## Hỗ trợ công cụ giảng dạy mở

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## Xem trước ứng dụng

[![Ảnh chụp màn hình ứng dụng](../docs/images/app.png)](../docs/images/app.png)

Bàn hiện tại tách rõ tay bài úp của người học, lựa chọn hợp lệ, bản xem trước không đổi trạng thái và bằng chứng có nhãn nguồn gốc.

## Bàn chơi dạy gì

- Tường bài 136 quân có seed, bốn vị trí, rút và đánh bỏ hợp lệ, cửa sổ gọi, chi/chow, pon/pung, kan/kong, ron và hoàn thành hình bài bằng tsumo.
- Hoàn thành chuẩn bốn nhóm và một đôi hoặc bảy đôi, bài chờ chính xác, ukeire theo số quân còn thấy được, chỉ số hình bài so sánh và dữ kiện ở khu bài bỏ.
- Hồ sơ Riichi, MCR và Hong Kong nêu rõ ranh giới tính điểm trước và trong khi chơi; yaku, fan, thanh toán, hoa và luật nhà chưa hỗ trợ không bao giờ được trình bày như kết luận có thẩm quyền.
- Vòng học nhất quán: xem ứng viên hợp lệ gắn với trạng thái, so sánh bản xem trước giả định rồi xác nhận rõ ràng.

## Bản đồ kho lưu trữ

| Đường dẫn | Mục đích |
| --- | --- |
| [`src/domain/`](../src/domain/) | Quân bài, hồ sơ luật, ứng viên hợp lệ, chuyển trạng thái, che giấu thông tin và phân tích tay bài tất định. |
| [`src/i18n/catalogs.ts`](../src/i18n/catalogs.ts) | Mười một danh mục hoàn chỉnh hướng tới người học với các khóa và phần giữ chỗ ổn định. |
| [`src/App.tsx`](../src/App.tsx) | Thiết lập đa ngôn ngữ, bàn chơi, phòng thí nghiệm quyết định, nhật ký và giao diện phiên đã lưu. |
| [`docs/framework-contract.md`](../docs/framework-contract.md) | Các quy tắc được hỗ trợ chính xác và khoảng cách tính điểm dễ thấy. |
| [`docs/engine-lane.md`](../docs/engine-lane.md) | Kênh engine tùy chọn bị tắt mặc định và ranh giới tích hợp đã được xem xét. |
| [`docs/images/app.png`](../docs/images/app.png) | Ảnh chụp màn hình ứng dụng hiện tại. |

## Bắt đầu nhanh

Yêu cầu Node.js 20.19 trở lên và npm.

```bash
npm ci
npm run dev
```

<http://127.0.0.1:5182/>

Máy chủ phát triển và xem trước được cố định tại `127.0.0.1:5182`; nếu cổng bận, chúng sẽ dừng thay vì chọn cổng khác.

## Quyền hạn, quyền riêng tư và bằng chứng

- Giao diện chỉ hiển thị chế độ xem công khai đã che thông tin theo người xem; tay bài khác, thứ tự tường, seed và đánh giá riêng vẫn được giấu kín.
- ID ứng viên không thể đoán gắn với mã trạng thái đầy đủ, người hành động và hành động chuẩn. Tọa độ, tên quân, mô hình hay ứng viên cũ không thể cấp quyền đổi trạng thái.
- Bản xem trước chỉ là giả định. Quân tiếp theo trong tường vẫn ẩn cho đến khi xác nhận rõ ràng một lượt rút hợp lệ.
- Dữ kiện chính xác, giá trị tính toán, nguyên tắc biên soạn, ước tính engine, giải thích mô hình và phép so sánh luôn được gắn nhãn riêng. Điểm theo hệ luật chưa hỗ trợ được ghi rõ thay vì suy đoán.

## Xác minh

```bash
npm run check
git diff --check
```

Cổng kiểm tra chạy TypeScript nghiêm ngặt, kiểm tra miền tất định và khả năng lưu/khôi phục trạng thái, kiểm tra tính chẵn lẻ của danh mục 11 ngôn ngữ và giao diện người dùng do máy chủ kết xuất, bản dựng sản xuất, kiểm tra phụ thuộc, kiểm tra cú pháp shell và kiểm tra an toàn đường dẫn công cụ tùy chọn.

## Trích dẫn

Nếu bạn sử dụng LazyMahjong trong giảng dạy hoặc nghiên cứu, hãy trích dẫn kho mã. GitHub đọc [CITATION.cff](../CITATION.cff) và hiển thị bảng “Cite this repository”.

```bibtex
@software{chen_lazy_mahjong_2026,
  author  = {Chen, Lachlan},
  title   = {LazyMahjong: Four Winds Mahjong Decision Teacher},
  year    = {2026},
  version = {0.1.0},
  url     = {https://github.com/lachlanchen/LazyMahjong}
}
```

## Trạng thái

Bản phát hành này là phạm vi giảng dạy có ranh giới rõ: luồng quân bài, gọi bài, hoàn thành hình, bài chờ và phân tích quân đã thấy đều tất định; tính điểm và thanh toán đầy đủ cho Riichi, MCR và Hong Kong là công việc tương lai. Kênh engine tùy chọn bị tắt mặc định.
