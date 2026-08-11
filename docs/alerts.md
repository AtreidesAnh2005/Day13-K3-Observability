# Template Alert và Runbook

Mỗi alert phải dựa trên triệu chứng người dùng hoặc SLO, không dựa trực tiếp vào tên implementation nội bộ.

## Alert 1

- Tên: HighLatencyP95
- Severity: Critical
- SLI/SLO liên quan: `latency_p95_ms <= 3000ms` (Target 99.5%)
- Điều kiện và thời gian duy trì: `latency_p95_ms > 3000ms` kéo dài liên tục trên 5 phút.
- Ảnh hưởng tới người dùng: Người dùng phải chờ đợi quá lâu để nhận câu trả lời từ AI agent, gây trải nghiệm kém và timeout ứng dụng phía client.
- Ba bước kiểm tra đầu tiên:
  1. Mở Panel **Latency Percentiles** trên Dashboard để xác định chính xác thời điểm P95 bị tăng đột biến.
  2. Mở Langfuse trace waterfall của các request có latency cao để tìm ra span chiếm thời gian dài nhất (ví dụ: `mock_rag` retrieval hay `mock_llm` generation).
  3. Tra cứu log JSON có cùng `correlation_id` của request chậm để kiểm tra xem có sự cố tắc nghẽn hạ tầng hoặc incident `rag_slow` đang bật không.
- Mitigation tạm thời:
  1. Tắt kịch bản thử nghiệm / incident đang bật nếu trong môi trường test: `python scripts/inject_incident.py --scenario rag_slow --disable`.
  2. Tạm thời chuyển sang sử dụng mô hình AI có độ trễ thấp hơn (như fast/light model) hoặc bật chế độ cache câu trả lời RAG.
- Owner: Dashboard, SLO & Alert Team

## Alert 2

- Tên: HighErrorRate
- Severity: Critical
- SLI/SLO liên quan: `error_rate_pct <= 2%` (Target 99.0%)
- Điều kiện và thời gian duy trì: `error_rate_pct > 2%` kéo dài liên tục trên 3 phút.
- Ảnh hưởng tới người dùng: Yêu cầu của người dùng bị từ chối hoặc nhận phản hồi lỗi (HTTP 500 / 503), ứng dụng không hoàn thành được tác vụ.
- Ba bước kiểm tra đầu tiên:
  1. Kiểm tra Panel **Error Rate & Breakdown** trên Dashboard để phân loại loại lỗi chính (`error_type` như `rag_failure`, `llm_timeout`, `validation_error`).
  2. Lọc log JSON có `event == "request_failed"` để trích xuất `error_type`, exception traceback và `correlation_id` tương ứng.
  3. Kiểm tra tính khả dụng của mạng, API Key, hoặc rate-limit quota từ phía nhà cung cấp mô hình LLM.
- Mitigation tạm thời:
  1. Khởi động lại service API hoặc chuyển giao tiếp sang dịch vụ AI dự phòng (Fallback LLM provider).
  2. Áp dụng Circuit Breaker để trả về thông báo lỗi thân thiện ngay lập tức thay vì để request bị hỏng âm thầm.
- Owner: Dashboard, SLO & Alert Team

## Alert 3

- Tên: LowQualityScore
- Severity: Warning
- SLI/SLO liên quan: `quality_score_avg >= 0.75` (Target 95.0%)
- Điều kiện và thời gian duy trì: `quality_score_avg < 0.75` kéo dài trên 10 phút.
- Ảnh hưởng tới người dùng: Chất lượng câu trả lời của AI bị suy giảm, thông tin trả về thiếu chính xác hoặc không đúng với ngữ cảnh mong đợi.
- Ba bước kiểm tra đầu tiên:
  1. Xem Panel **Quality Proxy** trên Dashboard để xác định xu hướng giảm điểm chất lượng.
  2. Mở Langfuse kiểm tra `prompt_version` và `prompt_label` đang hoạt động (ví dụ: v1 hay candidate v2) để phát hiện prompt mới có gây sụt giảm chất lượng không.
  3. Đọc dữ liệu context retrieve từ RAG pipeline cho các câu hỏi bị chấm điểm chất lượng thấp.
- Mitigation tạm thời:
  1. Thực hiện Rollback phiên bản prompt về phiên bản ổn định trước đó (ví dụ: chuyển label `production` về phiên bản v1).
  2. Tăng số lượng tài liệu tham khảo (top-k) hoặc tinh chỉnh lại khoảng điểm tương đồng trong RAG pipeline.
- Owner: Dashboard, SLO & Alert Team

