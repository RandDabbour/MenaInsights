CREATE TABLE IF NOT EXISTS request_attachments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  request_id CHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(1024) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  kind ENUM('delivered_report', 'insight_attachment') NOT NULL DEFAULT 'delivered_report',
  uploaded_by_user_id CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_request_attachments_request
    FOREIGN KEY (request_id) REFERENCES service_requests(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_request_attachments_uploaded_by
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  KEY idx_request_attachments_request_created (request_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
