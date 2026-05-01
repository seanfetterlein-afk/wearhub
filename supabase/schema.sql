-- ============================================================
-- WEARHUB — SUPABASE SCHEMA
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query)
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
-- One row per auth.users entry, created via trigger on signup.

create table if not exists public.profiles (
  id              uuid        primary key references auth.users(id) on delete cascade,
  username        text        unique not null,
  display_name    text,
  bio             text,
  location        text,
  avatar_url      text,
  is_verified     boolean     not null default false,
  response_rate   integer     not null default 100 check (response_rate between 0 and 100),
  created_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Products ─────────────────────────────────────────────────────────────────

create table if not exists public.products (
  id                    uuid        primary key default gen_random_uuid(),
  seller_id             uuid        not null references public.profiles(id) on delete cascade,
  title                 text        not null,
  description           text,
  brand                 text        not null,
  category              text        not null,
  size                  text        not null,
  condition             text        not null check (condition in ('NY', 'SOM NY', 'GOD', 'BRUGT')),
  price                 integer     not null check (price > 0),   -- DKK
  original_retail_price integer,
  is_drop               boolean     not null default false,
  is_verified           boolean     not null default false,
  status                text        not null default 'active'
                          check (status in ('draft', 'active', 'sold', 'removed')),
  views                 integer     not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Active products are publicly readable"
  on public.products for select using (status = 'active' or seller_id = auth.uid());

create policy "Sellers can insert their own products"
  on public.products for insert with check (auth.uid() = seller_id);

create policy "Sellers can update their own products"
  on public.products for update using (auth.uid() = seller_id);

create policy "Sellers can delete their own products"
  on public.products for delete using (auth.uid() = seller_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Increment view count (called from the item page)
create or replace function public.increment_product_views(product_id uuid)
returns void language sql security definer as $$
  update public.products set views = views + 1 where id = product_id;
$$;

-- ─── Product Images ───────────────────────────────────────────────────────────

create table if not exists public.product_images (
  id           uuid        primary key default gen_random_uuid(),
  product_id   uuid        not null references public.products(id) on delete cascade,
  storage_path text        not null,
  position     integer     not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.product_images enable row level security;

create policy "Product images are publicly readable"
  on public.product_images for select using (true);

create policy "Sellers can manage their product images"
  on public.product_images for all
  using (
    exists (
      select 1 from public.products
      where products.id = product_images.product_id
        and products.seller_id = auth.uid()
    )
  );

-- ─── Favorites ────────────────────────────────────────────────────────────────

create table if not exists public.favorites (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  product_id  uuid        not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.favorites enable row level security;

create policy "Users can read their own favorites"
  on public.favorites for select using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
  on public.favorites for insert with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on public.favorites for delete using (auth.uid() = user_id);

-- ─── Conversations ────────────────────────────────────────────────────────────

create table if not exists public.conversations (
  id          uuid        primary key default gen_random_uuid(),
  product_id  uuid        references public.products(id) on delete set null,
  buyer_id    uuid        not null references public.profiles(id) on delete cascade,
  seller_id   uuid        not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (product_id, buyer_id, seller_id)
);

alter table public.conversations enable row level security;

create policy "Participants can read their conversations"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Authenticated users can start conversations"
  on public.conversations for insert
  with check (auth.uid() = buyer_id);

create trigger set_conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- ─── Messages ─────────────────────────────────────────────────────────────────

create table if not exists public.messages (
  id               uuid        primary key default gen_random_uuid(),
  conversation_id  uuid        not null references public.conversations(id) on delete cascade,
  sender_id        uuid        not null references public.profiles(id) on delete cascade,
  text             text        not null,
  is_read          boolean     not null default false,
  created_at       timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "Participants can insert messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "Recipients can mark messages as read"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
        and messages.sender_id != auth.uid()
    )
  );

-- Bump conversation.updated_at when a new message arrives
create or replace function public.bump_conversation_updated_at()
returns trigger language plpgsql as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger bump_conversation_on_message
  after insert on public.messages
  for each row execute function public.bump_conversation_updated_at();

-- ─── Orders ───────────────────────────────────────────────────────────────────

create table if not exists public.orders (
  id                       uuid        primary key default gen_random_uuid(),
  product_id               uuid        not null references public.products(id),
  buyer_id                 uuid        not null references public.profiles(id),
  seller_id                uuid        not null references public.profiles(id),
  amount                   integer     not null,   -- DKK paid by buyer
  payout                   integer     not null,   -- DKK sent to seller (after 6% fee)
  stripe_payment_intent_id text,
  status                   text        not null default 'pending'
                             check (status in ('pending','paid','shipped','delivered','disputed','refunded')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Buyers and sellers can read their orders"
  on public.orders for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Mark product as sold when order is paid
create or replace function public.mark_product_sold()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'paid' and old.status != 'paid' then
    update public.products set status = 'sold' where id = new.product_id;
  end if;
  return new;
end;
$$;

create trigger mark_product_sold_on_order_paid
  after update on public.orders
  for each row execute function public.mark_product_sold();

-- ─── Reviews ──────────────────────────────────────────────────────────────────

create table if not exists public.reviews (
  id            uuid        primary key default gen_random_uuid(),
  order_id      uuid        references public.orders(id),
  author_id     uuid        not null references public.profiles(id) on delete cascade,
  subject_id    uuid        not null references public.profiles(id) on delete cascade,
  rating        integer     not null check (rating between 1 and 5),
  text          text,
  product_title text,
  created_at    timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "Reviews are publicly readable"
  on public.reviews for select using (true);

create policy "Verified buyers can leave reviews"
  on public.reviews for insert
  with check (auth.uid() = author_id);

-- ─── Storage bucket ───────────────────────────────────────────────────────────
-- Run manually in Supabase Storage dashboard, or via CLI:
-- supabase storage create product-images --public

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists idx_products_seller_id   on public.products(seller_id);
create index if not exists idx_products_status      on public.products(status);
create index if not exists idx_products_category    on public.products(category);
create index if not exists idx_products_brand       on public.products(brand);
create index if not exists idx_products_created_at  on public.products(created_at desc);
create index if not exists idx_favorites_user_id    on public.favorites(user_id);
create index if not exists idx_messages_conv_id     on public.messages(conversation_id, created_at);
create index if not exists idx_conversations_buyer  on public.conversations(buyer_id);
create index if not exists idx_conversations_seller on public.conversations(seller_id);
create index if not exists idx_reviews_subject_id   on public.reviews(subject_id);

-- ─── Offers ───────────────────────────────────────────────────────────────────
-- Run this migration block in Supabase SQL editor

create table if not exists public.offers (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  buyer_id        uuid        not null references public.profiles(id) on delete cascade,
  seller_id       uuid        not null references public.profiles(id) on delete cascade,
  amount          integer     not null check (amount > 0),
  status          text        not null default 'pending'
                    check (status in ('pending', 'accepted', 'rejected')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.offers enable row level security;

create policy "Participants can read offers"
  on public.offers for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Buyers can create offers"
  on public.offers for insert
  with check (auth.uid() = buyer_id);

create policy "Sellers can update offer status"
  on public.offers for update
  using (auth.uid() = seller_id);

create trigger set_offers_updated_at
  before update on public.offers
  for each row execute function public.set_updated_at();

-- Extend messages with type + offer reference
alter table public.messages
  add column if not exists message_type text not null default 'text'
    check (message_type in ('text', 'offer')),
  add column if not exists offer_id uuid references public.offers(id) on delete set null;

create index if not exists idx_offers_conversation_id on public.offers(conversation_id);
create index if not exists idx_messages_offer_id      on public.messages(offer_id);

-- ─── Notifications ────────────────────────────────────────────────────────────

create table if not exists public.notifications (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  type            text        not null check (type in (
                    'message', 'offer_received', 'offer_accepted', 'offer_rejected',
                    'listing_favorited', 'favorite_price_drop', 'system'
                  )),
  title           text        not null,
  body            text        not null,
  listing_id      uuid        references public.products(id) on delete set null,
  related_user_id uuid        references public.profiles(id) on delete set null,
  conversation_id uuid        references public.conversations(id) on delete set null,
  is_read         boolean     not null default false,
  created_at      timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can mark own notifications as read"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Security-definer function so server actions can create notifications
-- for any user (e.g. seller notified by buyer's action).
create or replace function public.create_notification(
  p_user_id         uuid,
  p_type            text,
  p_title           text,
  p_body            text,
  p_listing_id      uuid default null,
  p_related_user_id uuid default null,
  p_conversation_id uuid default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications
    (user_id, type, title, body, listing_id, related_user_id, conversation_id)
  values
    (p_user_id, p_type, p_title, p_body, p_listing_id, p_related_user_id, p_conversation_id);
end;
$$;

create index if not exists idx_notifications_user_id    on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_is_read    on public.notifications(user_id, is_read) where not is_read;

-- ─── Push Subscriptions ───────────────────────────────────────────────────────

create table if not exists public.push_subscriptions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  endpoint   text        not null,
  p256dh     text        not null,
  auth       text        not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage their own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
