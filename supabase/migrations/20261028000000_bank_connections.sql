-- Bank connections (Bancolombia via Croma) and their audit trail.
--
-- Both tables are written ONLY by the serverless API, using the service-role
-- key (which bypasses RLS). The browser never writes here; it can only read
-- its own rows, and in practice reads them through the API anyway.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- bank_connections: which Croma connection belongs to which user.
-- Holds no credentials — Croma keeps those; we keep only the reference.
-- ---------------------------------------------------------------------------
create table public.bank_connections (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  provider            text not null default 'bancolombia',
  croma_connection_id text not null unique,
  display_name        text,
  status              text not null default 'active'
                      check (status in ('active', 'exhausted', 'invalid')),
  created_at          timestamptz not null default now(),
  status_checked_at   timestamptz not null default now()
);

create index bank_connections_user_idx on public.bank_connections (user_id);

alter table public.bank_connections enable row level security;

create policy "own connections are readable"
  on public.bank_connections for select
  to authenticated
  using (user_id = auth.uid());

-- No insert/update/delete policies on purpose: only the API (service role) writes.

-- ---------------------------------------------------------------------------
-- audit_events: append-only trail of consent, connection lifecycle and bank
-- data reads. Never stores credentials, full account numbers or movement
-- contents — see docs/BANK_CONNECTION_DESIGN.md §5.
--
-- `user_id` is deliberately NOT a foreign key: the trail must survive the
-- deletion of the account it describes (retention policy still to be defined
-- with legal counsel).
-- ---------------------------------------------------------------------------
create table public.audit_events (
  id              uuid primary key default gen_random_uuid(),
  ts              timestamptz not null default now(),
  user_id         uuid not null,
  actor           text not null default 'user' check (actor in ('user', 'system')),
  event_type      text not null,
  connection_id   uuid,
  outcome         text not null check (outcome in ('success', 'failure')),
  error_code      text,
  consent_version text,
  consent_hash    text,
  request_id      text,
  ip_hash         text,
  user_agent      text,
  metadata        jsonb not null default '{}'::jsonb
);

create index audit_events_user_ts_idx on public.audit_events (user_id, ts desc);
create index audit_events_user_type_ts_idx on public.audit_events (user_id, event_type, ts desc);

alter table public.audit_events enable row level security;

create policy "own audit events are readable"
  on public.audit_events for select
  to authenticated
  using (user_id = auth.uid());

-- Append-only: block UPDATE and DELETE for every role, including service_role
-- (which bypasses RLS but not triggers).
create function public.audit_events_block_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_events is append-only';
end;
$$;

create trigger audit_events_no_update
  before update on public.audit_events
  for each row execute function public.audit_events_block_mutation();

create trigger audit_events_no_delete
  before delete on public.audit_events
  for each row execute function public.audit_events_block_mutation();

create trigger audit_events_no_truncate
  before truncate on public.audit_events
  for each statement execute function public.audit_events_block_mutation();
