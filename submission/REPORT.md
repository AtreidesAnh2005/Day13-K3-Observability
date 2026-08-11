# Báo cáo Day 13 Observability

## 1. Thông tin nhóm

- Tên nhóm:
- Repository URL:
- Commit SHA cuối:
- Thành viên và vai trò:

## 2. Kết quả kỹ thuật

- Điểm `validate_logs.py` (baseline, Checkpoint 0, 2026-08-11): 30/100 — 21 log records, 20 thiếu required fields, 20 thiếu enrichment, 0 correlation ID, 0 PII leak phát hiện (PII scrubbing PASSED do chưa có dữ liệu PII trong baseline).
- Tổng số traces: 216 traces trên Langfuse (project `My Project`, org `nthne's Organization`), vượt yêu cầu tối thiểu 10. Evidence: `submission/evidence/cp2-trace.png`, `submission/evidence/cp2-trace2.png`.
- Số PII leak còn lại: 0 — email, số điện thoại, số thẻ đều được che (`[REDACTED_EMAIL]`, `[REDACTED_PHONE_VN]`, `[REDACTED_CREDIT_CARD]`). Evidence: `submission/evidence/cp1-pii-redaction.png`.
- Link/đường dẫn dashboard:

## 3. Logging và tracing

- Evidence correlation ID: `submission/evidence/cp1-correlation-propagation.png` — correlation_id `req-role1-demo` xuất hiện xuyên suốt cả `request_received` và `response_sent` của cùng một request.
- Evidence PII redaction: `submission/evidence/cp1-pii-redaction.png`.
- Evidence trace waterfall: `submission/evidence/cp2-trace_waterfall.png`.
- Giải thích một span đáng chú ý: Span gốc `run` (bọc `LabAgent.run`) của trace candidate (session `s_prompt_candidate_v1`, trace ID `9a37d6eaeb1567fa1a85818131e72e14`) — latency 2.10s, cost $0.002307, model `claude-sonnet-4-5`, gắn `Prompt: day13-chat - v2`. Span này bao trọn bước retrieve docs + gọi LLM, cho thấy toàn bộ chi phí và độ trễ của một request nằm ở generation con bên trong.

## 4. Prompt versioning

- Prompt name: `day13-chat` (text prompt, 3 biến `feature`/`docs`/`message`).
- Version/label baseline: version 1, label `baseline` (đồng thời `production` lúc khởi tạo).
- Version/label candidate: version 2, label `candidate`.
- Trace ID của mỗi version:
  - `baseline` (v1): `53170034f93e4c03ac1e807dc503239a` — https://cloud.langfuse.com/project/cmso2kzp603fxad0j8cldfasd/traces/53170034f93e4c03ac1e807dc503239a
  - `candidate` (v2): `9a37d6eaeb1567fa1a85818131e72e14` — https://cloud.langfuse.com/project/cmso2kzp603fxad0j8cldfasd/traces/9a37d6eaeb1567fa1a85818131e72e14
  - Cả hai đều có `prompt_source: langfuse` (lấy được prompt managed, không rơi vào fallback local).
- Bằng chứng đổi label hoặc rollback: **chưa thực hiện** — để dành cho Phase 3 (đổi `production` sang v2 rồi rollback về v1, kèm ảnh trước/sau).

## 5. Dashboard, SLO và alerts

- Kết quả `validate_dashboard.py`: `HỢP LỆ: 6/6 panel có trong dashboard contract.`
- Evidence dashboard: Tệp bằng chứng thực nghiệm `submission/evidence/dashboard_runtime_evidence.txt` và giao diện tương tác `scripts/dashboard_app.py` (Streamlit).
- SLO đã chọn và lý do:
  * `latency_p95_ms <= 3000ms` (Target 99.5%): Giữ phản hồi RAG/LLM nhanh chóng dưới 3 giây cho trải nghiệm người dùng tối ưu.
  * `error_rate_pct <= 2%` (Target 99.0%): Hạn chế tỷ lệ lỗi request dưới 2% để đạt tiêu chuẩn độ tin cậy SLA.
  * `daily_cost_usd <= $2.5` (Target 100.0%): Kiểm soát ngân sách API token gọi mô hình LLM hàng ngày.
  * `quality_score_avg >= 0.75` (Target 95.0%): Đảm bảo điểm số chất lượng câu trả lời AI vượt mốc 0.75/1.0.
- Alert rules và runbook: Đã thiết lập 3 quy tắc cảnh báo symptom-based tại `config/alert_rules.yaml`, chỉ số mục tiêu tại `config/slo.yaml` và hoàn thiện 3 quy trình xử lý sự cố chi tiết tại `docs/alerts.md`.

## 6. Điều tra challenge

- Challenge ID:
- Triệu chứng từ metrics:
- Trace ID liên quan:
- Log line/correlation ID liên quan:
- Root cause:
- Fix action:
- Preventive measure:

## 7. Đóng góp cá nhân

Với mỗi thành viên, ghi rõ nhiệm vụ và link commit/PR tương ứng.

| Thành viên | Phần việc | Commit/PR | Điều đã học |
|---|---|---|---|
| Thành viên nhóm | Dashboard, SLO & Alert | Dựng dashboard 6 panel contract (`config/dashboard.yaml`), thiết lập `config/slo.yaml`, `config/alert_rules.yaml` và viết 3 runbook (`docs/alerts.md`) | Hiểu rõ 6 panel chỉ số observability AI, đo lường percentiles (P50/P95/P99), thiết kế symptom-based alert và quy trình điều tra runtime khi có sự cố |

