-- WhoGoHost (MySQL / MariaDB). Import this in DirectAdmin → phpMyAdmin
-- if you prefer to create the tables yourself. The app also creates them
-- on first use when DATABASE_URL starts with mysql://

CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_type VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  resend_id VARCHAR(255) NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_replies_submission
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'NGN',
  status VARCHAR(50) DEFAULT 'success',
  paid_at DATETIME NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_donations_reference (reference)
);
