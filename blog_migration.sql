-- Chạy một lần trong database ttcn. Không tạo lại blogs/blog_images/blog_likes.

ALTER TABLE blogs
  ADD COLUMN category_id BIGINT NULL AFTER place_id,
  ADD COLUMN excerpt VARCHAR(500) NULL AFTER title,
  ADD COLUMN view_count INT NOT NULL DEFAULT 0 AFTER like_count,
  ADD COLUMN published_at DATETIME NULL AFTER updated_at,
  ADD KEY idx_blog_status_created (status, created_at),
  ADD KEY idx_blog_category (category_id),
  ADD CONSTRAINT fk_blog_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS blog_comments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  blog_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  parent_id BIGINT NULL,
  content TEXT NOT NULL,
  status ENUM('visible','hidden') NOT NULL DEFAULT 'visible',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comment_blog (blog_id, created_at),
  KEY idx_comment_user (user_id),
  KEY idx_comment_parent (parent_id),
  CONSTRAINT fk_comment_blog FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES blog_comments(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
