CREATE TABLE IF NOT EXISTS payment_events (
  id CHAR(36) NOT NULL PRIMARY KEY,
  payment_id CHAR(36) NOT NULL,
  request_id CHAR(36) NOT NULL,
  status ENUM('pending', 'approved', 'captured', 'failed', 'refunded') NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  event_note VARCHAR(255) NULL,
  provider_event_id VARCHAR(128) NULL,
  provider_payload JSON NULL,
  amount DECIMAL(12,2) NULL,
  currency CHAR(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_payment_events_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_payment_events_request
    FOREIGN KEY (request_id) REFERENCES service_requests(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  KEY idx_payment_events_request_created (request_id, created_at),
  KEY idx_payment_events_payment_created (payment_id, created_at),
  KEY idx_payment_events_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
