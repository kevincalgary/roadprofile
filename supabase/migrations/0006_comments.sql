-- RoadProfile: comments on records, and replies to comments.

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records(id) on delete cascade,
  author_id uuid not null references public.profiles(user_id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.comments enable row level security;

create index comments_record_idx on public.comments (record_id, created_at);

create trigger comments_touch_updated_at before update on public.comments
  for each row execute function public.touch_updated_at();

create policy comments_select_public on public.comments
  for select using (deleted_at is null or author_id = auth.uid() or public.current_user_is_moderator());

create policy comments_insert_authenticated on public.comments
  for insert with check (
    auth.uid() = author_id
    and public.is_active_standing(auth.uid())
    and not exists (
      select 1 from public.records r
      join public.blocks b on (b.blocker_id = r.author_id and b.blocked_id = auth.uid())
        or (b.blocker_id = auth.uid() and b.blocked_id = r.author_id)
      where r.id = record_id
    )
  );

create policy comments_update_own on public.comments
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy comments_delete_own_or_mod on public.comments
  for delete using (auth.uid() = author_id or public.current_user_is_moderator());

-- ---------------------------------------------------------------------------
create table public.replies (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  author_id uuid not null references public.profiles(user_id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.replies enable row level security;

create index replies_comment_idx on public.replies (comment_id, created_at);

create trigger replies_touch_updated_at before update on public.replies
  for each row execute function public.touch_updated_at();

create policy replies_select_public on public.replies
  for select using (deleted_at is null or author_id = auth.uid() or public.current_user_is_moderator());

create policy replies_insert_authenticated on public.replies
  for insert with check (auth.uid() = author_id and public.is_active_standing(auth.uid()));

create policy replies_update_own on public.replies
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy replies_delete_own_or_mod on public.replies
  for delete using (auth.uid() = author_id or public.current_user_is_moderator());
