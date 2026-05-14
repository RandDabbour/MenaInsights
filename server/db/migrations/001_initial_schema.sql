CREATE TABLE IF NOT EXISTS schema_migrations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(120) NOT NULL UNIQUE,
  executed_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(320) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'owner', 'staff', 'user') NOT NULL DEFAULT 'admin',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY ux_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_requests (
  id CHAR(36) NOT NULL PRIMARY KEY,
  access_token CHAR(40) NOT NULL,
  requester_name VARCHAR(120) NOT NULL,
  requester_email VARCHAR(320) NOT NULL,
  organization VARCHAR(200) NULL,
  service VARCHAR(160) NOT NULL,
  region VARCHAR(160) NOT NULL,
  topic VARCHAR(240) NOT NULL,
  urgency VARCHAR(120) NULL,
  description TEXT NOT NULL,
  budget VARCHAR(120) NULL,
  status ENUM(
    'submitted',
    'proposal_sent',
    'negotiation_requested',
    'proposal_updated',
    'accepted_pending_payment',
    'paid',
    'rejected'
  ) NOT NULL DEFAULT 'submitted',
  proposal_price DECIMAL(12,2) NULL,
  proposal_currency CHAR(3) NOT NULL DEFAULT 'USD',
  proposal_timeline VARCHAR(255) NULL,
  proposal_notes TEXT NULL,
  proposed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY ux_service_requests_access_token (access_token),
  KEY idx_service_requests_status_created (status, created_at),
  KEY idx_service_requests_email (requester_email),
  KEY idx_service_requests_topic (topic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS request_messages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  request_id CHAR(36) NOT NULL,
  author_role ENUM('owner', 'user') NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_request_messages_request
    FOREIGN KEY (request_id) REFERENCES service_requests(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  KEY idx_request_messages_request_created (request_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  request_id CHAR(36) NOT NULL,
  method ENUM('paypal') NOT NULL DEFAULT 'paypal',
  status ENUM('pending', 'approved', 'captured', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  amount DECIMAL(12,2) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  paypal_order_id VARCHAR(64) NULL,
  paypal_capture_id VARCHAR(64) NULL,
  raw_provider_response JSON NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY ux_payments_request_id (request_id),
  UNIQUE KEY ux_payments_paypal_order_id (paypal_order_id),
  UNIQUE KEY ux_payments_paypal_capture_id (paypal_capture_id),
  CONSTRAINT fk_payments_request
    FOREIGN KEY (request_id) REFERENCES service_requests(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  KEY idx_payments_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_content (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  content_key VARCHAR(191) NOT NULL,
  content_type ENUM('text', 'json', 'html') NOT NULL DEFAULT 'json',
  content_text LONGTEXT NULL,
  content_json JSON NULL,
  updated_by_user_id CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY ux_site_content_key (content_key),
  CONSTRAINT fk_site_content_updated_by
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_files (
  id CHAR(36) NOT NULL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  original_url VARCHAR(2048) NOT NULL,
  mime_type VARCHAR(120) NULL,
  size_bytes BIGINT UNSIGNED NULL,
  alt_text VARCHAR(500) NULL,
  created_by_user_id CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_media_files_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  KEY idx_media_files_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  actor_user_id CHAR(36) NULL,
  action VARCHAR(120) NOT NULL,
  entity_type ENUM('user', 'service_request', 'request_message', 'payment', 'site_content', 'media_file', 'auth', 'system') NOT NULL,
  entity_id VARCHAR(64) NULL,
  metadata_json JSON NULL,
  ip_address VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_audit_logs_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  KEY idx_audit_logs_created_at (created_at),
  KEY idx_audit_logs_entity (entity_type, entity_id),
  KEY idx_audit_logs_actor_action (actor_user_id, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  UNIQUE KEY ux_user_sessions_token_hash (token_hash),
  KEY idx_user_sessions_user_expires (user_id, expires_at),
  CONSTRAINT fk_user_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_outbox (
  id CHAR(36) NOT NULL PRIMARY KEY,
  recipient_email VARCHAR(320) NOT NULL,
  subject VARCHAR(320) NOT NULL,
  text_body LONGTEXT NULL,
  html_body LONGTEXT NULL,
  metadata_json JSON NULL,
  queued_at DATETIME(3) NOT NULL,
  sent_at DATETIME(3) NULL,
  status ENUM('queued', 'sent', 'failed') NOT NULL DEFAULT 'queued',
  error_message TEXT NULL,
  KEY idx_email_outbox_status_queued (status, queued_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
