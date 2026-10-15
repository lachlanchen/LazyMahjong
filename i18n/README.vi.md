[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyMahjong · Four Winds

*Rút bài, so sánh, giải thích rồi xác nhận—mà không để lộ tay bài của người khác.*

[![Lazying Art](https://img.shields.io/badge/Lazying-Art-0EA5E9?style=flat-square)](https://lazying.art) [![App screenshot](https://img.shields.io/badge/App-screenshot-173F5F?style=flat-square)](../docs/images/app.png) [![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyMahjong là công cụ dạy quyết định Mạt chược ưu tiên chạy cục bộ cho Riichi Nhật Bản, MCR Trung Quốc và luật Hong Kong. TypeScript tất định phụ trách tường bài, hành động hợp lệ, che giấu thông tin, kiểm tra hoàn thành, lịch sử và lưu trữ.

## Hỗ trợ công cụ giảng dạy mở

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## Xem trước ứng dụng

[![Ảnh chụp màn hình ứng dụng](../docs/images/app.png)](../docs/images/app.png)

Bàn hiện tại tách rõ tay bài úp của người học, lựa chọn hợp lệ, bản xem trước không đổi trạng thái và bằng chứng có nhãn nguồn gốc.

## Bàn chơi dạy gì

- Nguồn 136 quân có seed được mô hình hóa thành một chồng rút chung chưa chia, bốn vị trí, lượt rút, đánh bỏ, gọi bài hợp lệ và cơ hội Ron/Tsumo hoàn thành dạng hỗ trợ. Không mô hình hóa tường chết và dora Riichi.
- Hoàn thành chuẩn bốn nhóm và một đôi cùng bảy đôi theo hồ sơ: Riichi và bài học Hong Kong này cần bảy loại đôi khác nhau; MCR tính bộ bốn kín thành hai đơn vị đôi. Bài chờ, shanten, ukeire theo bản chưa thấy và bản đồ 34 loại đều theo hồ sơ đã chọn.
- Mỗi hồ sơ nêu rõ phạm vi dạy học. Ron/Tsumo chỉ kết thúc tay bài trên dạng hỗ trợ, không xác lập điểm, yaku/fan hay furiten.
- Mọi gợi ý dẫn đầu đồng hạng đều hiện mà không chọn trước. Xếp hạng theo shanten, ukeire chưa thấy rồi số loại; lượt rút bắt buộc là chính xác, hoàn thành chỉ chính xác về dạng/tính hợp lệ, và Bỏ lượt là gợi ý biên soạn.

## Bản đồ kho lưu trữ

| Đường dẫn | Mục đích |
| --- | --- |
| [`src/domain/`](../src/domain/) | Quân bài, hồ sơ luật, ứng viên hợp lệ, chuyển trạng thái, che giấu thông tin và phân tích tay bài tất định. |
| [`src/i18n/catalogs.ts`](../src/i18n/catalogs.ts) | Mười một danh mục hoàn chỉnh hướng tới người học với các khóa và phần giữ chỗ ổn định. |
| [`src/App.tsx`](../src/App.tsx) | Thiết lập đa ngôn ngữ, bàn chơi, phòng thí nghiệm quyết định, nhật ký và giao diện phiên đã lưu. |
| [`docs/framework-contract.md`](../docs/framework-contract.md) | Các quy tắc được hỗ trợ chính xác và khoảng cách tính điểm dễ thấy. |
| [`docs/engine-lane.md`](../docs/engine-lane.md) | Kênh engine tùy chọn bị tắt mặc định và ranh giới tích hợp đã được xem xét. |
| [`docs/images/app.png`](../docs/images/app.png) | Ảnh tham chiếu; cập nhật sau khi xác minh bản nguồn này trong trình duyệt. |

## Bắt đầu nhanh

Yêu cầu Node.js 20.19 trở lên và npm.

```bash
npm ci
npm run dev
```

<http://127.0.0.1:5182/>

Máy chủ phát triển và xem trước được cố định tại `127.0.0.1:5182`; nếu cổng bận, chúng sẽ dừng thay vì chọn cổng khác.

## Quyền hạn, quyền riêng tư và bằng chứng

- Giao diện chỉ hiện chế độ xem công khai theo người xem; tay khác, thứ tự tường, seed, đánh giá riêng, khả năng gọi bài và sự kiện bỏ lượt kín được giấu đến khi lượt gọi hoặc hoàn thành trở thành công khai.
- ID ứng viên không thể đoán gắn với mã trạng thái đầy đủ, người hành động và hành động chuẩn. Tọa độ, tên quân, mô hình hay ứng viên cũ không thể cấp quyền đổi trạng thái.
- Bản xem trước chỉ là giả định. Quân tiếp theo trong tường vẫn ẩn cho đến khi xác nhận rõ ràng một lượt rút hợp lệ.
- Dữ kiện chính xác, tính toán, hướng dẫn biên soạn, engine, mô hình và phép so sánh được tách riêng. “Bản chưa thấy” là bốn trừ số quân người xem nhìn thấy, không phải thành phần đã biết của chồng quân chưa chia hay xác suất rút; điểm chưa hỗ trợ không bị suy đoán.

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
