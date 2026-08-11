# Báo cáo Day 13 Observability

## 1. Thông tin nhóm

- Tên nhóm:
- Repository URL:
- Commit SHA cuối:
- Thành viên và vai trò:

## 2. Kết quả kỹ thuật

- Điểm `validate_logs.py` (baseline, Checkpoint 0, 2026-08-11): 30/100 — 21 log records, 20 thiếu required fields, 20 thiếu enrichment, 0 correlation ID, 0 PII leak phát hiện (PII scrubbing PASSED do chưa có dữ liệu PII trong baseline).
- Tổng số traces:
- Số PII leak còn lại:
- Link/đường dẫn dashboard:

## 3. Logging và tracing

- Evidence correlation ID:
- Evidence PII redaction:
- Evidence trace waterfall:
- Giải thích một span đáng chú ý:

## 4. Prompt versioning

- Prompt name:
- Version/label baseline:
- Version/label candidate:
- Trace ID của mỗi version:
- Bằng chứng đổi label hoặc rollback:

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

