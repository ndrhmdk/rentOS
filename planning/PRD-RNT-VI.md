# PRD tiếng Việt — Kế hoạch RNT và phần việc của Tri

Ngày lập: 29/10/2026. Trạng thái: **Bản phân tích đề xuất, chờ người phụ trách/team review**.

Tài liệu giải thích yêu cầu đã có, tách phần triển khai thật khỏi bản minh họa và xác định đầu vào cần nhận từ team. Không thay thế hay tự phê duyệt thay đổi cho FR, acceptance, phân công hoặc kiến trúc gốc.

Ngữ cảnh cá nhân: người dùng đang làm `feat/rnt-04-admin-review`; vì vậy tài liệu lấy **Tri** làm người phụ trách cần hỗ trợ. Đây là giả định từ cuộc trao đổi, không phải xác minh danh tính GitHub. Nếu phân công cá nhân khác, cập nhật phần việc cá nhân trước khi giao agent code.

## 1. Kết quả cần đạt

Bạn cần trả lời được bốn câu hỏi trước mỗi RNT:

1. Người dùng sẽ thực hiện được hành động gì khi task hoàn thành?
2. Mình cần làm màn hình, API, dữ liệu và kiểm thử nào; phần nào thuộc người khác?
3. Cần nhận gì từ PR của team để bắt đầu hoặc tích hợp?
4. Bằng chứng nào cho phép kết luận đã hoàn thành, còn thiếu hoặc bị chặn?

Quy trình đề xuất từ thời điểm này: **đọc và phân tích → nêu điểm chưa rõ → trình kế hoạch → người dùng duyệt kế hoạch → triển khai đúng phạm vi → kiểm thử → review → bàn giao**. Việc viết tài liệu này không cho phép agent tự triển khai mã, kết nối Supabase, chạy migration hoặc deploy.

## 2. Nguồn và cách sử dụng

| Nguồn | Dùng để xác định |
| --- | --- |
| [Kế hoạch bốn phase](issue-plan.md), [16 issue](issues/) | Phân công, reviewer, phụ thuộc, đầu ra |
| [Sản phẩm](../docs/01-product/product-overview.md), [phạm vi ngoài MVP](../docs/01-product/goals-and-non-goals.md) | Mục tiêu, giới hạn sản phẩm |
| [Nghiệp vụ](../docs/02-domain/business-rules.md), [chuyển trạng thái](../docs/02-domain/state-transition.md) | Quy tắc và tác động dữ liệu |
| [Module PRD](../docs/03-modules/), [workflow](../docs/04-workflows/), [acceptance](../docs/06-acceptance/test-scenarios.md) | Yêu cầu chi tiết và cách nghiệm thu |
| [API](../docs/07-architecture/api-design.md), [xác thực](../docs/07-architecture/authentication-setup.md), [bảo mật](../docs/07-architecture/security-design.md) | Hợp đồng giữa frontend/backend, quyền, lỗi |
| [Data dictionary](../docs/07-architecture/data-dictionary.md), [migration thật](../backend/database/migrations/) | So sánh thiết kế với dữ liệu thực tế |
| [Frontend rules](../frontend/AGENTS.md), [backend rules](../backend/AGENTS.md) | Quy tắc theo phạm vi file |
| [Brand](../design/brand-guidelines.md), [UI/UX](../design/ui-ux-guidelines.md), [tokens](../design/tokens/rentos-tokens.css) | Layout, asset, màu, chữ, trạng thái giao diện |
| [Rubric](../docs/08-project/course-compliance.md), [PR template](../.github/PULL_REQUEST_TEMPLATE.md) | Bằng chứng và hình thức bàn giao |

Không coi checklist tài liệu là kết quả test. Không coi mã hiện tại là lý do để bỏ một yêu cầu đã duyệt. Khi nguồn mâu thuẫn, ghi rõ hai bên, đề xuất cách xử lý và xin quyết định cho phần bị ảnh hưởng; tiếp tục phân tích phần độc lập. Không tự sửa acceptance để hợp thức hóa code.

## 3. Mô hình sản phẩm cần hiểu đúng

- `property`: bất động sản/địa điểm vật lý.
- `unit`: căn/phòng cho thuê độc lập bên trong property.
- `listing`: tin đăng quảng cáo các unit đã chọn. Tạo property và tạo listing là hai hành động riêng.
- `rental_request`: yêu cầu thuê kèm thông tin liên hệ và khoảng ngày mong muốn; chưa giữ chỗ.
- `tenancy`: quan hệ thuê, có quy trình đề xuất, xác nhận, nhận phòng và kết thúc.
- `tenancy_contracts`: các phiên bản hợp đồng bất biến; hai bên phải xác nhận cùng phiên bản.
- `favourite_properties`: bất động sản đã lưu riêng tư theo tài khoản; không phải lưu một listing hay giữ phòng.
- `audit_logs`: lịch sử nghiệp vụ; khác log chẩn đoán lỗi.
- `notification_outbox`: bản ghi sự kiện chờ xử lý sau giao dịch; không có nghĩa thông báo đã được gửi thành công.

Một người có thể vừa thuê vừa làm chủ nhà. Quyền admin do server xác định từ tài khoản hiện tại. Laravel là nơi xác thực và xử lý nghiệp vụ; Supabase cung cấp PostgreSQL/Storage, không thay bằng Supabase Auth.

Ba khác biệt dễ làm sai:

1. **Duyệt tin không phải đăng công khai.** Sau phê duyệt, chủ nhà vẫn thực hiện bước publish hợp lệ.
2. **Gửi yêu cầu thuê không phải chấp nhận/giữ phòng.** Request chỉ chuyển `ACCEPTED` khi giao dịch tạo đề xuất tenancy thành công ở RNT-05.
3. **Đình chỉ không phải duyệt lại.** Admin suspension độc lập với phê duyệt lần đầu và việc chủ nhà publish/hide.

MVP không tự bổ sung thanh toán, lịch hẹn/chat, KYC/OTP, duyệt property/ảnh riêng, `CHANGES_REQUESTED`, chữ ký điện tử có giá trị pháp lý, AI thumbnail, Maps/geocoding, Google OAuth hoặc bộ E2E bắt buộc. Một số bản thiết kế/copy có nhắc chức năng ngoài MVP; phải đối chiếu PRD trước khi triển khai.

## 4. Bản đồ 16 RNT theo phase

Các phụ thuộc dưới đây là điều kiện tích hợp cuối; có thể chuẩn bị layout, fixture và hợp đồng API sớm. Không cần hoàn thành toàn bộ phase trước mới bắt đầu mọi việc ở phase sau. Không suy ra khối lượng bằng nhau từ số lượng issue.

| Phase | RNT / phụ trách / reviewer | Cần làm và đầu ra chính | Phụ thuộc |
| --- | --- | --- | --- |
| 1 | [RNT-01](issues/RNT-01.md) — Khai / Kien | Nền tảng PostgreSQL, migration/constraint, seed có thể tái lập, Telescope, Scramble, hướng dẫn setup và CI. Issue hiện tách cấu hình auth sang RNT-03. | Không |
| 1 | [RNT-02](issues/RNT-02.md) — Kien / Khai | Property/unit CRUD, tạo hàng loạt unit, ảnh Storage thật, amenities/policies có kiểm soát; listing draft/submit/publish/hide/archive riêng biệt. Bảo toàn lịch sử hợp đồng. | 01, 03, 04 |
| 1 | [RNT-03](issues/RNT-03.md) — Hien / Kien | Tài khoản, session, xác minh email, hồ sơ, đổi mật khẩu, CSRF và quyền. Issue rộng còn ghi token/recovery; PRD thu gọn đã ghi tách chúng: xem mục 10. | 01 |
| 1 | [RNT-04](issues/RNT-04.md) — **Tri / Khai** | Admin xem gói gửi duyệt lần đầu, phê duyệt/từ chối đúng nội dung, quyền server, kiểm soát xung đột và bằng chứng test. | 01, 03 |
| 2 | [RNT-05](issues/RNT-05.md) — Kien / Khai | Tạo tenancy, bản hợp đồng bất biến, xác nhận/đính chính, giữ khoảng ngày, nhận phòng/kết thúc. Chấp nhận request cùng giao dịch tạo proposal. | 01, 06, 07 |
| 2 | [RNT-06](issues/RNT-06.md) — Khai / Kien | Landing, tìm theo địa chỉ/ngày, lọc và chi tiết công khai; mọi điều kiện phải khớp cùng một unit trong cả khoảng ngày. Dùng API thật và quy tắc visibility thống nhất. | 02, 03, 04 |
| 2 | [RNT-07](issues/RNT-07.md) — **Tri / Khai** | Gửi/rút/từ chối request; inbox tenant/owner và yêu thích property riêng tư, bền vững, chống trùng/lệch phản hồi. | 01, 03, 06 |
| 2 | [RNT-08](issues/RNT-08.md) — Hien / Khai | Báo cáo vi phạm; điều tra, resolve/dismiss, đình chỉ/khôi phục có lý do; bảo mật người báo cáo và ghi chú admin. | 01, 04, 06 |
| 3 | [RNT-09](issues/RNT-09.md) — Kien / Khai | Gia hạn bằng segment hợp đồng mới; giữ thêm ngày chờ xác nhận, hết hạn thì chỉ giải phóng phần chưa thỏa thuận. | 05, 10 |
| 3 | [RNT-10](issues/RNT-10.md) — Khai / Kien | Worker/scheduler và outbox; notification riêng tư; dọn ảnh không còn tham chiếu sau retention, bảo vệ cover/lịch sử và retry an toàn. | 02, 05, 08 |
| 3 | [RNT-11](issues/RNT-11.md) — Hien / Khai | Quy tắc >=15 ngày chỉ từ chối khi không còn unit phù hợp toàn kỳ; cache công khai có invalidation/visibility mới; đo query và tải tài nguyên. | 06, 07, 09 |
| 3 | [RNT-12](issues/RNT-12.md) — **Tri / Khai** | Log có correlation, thông báo lỗi an toàn, cảnh báo lỗi nghiêm trọng/query chậm/tài nguyên host thực sự được gửi. | 01, 03, 08 |
| 4 | [RNT-13](issues/RNT-13.md) — Khai / Kien | Kiểm tra quyền/hợp đồng/xung đột; kiểm soát migration/deploy đồng bộ app-worker; diễn tập nâng cấp và phục hồi trên môi trường bỏ được. | 09, 10, 12 |
| 4 | [RNT-14](issues/RNT-14.md) — Kien / Hien | Regression owner/property/listing/ảnh; xử lý N+1 và ảnh quá lớn với số đo trước/sau cùng dữ liệu. | 02, 06, 10 |
| 4 | [RNT-15](issues/RNT-15.md) — Hien / Khai | Regression luồng tenant/search/request/favourite, hợp đồng response, riêng tư cache và hai báo cáo coverage có bằng chứng. | 07, 09, 11 |
| 4 | [RNT-16](issues/RNT-16.md) — **Tri / Hien** | Nghiệm thu admin/report, setup tái lập, README và bằng chứng demo/nộp bài; sửa lỗi còn lại theo chủ sở hữu. | 04, 08, 12, 13, 14, 15 |

Các issue phase 4 có thể lặp FR để regression. Không suy ra người làm regression trở thành chủ sở hữu triển khai ban đầu của toàn bộ FR đó.

## 5. PRD cá nhân — RNT-04: Kiểm duyệt tin lần đầu

### 5.1 Mục tiêu và phạm vi màn hình

Admin được xem toàn bộ gói nội dung gửi duyệt và quyết định trên chính phiên bản đã xem. Người thường không thể lấy dữ liệu hoặc quyết định bằng gọi API trực tiếp.

| Màn hình | Cần có | Giới hạn |
| --- | --- | --- |
| A01 — Bảng điều khiển | Tổng số tin chờ, lối vào hàng đợi, hoạt động có nguồn dữ liệu rõ ràng | Số báo cáo/đình chỉ liên quan RNT-08; không mở rộng RNT-04 thành toàn bộ admin |
| A02 — Hàng đợi | Chỉ lần đầu `PENDING`, cũ nhất trước, tìm/lọc/phân trang, chủ nhà, số căn/ảnh, thời điểm gửi, mở chi tiết | Không hiển thị lại mọi chỉnh sửa sau lần đã duyệt |
| A03 — Đánh giá gói | Listing, property, unit được quảng cáo, ảnh được chọn/cover, policies/amenities, chủ nhà, mức đầy đủ, nhật ký và quyết định | Không tạo queue duyệt property hoặc ảnh độc lập |

Ảnh A01/A02/A03 người dùng cung cấp là tham chiếu layout. Chỉ số, tên, thời gian và khung ảnh trong ảnh không phải yêu cầu fix cứng dữ liệu. Khi có cả mẫu bảng có dữ liệu và mẫu rỗng trong một ảnh thiết kế, chỉ render trạng thái phù hợp.

### 5.2 FR cần triển khai

- **FR13:** API và UI hàng đợi/chi tiết trả đủ gói tin; kiểm tra quyền admin trước khi đọc, không chỉ ẩn menu.
- **FR14:** phê duyệt nội dung đã gửi và admin vừa xem; lưu người duyệt/thời gian/dấu phiên bản theo contract được team thống nhất; không đổi publication thành `PUBLISHED`.
- **FR15:** từ chối bắt buộc lý do hợp lệ phía server; chủ nhà có thể sửa và gửi lại theo luồng RNT-02. Không tạo thêm trạng thái `CHANGES_REQUESTED` trong MVP.

### 5.3 Việc Tri phải làm

1. Nhận schema/fixture từ RNT-01 và contract session/quyền từ RNT-03. Chốt phần chưa rõ về revision ở mục 10 trước khi viết xử lý quyết định thật.
2. Thiết kế queue/detail/approve/reject API theo `/api/v1` và convention có sẵn. Tên route/payload cụ thể phải được ghi trong plan; tài liệu này chưa công bố endpoint mới.
3. Dùng validation, Policy, Resource, giao dịch và thứ tự khóa thống nhất. Kiểm tra account/admin hiện tại, mode session-only và CSRF. Không nhận reviewer/admin identity từ client.
4. So nội dung hiện tại với nội dung đã tải, xử lý thay đổi/đã có quyết định bằng `409`; không tin giá trị “current revision” do frontend tự gửi.
5. Lưu review, audit, replay/outbox cần thiết trong cùng giao dịch. Lỗi/rollback không để lại quyết định một nửa hay side effect gửi hai lần.
6. Nối UI thật, xử lý 401/403/409/419/422, loading/empty/network/retry; giữ lý do hợp lệ khi request lỗi; không lặp mutation mù sau timeout.
7. Thay dữ liệu minh họa bằng response được cấp quyền. Không đưa dữ liệu admin thật vào bundle tĩnh, static generation hoặc localStorage như một nguồn thẩm quyền.

### 5.4 Nghiệm thu RNT-04

- [ ] Admin xem và xử lý được gói tin seed thật từ UI qua API.
- [ ] Guest, user thường, PAT-only đều bị chặn theo mode/quyền đã duyệt; không rò thông tin gói tin.
- [ ] Hai admin quyết định đồng thời chỉ tạo một kết quả hợp lệ; replay không nhân audit/outbox.
- [ ] Owner sửa nội dung trước commit thì quyết định cũ thất bại, không lưu approval cho nội dung chưa xem.
- [ ] Lý do trống/sai kiểu/quá giới hạn trả lỗi trường phía server và không đổi dữ liệu.
- [ ] Phê duyệt cho phép publish về sau, không tự publish; từ chối vẫn có lý do/lịch sử đúng.
- [ ] Mutation thiếu/sai CSRF bị từ chối trước ghi dữ liệu; test không dựa vào bypass CSRF mặc định.
- [ ] Có component tests cho form/error/reload/pagination và API/PostgreSQL tests cho quyền, stale/concurrent/rollback.
- [ ] Dùng đúng layout/tokens/assets, bàn phím và kích thước 360/768/1440px; có ảnh thực tế.

## 6. PRD cá nhân — RNT-07: Yêu cầu thuê và yêu thích

Nguồn: [RNT-07](issues/RNT-07.md). FR: **25, 26, 27, 28, 29, 31, 32, 88**. Reviewer: Khai.

### 6.1 Phần phải làm

- Form yêu cầu thuê: `contact_name`, `contact_phone`, `desired_move_in_date`, `desired_end_date`, `preferred_unit_id` tùy chọn và lời nhắn. Lưu snapshot thông tin liên hệ, không suy lại từ hồ sơ đã sửa.
- Tenant xem request của mình và rút request còn `PENDING`.
- Owner xem request thuộc tài sản của mình, từ chối có lý do hoặc chuyển vào luồng tạo tenancy proposal của Kien. Không có nút Accept độc lập.
- Một tenant/listing có tối đa một request `PENDING`; dùng constraint phù hợp và xử lý request đồng thời/retry.
- Lưu/bỏ lưu property, list/count/ids riêng tư; idempotent theo trạng thái mong muốn. PUT lần đầu 201, lặp 200; DELETE lặp 204 theo contract hiện có trong tài liệu.
- Property đã lưu bị ẩn/đình chỉ/archive chỉ trả placeholder an toàn, không lộ title/ảnh/địa chỉ/lý do nội bộ; vẫn bỏ lưu được. Không xóa favourite chỉ vì khoảng ngày tạm hết phòng.
- UI serialize thao tác trái tim theo property, hòa giải phản hồi đến trễ; xóa dữ liệu private khi đổi tài khoản/logout. Guest được mời đăng nhập, không âm thầm xếp hàng thao tác lưu.

### 6.2 Tích hợp và nghiệm thu

Nhận safe public listing/property/unit DTO và visibility từ RNT-06; nhận session/CSRF từ RNT-03; thống nhất với RNT-05 action tạo proposal và dữ liệu request được tiêu thụ.

- [ ] Request hợp lệ vẫn `PENDING`, không giữ chỗ; unit ưu tiên phải thuộc đúng property/listing theo contract.
- [ ] Không đọc contacts hoặc sửa request/favourites của tài khoản khác bằng đoán UUID.
- [ ] Withdraw/reject so với proposal đồng thời chỉ cho một chuyển trạng thái hợp lệ, audit nhất quán.
- [ ] Save/delete lặp hoặc đồng thời không tạo trùng; UI không đảo ngược ý định cuối vì response cũ.
- [ ] Hidden placeholder và account switching không lộ dữ liệu.
- [ ] Có API/PostgreSQL và component tests; bàn giao RNT-05/RNT-11 với trạng thái và schema response rõ ràng.

Chưa làm hợp đồng/gia hạn, job >=15 ngày, hệ thống báo cáo vi phạm hoặc search engine thay người sở hữu task khác.

## 7. PRD cá nhân — RNT-12: Lỗi, chẩn đoán và cảnh báo

Nguồn: [RNT-12](issues/RNT-12.md). FR: **47, 48**, đồng thời đáp ứng các yêu cầu cảnh báo/tài nguyên trong rubric. Reviewer: Khai.

### 7.1 Phần phải làm

- Tái sử dụng Telescope do RNT-01 thiết lập; không cài lại hoặc coi mở được dashboard là xong monitoring.
- Correlation ID nối lỗi HTTP/job với log có cấu trúc và ngữ cảnh nghiệp vụ an toàn.
- Bảo vệ diagnostics theo quyền; che session/cookie, CSRF, Authorization, mật khẩu, reset link, token secret, contracts/contacts riêng tư.
- Cảnh báo lỗi nghiêm trọng, cảnh báo query chậm riêng lẻ và thời gian DB cộng dồn được phân biệt; threshold/dedup/rate limit phải được cấu hình, không tự coi ngưỡng đề xuất là yêu cầu đã duyệt.
- Theo dõi CPU/memory/disk/network và worker trên host thật được chọn. Nêu rõ metric nhà cung cấp không cung cấp và phương án thay thế cần duyệt.
- UI lỗi an toàn, có mã tham chiếu khi phù hợp, retry/re-authentication đúng hành động; không hiển thị stack trace hay thông báo đã thành công khi chưa commit.
- Delivery adapter có fallback, retry hữu hạn và không tạo vòng lặp cảnh báo khi chính kênh cảnh báo hỏng.

### 7.2 Điều kiện đầu vào và nghiệm thu

RNT-01 bàn giao Telescope/queue/log baseline; RNT-03 bàn giao diagnostics access/session; RNT-08 cung cấp luồng lỗi thực tế để tích hợp. Trước triển khai vận hành cần duyệt host, kênh/đích cảnh báo, ngưỡng và chi phí. Việc gửi thử đến người khác phải có ủy quyền cụ thể.

- [ ] Lỗi được tạo có kiểm soát → UI an toàn → log cùng correlation → cảnh báo đến đích đã được duyệt.
- [ ] Query chậm có cảnh báo được gửi và chống spam; không chỉ có ảnh Telescope.
- [ ] Có số đo tài nguyên và ít nhất một threshold alert thật trên môi trường đã chọn.
- [ ] User thường không xem diagnostics; log và lỗi không lộ bí mật.
- [ ] Kênh cảnh báo lỗi không làm hỏng giao dịch nghiệp vụ hoặc lặp vô hạn.
- [ ] Có test redaction, threshold/dedup, error mapping, quyền và adapter failure; evidence sanitized của delivery thực.

## 8. PRD cá nhân — RNT-16: Nghiệm thu và bàn giao cuối

Nguồn: [RNT-16](issues/RNT-16.md). Reviewer: **Hien**, theo metadata phân công; không dùng dòng mô tả legacy “D” để đổi người phụ trách.

Đây là vòng xác minh/sửa lỗi tích hợp cuối của các luồng admin/report/diagnostics; không chuyển toàn bộ trách nhiệm viết test của team cho Tri.

- Regression review/report: quyền server, lý do bắt buộc, nội dung stale, quyết định đồng thời, riêng tư reporter và tác động visibility công khai.
- Kiểm tra keyboard, mobile, loading/empty/error/retry, pagination trên dữ liệu/API thực.
- Diễn tập setup trên môi trường sạch theo README: phiên bản, env names, database, migrations, seeds, worker, scheduler, API docs, ERD, lệnh test/coverage và lỗi thường gặp.
- Tổng hợp bằng chứng thật từ RNT-13/14/15; mỗi lỗi quay về feature owner để sửa với regression test.
- Demo MP4 tối thiểu 720p, tối đa 10 phút, link public/unlisted truy cập được; quay hành vi đã triển khai và bằng chứng liên quan.
- Kiểm tra đủ báo cáo cá nhân của bốn thành viên cho năm sprint. Mỗi người tự viết nội dung của mình; Tri không bịa đóng góp thay người khác.
- Kiểm tra bằng chứng CSRF, Sanctum token/scopes, Scramble, Telescope và cảnh báo theo rubric. Có package hoặc một bảng token chưa phải bằng chứng chức năng hoàn thành.
- Coverage UI/business và API phải báo cáo **riêng**, mỗi loại >70% theo tài liệu rubric; số lượng test không suy ra phần trăm coverage.

Hoàn thành khi setup diễn tập thành công, regression có kết quả, bằng chứng truy cập được và phần giới hạn còn lại được mô tả trung thực. Không tự công bố đã nộp bài/deploy chỉ vì build qua.

## 9. Điều kiện nhận bàn giao từ team

| Task Tri bắt đầu | Cần nhận | Có thể làm khi chưa đủ | Chưa được kết luận |
| --- | --- | --- | --- |
| RNT-04 từ RNT-01 | Migration/constraint và hướng dẫn DB cô lập; fixture pending/approved/rejected; giải thích content snapshot/revision thực tế | Layout, fixture UI, plan API | PostgreSQL concurrency đúng khi chưa chạy/integrate |
| RNT-04 từ RNT-03 | Session/CSRF flow; current active/verified user; cách Policy kiểm tra admin và chặn PAT-only; safe DTO/lỗi 401/403/419 | UI demo dùng dữ liệu giả | Sidebar/frontend guard đã thay thế quyền API |
| RNT-07 từ RNT-06 | ID listing/property/unit, public eligibility, schema response và pagination, không rò contacts | Form và pure validation trên fixture | Endpoint ghi request nhận tài nguyên không tồn tại/không hợp lệ |
| RNT-07 sang RNT-05 | Request ID, ownership, contacts snapshot, trạng thái, quy tắc reject/withdraw/proposal cùng lúc | Chuẩn bị hợp đồng tích hợp | UI Accept riêng hoặc RNT-07 tự tạo tenancy |
| RNT-12 từ RNT-01/03/08 | Diagnostics baseline, access/redaction, luồng lỗi; sau đó host và alert destination được duyệt | Redaction/error UI/unit tests và thiết kế adapter | Cảnh báo vận hành đã hoàn thành bằng log mock |
| RNT-16 từ 04/08/12/13/14/15 | PR/head SHA, API/schema docs, lệnh và kết quả test, evidence/known limits, setup và demo inputs | Lập checklist/bảng bằng chứng | Nghiệm thu cuối khi phụ thuộc chỉ là ảnh/static fixture |

Tối thiểu mỗi PR phụ thuộc phải chỉ rõ: RNT/FR, base/head SHA, contract đã đổi, migration và tính tương thích, điều kiện môi trường, test/evidence, lỗi/giới hạn còn lại, việc người nhận cần làm. Một PR có thể chỉ bàn giao một phần; phải nêu chính xác phần đó.

Đánh giá đầu vào theo `SẴN SÀNG`, `SẴN SÀNG MỘT PHẦN`, `BỊ CHẶN`. Phân biệt “PR này có thể merge” với “Tri đã đủ điều kiện tích hợp task tiếp theo”.

## 10. Các điểm chưa thống nhất phải xử lý theo bằng chứng

| ID | Nguồn đang khác nhau | Rủi ro / cách xử lý trước mã liên quan |
| --- | --- | --- |
| D01 | [Issue RNT-03](issues/RNT-03.md) còn token/recovery; [PRD thu gọn RNT-03](issues/RNT-03-prd.md) tự ghi đã duyệt và tách chúng. [Rubric](../docs/08-project/course-compliance.md) vẫn bắt buộc token/scopes. | Tôn trọng phạm vi thu gọn đã được ghi nhận; xác nhận quyết định và owner/issue nhận phần tách. Không tự thêm lại vào RNT-03, cũng không bỏ tiêu chí cuối. Auth tối thiểu có thể bàn giao cho RNT-04 trước UI token. |
| D02 | Tổng quan/coverage cũ gộp auth vào setup; [RNT-01 hiện tại](issues/RNT-01.md) tách Fortify/Sanctum/CSRF/CORS sang RNT-03. | Ghi rõ phân công cần xác nhận; tránh agent cài/cấu hình trùng hoặc chờ sai người. |
| D03 | Tài liệu kỳ vọng row revision; [migration bỏ revision](../backend/database/migrations/2026_10_23_180000_drop_revision_columns.php) bỏ `revision` nhiều bảng nhưng vẫn giữ `content_revision`/submitted snapshot liên quan. | Không dùng cột không tồn tại, không xóa cơ chế chống stale. Team chốt contract version/snapshot/hash và chiến lược lock dựa trên schema thật trước ghi review/proposal; mọi migration bổ sung phải có plan/review. |
| D04 | Cuối RNT-04 ghi owner submit/publish thuộc RNT-06; [RNT-02](issues/RNT-02.md), [RNT-06](issues/RNT-06.md) và bảng phân công xác định Kien/RNT-02 viết listing; Khai/RNT-06 đọc công khai. | Ghi nhận dòng điều phối cũ; đối chiếu owner và cập nhật tài liệu sau khi team xác nhận, không để Tri triển khai nhầm. |
| D05 | [README](../README.md) yêu cầu PR vào `main`; local `origin/HEAD` trỏ `develop`. | Hai thông tin khác nhau chưa tự chứng minh nhánh nào sai. Xác nhận base của từng PR và chính sách branch protection; không retarget/merge/push theo suy đoán. |
| D06 | Backend AGENTS ghi PHP 8.5; composer yêu cầu ^8.4 và CI dùng 8.4. | Không tự thay runtime/CI. Chốt ma trận phiên bản được hỗ trợ từ lockfile và môi trường chạy; ghi rõ runtime chưa kiểm tra nếu thiếu PHP. |
| D07 | Tài liệu cũ nhắc `profiles`; PRD RNT-03 và API hiện dùng `users`. | Không tự thêm kho identity/profile thứ hai. So migrations thực và quyết định scope/schema trước khi code phụ thuộc. |
| D08 | Kiến trúc có nhắc TanStack Query; package frontend hiện chỉ có Next/React và không khai báo TanStack Query. | Không tự thêm dependency hay viết lại data layer. Plan phải nêu convention thực tế và chỉ thêm thư viện sau khi duyệt. |
| D09 | Metadata/bảng phân công RNT-08 là Hien; một dòng NFR cũ ghi Tri. RNT-16 còn alias “D”. | Dùng bảng phân công để trao đổi, ghi lỗi tài liệu; không tự chuyển ownership. |

Các mâu thuẫn trên chặn đúng phần contract/implementation bị ảnh hưởng, không buộc dừng đọc mã, soạn plan hoặc chuẩn bị fixture độc lập. Không tự tuyên bố tất cả là bug đã tái hiện trong production.

## 11. Trạng thái checkout khi lập tài liệu

Phạm vi xác minh là checkout local ngày 29/10/2026, HEAD `11a2ba8`, nhánh `feat/rnt-04-admin-review`, có thay đổi chưa commit. Không xác minh PR/CI/deployment mới trên GitHub trong lượt lập tài liệu này.

| Phần | Bằng chứng đã đọc | Kết luận có giới hạn |
| --- | --- | --- |
| A01/A02/A03 | `frontend/src/app/admin/`, `frontend/src/components/admin/` | Đã có UI và tương tác demo; không đồng nghĩa RNT-04 full-stack hoàn thành |
| Nguồn dữ liệu admin | [Fixture](../frontend/src/lib/admin-review-preview.ts), [package mẫu](../frontend/src/lib/admin-review-package.ts), [store local](../frontend/src/lib/admin-review-store.ts) | Dữ liệu giả, quyết định lưu localStorage; không thay server/database |
| Kiểm tra stale trong dialog | [Dialog](../frontend/src/components/admin/admin-review-dialog.tsx) truyền expected/current từ cùng version fixture | Không chứng minh owner edit trên server bị chặn; cần API/PostgreSQL evidence |
| API thật | [routes/api.php](../backend/routes/api.php) có health/me/tenant tenancies/owner properties | Chưa thấy queue/detail/approve/reject admin trong route này; Fortify routes do package đăng ký, cần kiểm tra route list khi chạy backend |
| Quyền frontend | [Admin shell](../frontend/src/components/admin/admin-shell.tsx) và [site frame](../frontend/src/components/site-frame.tsx) phục vụ preview | Không xem được quyền API admin thật từ việc menu xuất hiện; dữ liệu thật cần Policy và response riêng tư |
| API tài khoản | [CurrentUserResource](../backend/app/Http/Resources/CurrentUserResource.php) trả id/name/email/verification/phone | Không tự suy rằng frontend đã có contract capability admin; backend vẫn là nơi quyết định quyền |
| Công cụ/môi trường | Có khai báo dependency; chưa có `backend/.env`, `backend/vendor/autoload.php`; không tìm thấy php/composer/psql trong PATH lúc kiểm tra | Chưa thể xác nhận backend runtime/DB trong môi trường hiện tại. Không đọc bí mật hay kết nối shared Supabase |
| Test/evidence | Lượt phát triển UI trước có 13 test logic và kết quả lint/typecheck/build | Không đo coverage, không phải component/API/PostgreSQL suite; lượt soạn tài liệu này không chạy lại test ứng dụng |
| CI | [Workflow](../.github/workflows/ci.yml) có frontend lint/typecheck/build và backend checks/test | Chưa thấy bước chạy `test:admin-review` hay coverage trong workflow này; không đồng nghĩa CI đã đỏ/xanh ở head PR nào |

Không đổi trạng thái tất cả RNT của team dựa trên một nhánh local. Các kết luận phụ thuộc PR khác phải được audit tại đúng base/head của PR đó.

## 12. Thứ tự triển khai đề xuất sau khi được duyệt

1. **Ngay bây giờ:** review PRD này, xác nhận phần việc Tri, scope RNT-03 và cơ chế stale/revision. Giữ quyết định hoãn Supabase đã nêu trong cuộc trao đổi.
2. **RNT-04 / bước chuẩn bị:** audit PR nền tảng và auth bằng prompt review; phân loại điều kiện sẵn sàng. Viết implementation plan liệt kê file, contract, migration nếu cần, test, rủi ro và cách quay lui.
3. **RNT-04 / sau duyệt:** phát triển trên PostgreSQL local/personal cô lập hoặc endpoint đã được phép; triển khai quyền/API/giao dịch, nối UI và thay nguồn demo trong mode thật. Không thử ghi trên shared Supabase chỉ vì có URL dashboard.
4. **RNT-07:** nhận public DTO từ RNT-06 và chốt biên proposal với Kien; triển khai request/favourite và test đồng thời/riêng tư.
5. **RNT-12:** nhận baseline và duyệt host/kênh/ngưỡng trước; làm diagnostics/error UI, rồi chứng minh delivery thật có kiểm soát.
6. **RNT-16:** audit tích hợp và diễn tập setup/demo sau khi các phụ thuộc đủ điều kiện; tổng hợp thiếu sót và giới hạn trung thực.

Không đặt deadline giả. Các bước có thể chia thành nhiều PR thuộc cùng RNT; không tách lại thành hàng loạt issue nhỏ hay dùng RNT như số issue GitHub.

## 13. Kế hoạch triển khai môi trường — chưa phải lệnh deploy

Trước khi chạm môi trường dùng chung, người phụ trách phải duyệt: hosting frontend/API, PostgreSQL/Storage, worker/scheduler, domain/cookie/CORS, secrets, budget, backup/restore, health checks, quyền deploy và nhánh nguồn.

- Browser dùng session/CSRF. Domain hoặc same-origin proxy phải được kiểm tra theo contract; không tự đưa service-role/database secret vào `NEXT_PUBLIC_*`.
- Test/preview dùng dữ liệu và quyền cô lập. Không chạy suite reset database, seed demo, `migrate:fresh`, reset/refresh hoặc `db:wipe` trên shared/staging/production.
- Migration thật chỉ là thay đổi đã review, chạy tuần tự trên môi trường đã xác định, có kế hoạch backup/phục hồi và phiên bản app/worker tương thích. Rollback app không mặc nhiên rollback được schema/data.
- Pipeline phải kiểm tra đúng commit sẽ deploy; PR không nhận credential production. RNT-01 hiện không bao gồm deploy pipeline; phối hợp RNT-13 để chốt phần này.
- Trước bàn giao môi trường: xác minh private routes, CSRF, visibility sau publish/hide/suspend, worker/scheduler và alerts theo tính năng thực sự đã có. Không coi health endpoint trả 200 là toàn bộ nghiệp vụ đã hoạt động.
- Preview localStorage phải được tách rõ khỏi mode thật; không đưa demo admin hoặc khả năng reset mẫu thành công cụ sửa dữ liệu thật.

Hiện chưa chọn nhà cung cấp hay thực hiện deploy trong tài liệu này.

## 14. Tiêu chuẩn bắt đầu và hoàn thành

### Sẵn sàng phát triển

- [ ] RNT, phạm vi, owner/reviewer và base branch được xác nhận.
- [ ] Đã đọc rules áp dụng, PRD/workflow/acceptance và contract liên quan.
- [ ] Đã xem source/schema thật, xác định phần tái sử dụng và file WIP phải giữ.
- [ ] Phụ thuộc tối thiểu có bằng chứng hoặc đã xác định phần được làm độc lập.
- [ ] Mâu thuẫn ảnh hưởng plan đã có quyết định, không còn giả định ngầm nguy hiểm.
- [ ] Người dùng duyệt implementation plan cụ thể. Chưa có duyệt thì chưa sinh/sửa mã.

### Hoàn thành tính năng thật

- [ ] Hành vi UI/API/database đúng FR/acceptance trong phạm vi đã duyệt.
- [ ] Validation, quyền, transaction/lock/replay và lỗi có bằng chứng tương ứng.
- [ ] Types, Resource/FormRequest/OpenAPI và docs thay đổi cùng contract.
- [ ] Component/unit và API/PostgreSQL tests thực sự cần thiết đã chạy; thao tác UI kiểm tra thủ công có ghi nhận.
- [ ] Lint/typecheck/build phù hợp qua; không suy ra từ đó rằng integration hoặc coverage đã đạt.
- [ ] PR ghi RNT/FR, commit, migration/env names, test commands/results, ảnh UI, known limits và điều kiện cho task tiếp theo.
- [ ] Reviewer độc lập đã đánh giá; merge/push/deploy là thao tác riêng chỉ thực hiện khi được ủy quyền.

## 15. Cách dùng hai agent

1. Dùng [prompt agent code](PROMPT-AGENT-CODE-VI.md). Điền RNT, phạm vi và người phụ trách. Ở lượt đầu agent phải trả plan và dừng trước mã; chỉ duyệt sau khi đọc được danh sách file/contract/test/rủi ro.
2. Dùng [prompt agent review/audit](PROMPT-AGENT-REVIEW-VI.md). Điền PR URL thực tế và RNT bạn sắp bắt đầu. Agent review đọc diff tại head SHA cụ thể, không sửa code hoặc đăng comment lên GitHub khi chưa được yêu cầu.
3. Nếu review báo thiếu đầu vào, gửi báo cáo cho feature owner bằng kênh do bạn chọn. Reviewer không tự nhận thay implementation hoặc sửa task của người khác.
4. Khi plan hoặc head PR đổi, cập nhật phần phân tích bị ảnh hưởng; không dùng kết luận của phiên bản cũ như bằng chứng cho commit mới.
