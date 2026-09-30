-- =====================================================================
-- TRANG BÁO GIÁ MỚI (quote2) - chạy 1 lần trong Supabase > SQL Editor
-- Các bảng MỚI hoàn toàn, KHÔNG đụng tới bảng cũ: oders, order_items.
-- Bảng cũ `admin` chỉ được THÊM cột (không mất dữ liệu).
-- Chạy lại nhiều lần vẫn an toàn (if not exists).
-- =====================================================================

create extension if not exists pgcrypto;

-- 1) Báo giá ---------------------------------------------------------
create table if not exists quote2_quotes (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,              -- BG260926-UYR5
  customer_name     text not null default '',
  customer_phone    text not null default '',
  discount_percent  numeric not null default 0,        -- chiết khấu toàn đơn (%)
  tax_rate          numeric not null default 8,        -- VAT (%), 0 = không VAT
  min_margin        numeric not null default 40,       -- biên tối thiểu sau CK (%)
  status            text not null default 'pending'
                    check (status in ('pending','won','lost')),
  lost_reason       text not null default '',
  note              text not null default '',          -- ghi chú hiện trên bản gửi khách
  preview_overrides jsonb not null default '{}'::jsonb,-- {company?:{...}, terms?:{...}} chỉ áp cho báo giá này
  -- owner_id để dạng text để không phụ thuộc kiểu cột admin.id (int/uuid)
  owner_id          text not null default '',
  owner_name        text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists quote2_quotes_owner_idx   on quote2_quotes (owner_id);
create index if not exists quote2_quotes_created_idx on quote2_quotes (created_at desc);

-- 2) Dòng sản phẩm ---------------------------------------------------
create table if not exists quote2_items (
  id          uuid primary key default gen_random_uuid(),
  quote_id    uuid not null references quote2_quotes(id) on delete cascade,
  position    int  not null default 0,
  name        text not null default '',
  size        text not null default '',
  quantity    numeric not null default 1,
  unit_cost   numeric not null default 0,   -- giá vốn 1sp (chỉ admin thấy)
  unit_price  numeric not null default 0,   -- đơn giá 1sp
  created_at  timestamptz not null default now()
);
create index if not exists quote2_items_quote_idx on quote2_items (quote_id, position);

-- 3) Cài đặt dùng chung (thông tin công ty, điều khoản mặc định) -----
create table if not exists quote2_settings (
  key         text primary key,             -- 'company' | 'terms'
  value       jsonb not null,
  updated_by  text not null default '',
  updated_at  timestamptz not null default now()
);

-- 4) Yêu cầu cấp lại mật khẩu ----------------------------------------
create table if not exists quote2_password_requests (
  id          uuid primary key default gen_random_uuid(),
  username    text not null,
  status      text not null default 'open' check (status in ('open','done')),
  created_at  timestamptz not null default now()
);

-- 5) Thêm cột cho bảng admin cũ (mật khẩu tạm 72h, khoá tài khoản) ---
alter table admin add column if not exists must_change_password    boolean     not null default false;
alter table admin add column if not exists temp_password_expires_at timestamptz;
alter table admin add column if not exists is_active               boolean     not null default true;

-- 6) Quyền truy cập ---------------------------------------------------
-- Web đang dùng anon key + đăng nhập tự viết (bảng admin), nên Postgres không
-- phân biệt được từng người dùng. Policy dưới đây cho phép anon đọc/ghi giống
-- các bảng hiện tại của bạn. Phân quyền thật đang nằm ở code (permissions.js).
-- Muốn khoá chặt ở tầng DB cần chuyển sang Supabase Auth (xem README_QUOTE2.md).
alter table quote2_quotes            enable row level security;
alter table quote2_items             enable row level security;
alter table quote2_settings          enable row level security;
alter table quote2_password_requests enable row level security;

do $$
declare t text;
begin
  foreach t in array array['quote2_quotes','quote2_items','quote2_settings','quote2_password_requests']
  loop
    execute format('drop policy if exists %I on %I', t || '_anon_all', t);
    execute format('create policy %I on %I for all to anon, authenticated using (true) with check (true)', t || '_anon_all', t);
  end loop;
end $$;
