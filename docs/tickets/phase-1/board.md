# Board — Phase 1

Phân cấp: **Epic → User Story → Ticket** (`conventions.md`). Mỗi user story là một tệp `us-*.md` chứa ticket inline, và là một pull request; mỗi ticket là một commit. Mỗi user story link về US nghiệp vụ của BA ở field "Business US (BA)".

Chẻ theo Phương án A (lát mỏng theo module): 5 epic → 17 user story → 27 ticket, phủ US-01→US-20 (BA).

---

## Epic và user story thuộc nó

### EPIC-1 — Nền tảng lõi
Hạ tầng không chạm thiết bị mà mọi thứ khác dựng lên: khung dự án, ranh giới module, lỗi/log dùng chung, cấu hình, khai báo ứng dụng, lưu trữ kết quả.

| User story | Tên | Ticket | Business US (BA) |
|---|---|---|---|
| US-1.1 | Khung dự án + shared kernel | 001, 002 | US-02 |
| US-1.2 | Cấu hình & bí mật | 003, 004 | US-19 |
| US-1.3 | App Registry | 005 | US-01, US-02 |
| US-1.4 | Result Store | 006, 007 | US-15, US-11, US-02 |

### EPIC-2 — Tương tác phần tử & bằng chứng
Điểm duy nhất tìm phần tử, và việc dựng bằng chứng thực thi của mỗi test case.

| User story | Tên | Ticket | Business US (BA) |
|---|---|---|---|
| US-2.1 | Locator Resolver | 011, 012 | US-03, US-04 |
| US-2.2 | Khối bằng chứng | 013, 014, 015 | US-13, US-14, US-18 |
| US-2.3 | Điều phối bằng chứng | 016 | US-13, US-14, US-15 |

### EPIC-3 — Thiết bị & vòng đời lượt chạy
Chuẩn bị thiết bị, kiểm tra sống của thiết bị, gắn bộ khung test và điều phối một lượt chạy.

| User story | Tên | Ticket | Business US (BA) |
|---|---|---|---|
| US-3.1 | Sẵn sàng thiết bị & cài build | 008, 009 | US-08 |
| US-3.2 | Probe thiết bị giữa lượt chạy | 010 | US-20 |
| US-3.3 | Bộ khung WDIO/Cucumber | 017 | US-05, US-06, US-03 |
| US-3.4 | Điều phối lượt chạy | 018, 019 | US-09, US-11, US-12, US-13, US-20 |

### EPIC-4 — Báo cáo & CLI
Sinh báo cáo một lượt chạy và các lệnh QC dùng: `doctor`, `run`, `report`, hiển thị tiến trình.

| User story | Tên | Ticket | Business US (BA) |
|---|---|---|---|
| US-4.1 | Sinh báo cáo | 024, 025 | US-16, US-17, US-18 |
| US-4.2 | Nền CLI + `doctor` | 020 | US-08 |
| US-4.3 | CLI `run` + tiến trình | 021, 022 | US-09, US-10, US-12 |
| US-4.4 | CLI `report` | 023 | US-16 |

### EPIC-5 — Nội dung thí điểm & quy trình giao hàng
Nội dung ứng dụng thí điểm để nghiệm thu đầu-cuối, và quy trình rà soát pull request.

| User story | Tên | Ticket | Business US (BA) |
|---|---|---|---|
| US-5.1 | Quy trình rà soát pull request | 027 | US-07 |
| US-5.2 | Ứng dụng thí điểm đầu-cuối | 026 | US-03, US-04, US-05, US-06 |

---

## Thứ tự thực thi và phụ thuộc (cấp user story = cấp PR)

| User story | Phụ thuộc | Song song với | Trạng thái |
|---|---|---|---|
| US-1.1 | — | — | Todo |
| US-5.1 | US-1.1 | hầu hết | Todo |
| US-1.2 | US-1.1 | US-1.3, US-1.4, US-2.1, US-2.2, US-3.3 | Todo |
| US-1.3 | US-1.1 | US-1.2, US-1.4, US-2.1, US-2.2, US-3.3 | Todo |
| US-1.4 | US-1.1 | US-1.2, US-1.3, US-2.1, US-2.2, US-3.3 | Todo |
| US-2.1 | US-1.1 | US-1.2, US-1.3, US-1.4, US-2.2, US-3.3 | Todo |
| US-2.2 | US-1.1 | US-1.2, US-1.3, US-1.4, US-2.1, US-3.3 | Todo |
| US-3.3 | US-1.1 | US-1.2, US-1.3, US-1.4, US-2.1, US-2.2 | Todo |
| US-2.3 | US-1.4, US-2.2 | US-3.1 | Todo |
| US-3.1 | US-1.1, US-1.3 | US-2.3, US-4.1 | Todo |
| US-3.2 | US-2.1, US-3.1 | — | Todo |
| US-4.1 | US-1.4 | US-3.1, US-4.2 | Todo |
| US-4.2 | US-1.1, US-3.1 | US-4.1 | Todo |
| US-3.4 | US-1.4, US-2.3, US-3.1, US-3.2, US-3.3 | — | Todo |
| US-4.3 | US-1.2, US-1.3, US-3.1, US-3.4, US-4.1, US-4.2 | — | Todo |
| US-4.4 | US-4.1, US-4.2 | — | Todo |
| US-5.2 | US-1.3, US-2.1, US-3.3 (chạy được cần US-4.3) | — | Todo |

**Trình tự merge đề xuất:**
1. US-1.1 (nền móng) → US-5.1 (quy trình PR, sớm).
2. Song song: US-1.2, US-1.3, US-1.4, US-2.1, US-2.2, US-3.3 — mỗi story một dev, một PR.
3. US-2.3 (cần US-1.4, US-2.2) và US-3.1 (cần US-1.3).
4. US-3.2 (cần US-2.1, US-3.1).
5. US-4.1 (cần US-1.4) và US-4.2 (cần US-3.1) — song song.
6. US-3.4 — điểm hội tụ tích hợp.
7. US-4.3 (`run`) và US-4.4 (`report`).
8. US-5.2 — thí điểm, nghiệm thu đầu-cuối.

## Phụ thuộc cấp ticket (trong và giữa user story)

| Ticket | User story | Phụ thuộc ticket |
|---|---|---|
| 001 | US-1.1 | — |
| 002 | US-1.1 | 001 |
| 003 | US-1.2 | 002 |
| 004 | US-1.2 | 003 |
| 005 | US-1.3 | 002 |
| 006 | US-1.4 | 002 |
| 007 | US-1.4 | 006 |
| 011 | US-2.1 | 002 |
| 012 | US-2.1 | 011 |
| 013 | US-2.2 | 002 |
| 014 | US-2.2 | 002 |
| 015 | US-2.2 | 002 |
| 016 | US-2.3 | 007, 013, 014, 015 |
| 008 | US-3.1 | 002 |
| 009 | US-3.1 | 005, 008 |
| 010 | US-3.2 | 009, 011 |
| 017 | US-3.3 | 001, 002 |
| 018 | US-3.4 | 016, 017 |
| 019 | US-3.4 | 007, 009, 010, 018 |
| 024 | US-4.1 | 007 |
| 025 | US-4.1 | 024 |
| 020 | US-4.2 | 001, 008 |
| 021 | US-4.3 | 004, 005, 009, 019, 025 |
| 022 | US-4.3 | 019, 020 |
| 023 | US-4.4 | 020, 025 |
| 027 | US-5.1 | 001 |
| 026 | US-5.2 | 005, 012, 017 |

## Ghi chú

- Không có phụ thuộc vòng ở cả cấp user story lẫn cấp ticket; phụ thuộc đi xuôi theo cột "Phụ thuộc" của `north-star.md` §2.
- US-4.3 phụ thuộc US-4.1 vì cuối một lượt chạy `run` tự sinh báo cáo (UC-06 bước 7, sequence-diagram §3). Muốn ship `run` trước Reporter thì tách phần tự sinh báo cáo thành bước tùy chọn và bỏ phụ thuộc này — một đánh đổi, hỏi product owner trước khi làm.
- US-5.2 (thí điểm) khai báo phụ thuộc kỹ thuật US-1.3/2.1/3.3 để viết được nội dung; để **chạy** đầu-cuối cần luồng `run` ở US-4.3 nên xếp cuối.

## Điểm đã đẩy về SA/BA

Không có. Toàn bộ epic/user story/ticket cụ thể hóa được trong khuôn khổ thiết kế Phase 1 hiện có, không có quyết định chạm khuôn khổ.
