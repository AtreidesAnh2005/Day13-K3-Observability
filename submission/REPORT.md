# Báo cáo Day 13 Observability

## 1. Thông tin nhóm

- Tên nhóm: Bia Hoi Hai Xom
- Repository URL: https://github.com/AtreidesAnh2005/Day13-K3-Observability
- Commit SHA cuối: 'completed lab'
- Thành viên và vai trò:
  - Lương Quốc Khánh — `2A202601713`: Thành viên 1, phụ trách Logging & PII.
  - Hoàng Đức Anh — `2A202601223`: Thành viên 2, phụ trách Tracing & Prompts.
  - Nguyễn Thu Huyền — `2A202601027`: Thành viên 3, phụ trách Dashboard & Alert.
  - Trần Nguyễn Mỹ Anh — `2A202601019`: Thành viên 4, phụ trách QA, Testing & Report.

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

- Challenge ID: `day13-k3-observability-v1` (cohort `K3`, affected feature `refund`).
- Triệu chứng từ metrics: So với baseline, latency p50 tăng từ `152 ms` lên `2,662 ms` (+2,510 ms) và p95 tăng từ `979 ms` lên `3,541 ms` (+2,562 ms), vượt SLO p95 `<= 3,000 ms`. Trong khi đó error rate vẫn `0.0%` và avg cost/request giảm nhẹ từ `$0.0021` xuống `$0.0019`; đây là incident về latency, không phải tool failure hoặc cost spike.
- Trace ID liên quan: [`5cb91e1f182ebd41e81d7f0cad9f1ae1`](https://cloud.langfuse.com/project/cmso2kzp603fxad0j8cldfasd/traces?peek=68486d77f660279c&observation=68486d77f660279c&traceId=5cb91e1f182ebd41e81d7f0cad9f1ae1&timestamp=2026-08-11T05%3A43%3A26.951Z). Trace này có correlation ID `req-608d0991`, prompt `day13-chat` v1 / label `production`, `prompt_source: langfuse`, `doc_count: 1`, query preview `Summarize the refund policy for a support agent.`
- Log line/correlation ID liên quan: `correlation_id=req-608d0991`. Log `request_received` lúc `2026-08-11T05:43:26.951018Z` và `response_sent` lúc `2026-08-11T05:43:29.614150Z` ghi `latency_ms=2661`, `feature=refund`, HTTP `200`. Log control ngay trước batch cũng xác nhận `incident_enabled` với `name=rag_slow`.
- Root cause: Incident `rag_slow` đã được bật. Bước RAG retrieval thêm `time.sleep(2.5)`, khiến latency mỗi request tăng xấp xỉ 2.5 giây. Trace của `req-608d0991` liên kết đúng request bằng correlation ID và cho thấy truy vấn dùng một tài liệu (`doc_count=1`); metrics loại trừ giả thuyết lỗi tool (không có 500/error) và cost spike (cost/token không tăng 4x).
- Fix action: Trong môi trường lab, tắt incident bằng `.venv/bin/python scripts/inject_incident.py --scenario rag_slow --disable`. Trong production, khôi phục/vector-store retrieval về độ trễ bình thường, đặt timeout phù hợp và dùng cache hoặc fallback retrieval khi upstream chậm.
- Preventive measure: Duy trì alert `latency_p95_ms > 3000 ms` trong 5 phút; khi alert kích hoạt, điều tra theo Metrics -> Trace waterfall (ưu tiên span `retrieve`) -> Logs bằng correlation ID. Theo dõi latency riêng cho retrieval, đặt timeout/circuit breaker và đo lại baseline sau mỗi thay đổi.

## 7. Đóng góp cá nhân

Với mỗi thành viên, ghi rõ nhiệm vụ và link commit/PR tương ứng.

| Thành viên | Phần việc | Commit/PR | Điều đã học |
|---|---|---|---|
| Lương Quốc Khánh — 2A202601713 | Logging & PII: correlation ID, enrichment log và che email/số điện thoại/thông tin nhạy cảm. | Bổ sung sau khi commit/push | Structured logging, correlation ID và PII redaction. |
| Hoàng Đức Anh — 2A202601223 | Tracing & Prompts: tích hợp Langfuse, tạo prompt v1/v2, cấu hình label và rollback. | Bổ sung sau khi commit/push | Liên kết trace với metadata và quản lý prompt version. |
| Nguyễn Thu Huyền — 2A202601027 | Dashboard & Alert: dựng 6 panel từ `data/logs.jsonl`, thiết lập SLO, alert rules và runbook. | Bổ sung sau khi commit/push | Đo latency/cost/error/quality, thiết kế SLO và alert symptom-based. |
| Trần Nguyễn Mỹ Anh — 2A202601019 | QA, Testing & Report: chạy load test, điều tra challenge theo Metrics → Traces → Logs, tổng hợp evidence và hoàn thiện báo cáo. | Bổ sung sau khi commit/push | Điều tra incident bằng correlation ID và kết nối bằng chứng metrics, trace, log. |
