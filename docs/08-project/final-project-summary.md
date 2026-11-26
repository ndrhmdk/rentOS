# rentOS — Báo cáo Tổng kết Dự án (Final Project Summary)

> **Dự án:** rentOS — Nền tảng Quản lý Cho thuê & Tìm kiếm Phòng trọ / Căn hộ dài hạn tại Đà Nẵng  
> **Kiến trúc:** Next.js `16.4.6` (App Router, TypeScript, Tailwind CSS) + Laravel `13` (PHP `8.4`, Sanctum) + PostgreSQL `17`  
> **Trạng thái:** Hoàn thiện toàn bộ `M01–M10` (`83 FRs`, `29 Workflows`), kiểm chứng tự động + E2E thực tế trên Local & Production (`rentos.io.vn`).

---

## 1. Executive Summary & Tech Stack

**rentOS** giải quyết bài toán tìm kiếm nhà trọ/căn hộ minh bạch và quản lý hợp đồng thuê dài hạn theo quy trình khép kín giữa 4 nhóm tác nhân: **Guest**, **Tenant (Người thuê)**, **Owner (Chủ nhà)** và **Admin (Quản trị viên)**.

| Lớp hệ thống | Công nghệ & Phiên bản | Vai trò chính |
| :--- | :--- | :--- |
| **Frontend** | Next.js `16.4.6` (Turbopack), React `19`, TypeScript, Tailwind CSS v4 | SSR/Partial Prerendering trang công khai, Portal Owner/Tenant/Admin, xác thực Cookie + CSRF |
| **Backend API** | Laravel `13` (PHP `8.4`), Laravel Fortify, Laravel Sanctum | REST API `/api/v1/*`, chính sách phân quyền Policy, xử lý transaction & state machine |
| **Database & Search** | PostgreSQL `17` (`pg_trgm`, UUIDv7, JSONB) | Lưu trữ quan hệ chuẩn hóa (`20` bảng chính), tìm kiếm tiếng Việt không dấu/trigram, ràng buộc ngày thuê |
| **Email & Async Queue** | Resend (`noreply@rentos.io.vn` verified qua iNET DNS), Database Queue | Gửi email xác thực, đặt lại mật khẩu, thông báo phê duyệt/đình chỉ tin & hợp đồng bất đồng bộ |
| **API Docs & Ops** | Scramble OpenAPI (`/docs/api`), Laravel Telescope (`/telescope`), `OpsAlerter` | Tự động sinh tài liệu OpenAPI, theo dõi Slow Query (`SlowQueryMonitor`), Mail & Request logs |
| **CI/CD & Quality** | GitHub Actions (`PHP 8.4` + `PCOV`, `Node 22`, `PostgreSQL 17`), Pint, PHPStan, Vitest, ESLint | Tự động kiểm tra lint, static analysis, test coverage `>= 70%` và production build |

---

## 2. System Design & Engineering Deep-Dive

### 2.1. Chiến lược Caching (`ListingCacheService` & HTTP Cache)
- **Những bài toán bắt buộc dùng Cache:**
  1. **Tìm kiếm & danh sách công khai (`GET /api/v1/listings`):** Truy vấn lọc theo phường/quận, khoảng giá, số phòng ngủ, khoảng ngày trống và sắp xếp có chi phí JOIN/aggregate cao trên PostgreSQL — đây là endpoint có lưu lượng đọc lớn nhất từ Guest/SEO.
  2. **Chi tiết tin đăng công khai (`GET /api/v1/listings/{listing}`):** Đọc đồng thời thông tin Property, Units, Amenities, Policies và Media.
  3. **Danh mục địa điểm (`GET /api/v1/locations`):** Dữ liệu ít thay đổi nhưng được gọi liên tục ở thanh tìm kiếm trang chủ và bộ lọc.
- **Cách triển khai trong rentOS:**
  - `ListingCacheService` quản lý cache version/key tách biệt cho danh sách tìm kiếm và từng chi tiết tin đăng, đính kèm header quan sát **`X-Cache: HIT` / `MISS`** và `ETag` (`304 Not Modified`).
  - Tham chiếu số liệu benchmark chi tiết tại [`docs/07-architecture/performance-evidence.md`](../07-architecture/performance-evidence.md) và [`docs/07-architecture/query-evidence.md`](../07-architecture/query-evidence.md).
- **Bài toán Cache Invalidation (Đảm bảo tính nhất quán):**
  - Mọi hành động làm thay đổi khả năng hiển thị công khai — Owner chỉnh sửa/ẩn/lưu trữ tin (`ListingLifecycleService`), Admin duyệt/từ chối (`AdminListingReviewsController`), hoặc Admin đình chỉ/khôi phục tin qua báo cáo (`SuspendListingAction`, `RestoreListingAction`, `ResolveListingReportAction`) — đều **gọi `ListingCacheService::invalidateListing(...)` sau khi transaction DB commit**, đảm bảo tin bị đình chỉ lập tức biến mất khỏi `/listings` (`X-Cache: MISS`) và `/listings/{id}` trả `404`.

### 2.2. Thách thức System Design & Xử lý Tranh chấp (Concurrency)
1. **Chống ghi đè đồng thời khi duyệt tin (`Optimistic + Pessimistic Locking`):**
   - API duyệt tin (`/api/v1/admin/listing-reviews/{id}/approve|reject`) yêu cầu **`expected_snapshot`** (hash trạng thái gói tin tại thời điểm Admin mở xem) và **`client_operation_id`** (idempotency key).
   - Bên trong `DB::transaction()`, hệ thống khóa dòng dữ liệu (`lockForUpdate()`). Nếu Owner vừa sửa nội dung khiến `snapshot_token` đổi hoặc một Admin khác đã xử lý trước, request bị từ chối với HTTP `409 Conflict` thay vì duyệt nhầm phiên bản cũ.
2. **Ngăn trùng lịch thuê & Race Condition hợp đồng (`Unit` / `Tenancy`):**
   - `ConfirmTenancyContract`, `ProposeTenancy`, `ProposeTenancyRenewal` khóa bản ghi `Unit` và kiểm tra xung đột khoảng ngày `[start_date, end_date]` trước khi chuyển trạng thái sang `ACTIVE`.
   - Khi một hợp đồng được xác nhận hoặc căn hết chỗ, `RejectAgedRentalRequestAction` / `SubmitRentalRequest` xử lý tự động từ chối các yêu cầu thuê xung đột (`WF-15`).
3. **Bảo mật Non-Disclosure & Phân tách Kênh Xác thực:**
   - Các endpoint quản trị báo cáo (`/api/v1/admin/listing-reports*`, `/api/v1/admin/listings/*/suspend|restore`) gắn `EnsureAdminSession:404` + `->whereUuid(...)` để **trả về `404` với người dùng thường / admin chưa xác thực email hoặc bị đình chỉ** (tránh lộ sự tồn tại của API quản trị), đồng thời chặn PAT (`403`) trên các luồng thao tác nhạy cảm chỉ dành cho Web Session có CSRF.
   - `FR72 Reporter Privacy`: `ListingReportsController` loại bỏ hoàn toàn `internal_notes` và `reviewed_by` khi Tenant xem lại báo cáo của chính mình.

### 2.3. Công cụ Bổ trợ (Email, Cron & Request Handling)
- **Email Delivery (`Resend` + `ResendDomainMailer` + Queue):**
  - Xác thực email (`VerifyEmail`), đặt lại mật khẩu, thông báo phê duyệt/từ chối tin, và cập nhật kết quả báo cáo/hợp đồng được đẩy vào **Database Queue (`jobs`)** để không làm chậm phản hồi HTTP của người dùng.
  - `ResendDomainMailer` gửi kèm `idempotency_key` theo `eventKey`, tránh gửi trùng email khi worker retry. Trên môi trường Local, cấu hình `MAIL_MAILER=resend` với domain `rentos.io.vn` (đã verify DNS qua iNET) gửi mail thật thành công tới hộp thư ngoài (`mail.tm`, `guerrillamail.com`) trong ~5–10 giây và lưu bản ghi kiểm tra tại `/telescope/mail`.
- **Cron & Scheduled Commands:**
  - `RejectAgedRentalRequests` (`app/Console/Commands/RejectAgedRentalRequests.php`): Tự động từ chối các yêu cầu thuê quá hạn chưa được chủ nhà phản hồi.
  - `ExpireTenancyReservation`: Xử lý hết hạn giữ chỗ khi hợp đồng đề xuất không được xác nhận đúng hạn.
- **Request Handling & Observability:**
  - Rate limiting chống spam đăng nhập, gửi báo cáo (`429 Too Many Requests`), `LogApiRequest`, `SlowQueryMonitor` và `OpsAlerter` cảnh báo truy vấn chậm/lỗi nghiêm trọng.

---

## 3. Ma trận Trạng thái Các Workflow Cốt lõi (`WF-01` → `WF-29`)

Toàn bộ `29 Workflows` thuộc `10 Modules` (`M01–M10`, `83 FRs`) đã được triển khai hoàn chỉnh với máy trạng thái chặt chẽ:

| Đối tượng / Workflow | Chuỗi Trạng thái Đầy đủ | Điều kiện chuyển & Bảo vệ chính |
| :--- | :--- | :--- |
| **Listing Moderation & Publication** (`WF-03`, `WF-04`, `WF-05`, `WF-27`) | `DRAFT` $\rightarrow$ `PENDING_REVIEW` $\rightarrow$ `APPROVED` / `REJECTED` $\rightarrow$ `PUBLISHED` / `HIDDEN` / `ARCHIVED` *(hoặc `SUSPENDED` bởi Admin)* | Phải đủ ảnh dùng chung + unit hợp lệ mới submit được; Admin duyệt dùng `snapshot_token` + `client_operation_id`; `SUSPENDED` chặn hiển thị & vô hiệu cache công khai. |
| **Rental Request** (`WF-07`, `WF-08`, `WF-15`, `WF-24`) | `PENDING` $\rightarrow$ `ACCEPTED` / `REJECTED` / `WITHDRAWN` / `AUTO_REJECTED` | Tenant gửi trên tin `PUBLISHED`; Owner chấp nhận/từ chối; tự động từ chối khi quá hạn (`Cron`) hoặc căn đã có hợp đồng trùng ngày. |
| **Tenancy & Contract** (`WF-09`, `WF-10`, `WF-11`, `WF-25`, `WF-26`) | `PROPOSED` $\rightarrow$ `CORRECTION_REQUESTED` $\rightarrow$ `CONFIRMED` / `ACTIVE` $\rightarrow$ `ENDED` / `CANCELLED` *(hoặc `EXPIRED`)* | Tạo bản ghi điều khoản bất biến theo phiên bản; kiểm tra không trùng ngày thuê; hỗ trợ đề xuất chỉnh sửa trước khi xác nhận. |
| **Tenancy Renewal** (`WF-12`, `WF-13`, `WF-14`) | `RENEWAL_REQUESTED` $\rightarrow$ `RENEWAL_PROPOSED` $\rightarrow$ `CORRECTION_REQUESTED` $\rightarrow$ `CONFIRMED` / `DECLINED` | Cho phép người thuê đang ở đề nghị gia hạn nối tiếp kỳ thuê hiện tại mà không xung đột lịch. |
| **Listing Report & Admin Investigation** (`WF-16`, `WF-17`) | `OPEN` $\rightarrow$ `REVIEWING` $\rightarrow$ `RESOLVED` / `DISMISSED` *(kèm `SUSPENDED` / `RESTORED` trên Listing)* | Chống spam bằng rate limit (`429`) + chặn trùng báo cáo đang mở (`409`); ẩn `internal_notes` với người báo cáo (`FR72`). |
| **API Tokens (PAT)** (`WF-28`, `WF-29`) | `ACTIVE` $\rightarrow$ `REVOKED` / `EXPIRED` | Hiển thị plaintext token duy nhất 1 lần khi tạo; kiểm tra khả năng/scopes (`account:read`, `listings:read`, `favourites:read`, ...). |

---

## 4. Chất lượng Mã nguồn, Bảo mật & Kiểm thử Tự động

Tất cả kiểm thử được chạy lại trên nhánh sạch **`feat/rnt-16-final-deliverables`** (đồng bộ `origin/develop` gồm PR #139 và PR #140):

| Hạng mục | Lệnh kiểm tra | Kết quả thực tế |
| :--- | :--- | :--- |
| **Backend Style** | `cd backend && composer run lint` (`pint --test`) | **Passed** (`0` lỗi format) |
| **Backend Static Analysis** | `cd backend && composer run typecheck` (`phpstan --memory-limit=1G`) | **Passed** (`0` errors) |
| **Backend Tests & Coverage** | `cd backend && php artisan test --coverage --compact --min=70` | **457/457 passed** (`4,522` assertions) — **Coverage: 94.2%** |
| **Frontend Lint & Types** | `cd frontend && npm run lint && npm run typecheck` | **Passed** (`0` ESLint errors, `0` TypeScript errors) |
| **Frontend Tests & Coverage** | `cd frontend && npm run test:coverage` | **66/66 files, 297/297 passed** — **75.81% Stmts / 76.56% Branch / 72.12% Funcs / 75.81% Lines** |
| **Frontend Production Build** | `cd frontend && npm run build` (`Next.js 16.4.6` Turbopack) | **Passed** (`48/48` routes compiled cleanly) |

---

## 5. Kiểm thử E2E Thực tế (3 Browser Agents Song Song) & Lỗi đã Debug

Trước khi đóng gói báo cáo, hệ thống được **reset DB sạch (`migrate:fresh`)**, chỉ giữ 1 tài khoản Admin (`admin@rentos.test`) và chạy **3 Browser Agents** đóng vai trò người dùng thật đăng ký tài khoản mới qua **Resend (`noreply@rentos.io.vn`)**:
- **Owner mới:** `apparentelora@euploading.com` (`mail.tm`) — nhận email xác thực thật, tạo Property, Unit, Listing, gửi duyệt, đăng công khai.
- **Tenant mới:** `qqnlstqj@sharklasers.com` (`guerrillamail.com`) — nhận email xác thực thật sau ~10s, tìm kiếm, lưu yêu thích, tạo PAT token, gửi yêu cầu thuê và gửi báo cáo vi phạm.
- **Admin & Ops:** Duyệt tin đăng (`APPROVED`), điều tra báo cáo (`OPEN -> REVIEWING -> RESOLVED`) kèm đình chỉ tin (`SUSPENDED`), kiểm tra Scramble `/docs/api` và Telescope `/telescope/mail`.

**Các lỗi thực tế phát hiện trong lúc test E2E và đã được sửa ngay:**
1. **Trùng query param `?verified=1?verified=1` khi xác thực email** (`backend/config/fortify.php`): Fortify tự động nối `?verified=1` vào redirect URL, đã sửa bỏ `?verified=1` dư thừa trong config.
2. **Badge đếm giả (`1`, `2`) trên Sidebar Owner/Tenant** (`frontend/src/config/navigation.tsx`): Đã gỡ bỏ các badge hardcoded gây hiểu nhầm trên tài khoản mới.
3. **Lỗi `403` Console trên `/api/v1/favourite-properties/ids` trước khi verify email** (`frontend/src/features/discovery/favourites-provider.tsx`): Đã chặn gọi API favourites khi `user?.email_verified_at === null`.
4. **Nhãn và ví dụ cURL trên `/api-tokens`** (`frontend/src/components/api-tokens/api-tokens-panel.tsx`): Sửa `Dùng gần nhất` khi `null` từ `"Không hết hạn"` thành `"Chưa sử dụng"`, sửa ví dụ cURL hiển thị đầy đủ base URL `http://localhost:8000`.
5. **Điều hướng Admin & Tiếng Việt hóa** (`frontend/src/components/site-header.tsx`, `frontend/src/app/admin/page.tsx`, `frontend/src/app/page.tsx`): Thêm link `"Cổng quản trị"` (`/admin`) chỉ hiển thị với Admin, Việt hóa nhãn `listing.created`/`submitted`/`published`, và sửa lỗi chính tả `"khoảng phí"` $\rightarrow$ `"khoản phí"`.

---

## 6. Đối chiếu Tiêu chí Đánh giá Khóa học (`T1a–T6d`)

Bảng dưới đây dùng đúng nhãn của đề bài gốc; chi tiết đầy đủ xem [`course-compliance.md`](course-compliance.md).

| Nhóm | Yêu cầu theo đề | Bằng chứng trong Repo |
| :--- | :--- | :--- |
| **T1** Git workflow | Repo GitHub, commit message, Issues, PR + CI | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), `planning/issues/`, topic branches `feat/*`, `fix/*` |
| **T2** Database | Migration, seeder, factory | [`database-schema.mmd`](../07-architecture/database-schema.mmd), [`data-dictionary.md`](../07-architecture/data-dictionary.md), `backend/database/seeders/` |
| **T3** UI & chức năng | UI (Next.js thay Blade/Livewire, cần giảng viên duyệt), đăng ký/đăng nhập, CSRF + validation, tìm kiếm/lọc, API ngoài (Supabase Storage, Resend), test >70% | [`README.md`](../../README.md), ảnh `01`, `02`, `10`, `13`, **`23` (Supabase thật)**, **`24` (Resend delivered)**, coverage `19`/`20` |
| **T4** REST API | Resource controller, Sanctum token + scopes, Scramble, test >70% | [`api-design.md`](../07-architecture/api-design.md), ảnh `10`, `14`, backend coverage `94.2%` |
| **T5** Logging & Monitoring | Telescope, error logging, slow-query alert, giám sát server | [`observability.md`](../05-non-functional-requirements/observability.md), `infrastructure/netdata/`, ảnh `13`, **`18`/`18b` (Netdata dashboard + Discord alert)** |
| **T6** Hiệu năng | Async/queue, tải tài nguyên, caching, antipattern | [`performance-evidence.md`](../07-architecture/performance-evidence.md), [`query-evidence.md`](../07-architecture/query-evidence.md), Lighthouse ảnh `15`, `16` |

---

## 7. Thư viện Bằng chứng UI & Hiệu năng (`docs/06-acceptance/evidence/ui/`)

### 7.1. Luồng Công khai, Tìm kiếm & Báo cáo Vi phạm (Guest / Tenant)
| Trang chủ (`/`) | Tìm kiếm & Bộ lọc (`/listings`) |
| :---: | :---: |
| ![Trang chủ rentOS](../06-acceptance/evidence/ui/01-landing-home.png) | ![Tìm kiếm phòng trọ](../06-acceptance/evidence/ui/02-listings-search.png) |

| Chi tiết Tin đăng & Modal Báo cáo (`/listings/[id]`) | Theo dõi Báo cáo & FR72 Privacy (`/tenant/reports`) |
| :---: | :---: |
| ![Modal báo cáo vi phạm](../06-acceptance/evidence/ui/03-listing-detail-report.png) | ![Báo cáo của tôi](../06-acceptance/evidence/ui/09-tenant-reports-fr72.png) |

### 7.2. Cổng Người thuê & Chủ nhà (Tenant & Owner Portals)
| Tổng quan Cư dân (`/tenant`) | Quản lý PAT & Scopes (`/api-tokens`) |
| :---: | :---: |
| ![Tenant Dashboard](../06-acceptance/evidence/ui/08-tenant-dashboard.png) | ![API Tokens](../06-acceptance/evidence/ui/10-api-tokens-scopes.png) |

| Tổng quan Chủ nhà (`/owner`) | Bất động sản & Đơn vị phòng (`/owner/properties/[id]`) |
| :---: | :---: |
| ![Owner Dashboard](../06-acceptance/evidence/ui/04-owner-dashboard.png) | ![Owner Property & Units](../06-acceptance/evidence/ui/05-owner-property-units.png) |

| Tin đăng Chờ duyệt (`PENDING_REVIEW`) | Tin đăng Công khai (`PUBLISHED`) |
| :---: | :---: |
| ![Owner Listing Pending](../06-acceptance/evidence/ui/06-owner-listing-pending.png) | ![Owner Listing Published](../06-acceptance/evidence/ui/06b-owner-listing-published.png) |

### 7.3. Cổng Quản trị, Email Resend & OpenAPI (Admin & Ops)
| Hàng đợi Kiểm duyệt (`/admin/review-queue`) | Điều tra Báo cáo & Đình chỉ (`/admin/reports`) |
| :---: | :---: |
| ![Admin Review Queue](../06-acceptance/evidence/ui/11-admin-review-queue.png) | ![Admin Reports Suspend](../06-acceptance/evidence/ui/12-admin-reports-suspend.png) |

| Telescope Mail Log (Resend) | Scramble OpenAPI Docs (`/docs/api`) |
| :---: | :---: |
| ![Telescope Mail](../06-acceptance/evidence/ui/13-mail-telescope.png) | ![Scramble OpenAPI](../06-acceptance/evidence/ui/14-openapi-scramble.png) |

### 7.3b. Bằng chứng bảo mật, kiểm thử và dữ liệu
| CSRF hợp lệ / bị từ chối (`419` / `422` / `201`) | Token theo scope: cho phép, từ chối, thu hồi (`200` / `403` / `401`) |
| :---: | :---: |
| ![CSRF](../06-acceptance/evidence/ui/07-csrf-valid-and-rejected.png) | ![Token 401](../06-acceptance/evidence/ui/17-token-401-revoked.png) |

| Coverage Backend (`94.2%`) | Coverage Frontend (`75.8%`) |
| :---: | :---: |
| ![Coverage backend](../06-acceptance/evidence/ui/19-coverage-backend.png) | ![Coverage frontend](../06-acceptance/evidence/ui/20-coverage-frontend.png) |

| Bảng điều khiển Admin (`/admin`) | ERD (render từ `database-schema.mmd`) |
| :---: | :---: |
| ![Admin dashboard](../06-acceptance/evidence/ui/21-admin-dashboard.png) | ![ERD](../06-acceptance/evidence/ui/22-erd.png) |

### 7.3c. Tích hợp dịch vụ ngoài thật (T3f) & giám sát server (T5d)
| Supabase Storage — bucket `property-media` có object upload thật | Resend — email xác minh đã **Delivered** |
| :---: | :---: |
| ![Supabase Storage objects](../06-acceptance/evidence/ui/23-supabase-storage-objects.png) | ![Resend delivered inbox](../06-acceptance/evidence/ui/24-resend-inbox.png) |

| Netdata VPS dashboard (CPU, RAM, disk, network) | Netdata alert đã gửi Discord (`rentos_ram_usage`) |
| :---: | :---: |
| ![Netdata dashboard](../06-acceptance/evidence/ui/18-netdata-dashboard.png) | ![Netdata Discord alert](../06-acceptance/evidence/ui/18b-netdata-alert.png) |

> Ảnh `07` và `17` là kết quả phản hồi thật từ API local, được dựng lại thành ảnh; ảnh `19` là phần cuối output thật của `php artisan test --coverage`. Ảnh `23`/`24` là bằng chứng gọi Supabase Storage và Resend trên môi trường thật (không dùng `Http::fake`). Ảnh `18`/`18b` chụp từ Netdata trên VPS host qua SSH tunnel và Discord webhook.

### 7.4. Báo cáo Hiệu năng Lighthouse (Production `rentos.io.vn`)
- **Lần đo 1 — mobile (`2026-11-25 20:30:56`):** Performance **94** · Accessibility **96** · Best Practices **96** · SEO **100**
- **Lần đo 2 — desktop (`2026-11-25 20:32:00`):** Performance **100** · Accessibility **96** · Best Practices **96** · SEO **100**

| Lighthouse mobile (Perf 94 / A11y 96 / BP 96 / SEO 100) | Lighthouse desktop (Perf 100 / A11y 96 / BP 96 / SEO 100) |
| :---: | :---: |
| ![Lighthouse 20-30-56](../06-acceptance/evidence/ui/15-lighthouse-rentos-20-30-56.png) | ![Lighthouse 20-32-00](../06-acceptance/evidence/ui/16-lighthouse-rentos-20-32-00.png) |

---

## 8. Giới hạn Hiện tại & Checklist Nộp bài Cuối kỳ

- **Giới hạn kỹ thuật đã biết:**
  - Chưa tích hợp cổng thanh toán trực tuyến (tiền cọc/tiền thuê được ghi nhận theo thỏa thuận hợp đồng).
  - Các lệnh cron (`RejectAgedRentalRequests`, `ExpireTenancyReservation`) chạy qua Laravel Scheduler/CLI khi triển khai server có crontab.
  - Trên môi trường local khi không chạy Supabase Storage daemon, route stream ảnh admin media trả `503` (ảnh công khai fallback về local storage hoặc URL cấu hình).
- **Checklist ngoài mã nguồn (Team tự hoàn tất trước khi nộp thầy):**
  - [ ] Đảm bảo đủ **5 Sprint Reports** có đóng góp của cả **4 thành viên**.
  - [ ] Gắn đủ **12 PR-to-issue links** trên GitHub / bảng theo dõi nhóm.
