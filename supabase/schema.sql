create extension if not exists pgcrypto;
create table monitors (id uuid primary key default gen_random_uuid(), url text not null unique, context text not null default '', created_at timestamptz not null default now(), last_checked_at timestamptz, last_status text);
create table snapshots (id uuid primary key default gen_random_uuid(), monitor_id uuid not null references monitors(id) on delete cascade, captured_at timestamptz not null default now(), content_hash text not null, raw_content text not null, facts jsonb not null);
create index snapshots_monitor_latest on snapshots(monitor_id, captured_at desc);
create table changes (id uuid primary key default gen_random_uuid(), monitor_id uuid not null references monitors(id) on delete cascade, old_snapshot_id uuid not null references snapshots(id), new_snapshot_id uuid not null references snapshots(id), report jsonb not null, created_at timestamptz not null default now());
create index changes_monitor_latest on changes(monitor_id, created_at desc);
-- Reservations count attempted checks, including failures; prevents concurrent requests bypassing limits.
create table check_attempts (id uuid primary key default gen_random_uuid(), monitor_id uuid not null references monitors(id) on delete cascade, created_at timestamptz not null default now());
create index check_attempts_date on check_attempts(created_at);
alter table monitors enable row level security;
alter table snapshots enable row level security;
alter table changes enable row level security;
alter table check_attempts enable row level security;
create function create_monitor(p_url text, p_context text) returns monitors language plpgsql security invoker as $$
declare result monitors;
begin
 perform pg_advisory_xact_lock(10231);
 select * into result from monitors where url = p_url;
 if found then return result; end if;
 if (select count(*) from monitors) >= 50 then raise exception 'Monitor limit reached (50).'; end if;
 insert into monitors(url, context) values(p_url, p_context) returning * into result;
 return result;
end $$;
create function reserve_check(p_monitor_id uuid) returns void language plpgsql security invoker as $$
begin
 perform pg_advisory_xact_lock(10232);
 if not exists(select 1 from monitors where id=p_monitor_id) then raise exception 'Monitor not found.'; end if;
 if (select count(*) from check_attempts where created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC') >= 100 then raise exception 'Daily check limit reached (100 UTC).'; end if;
 if exists(select 1 from check_attempts where monitor_id=p_monitor_id and created_at > now() - interval '90 seconds') then raise exception 'Please wait 90 seconds between checks for this monitor.'; end if;
 insert into check_attempts(monitor_id) values(p_monitor_id);
end $$;
-- Save snapshot, change, and check time atomically; reject stale concurrent results.
create function save_check(p_monitor_id uuid, p_previous_id uuid, p_hash text, p_content text, p_facts jsonb, p_report jsonb) returns uuid language plpgsql security invoker as $$
declare latest uuid; new_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_monitor_id::text, 0));
 select id into latest from snapshots where monitor_id=p_monitor_id order by captured_at desc, id desc limit 1;
 if latest is distinct from p_previous_id then raise exception 'A newer check was saved; please try again.'; end if;
 insert into snapshots(monitor_id,content_hash,raw_content,facts) values(p_monitor_id,p_hash,p_content,p_facts) returning id into new_id;
 if p_report is not null then
   insert into changes(monitor_id,old_snapshot_id,new_snapshot_id,report) values(p_monitor_id,p_previous_id,new_id,p_report);
 end if;
 update monitors set last_checked_at=now(), last_status=case when p_previous_id is null then 'baseline' when p_report is null then 'unchanged' else 'changed' end where id=p_monitor_id;
 return new_id;
end $$;
