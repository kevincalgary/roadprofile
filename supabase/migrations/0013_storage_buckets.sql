-- RoadProfile: storage buckets and their access policies.
-- Public-read buckets: avatars, vehicle covers, record photos, record
-- documents (evidence attachments are public once redaction-acknowledged,
-- since they support the public vehicle history). Private bucket:
-- moderation evidence (report/correction attachments), readable only by
-- moderators and the submitting user.

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('vehicle-covers', 'vehicle-covers', true),
  ('list-covers', 'list-covers', true),
  ('record-photos', 'record-photos', true),
  ('record-documents', 'record-documents', true),
  ('moderation-evidence', 'moderation-evidence', false)
on conflict (id) do nothing;

-- Public buckets: anyone can read; only the authenticated owner (folder
-- named by their auth.uid()) can write/delete within their own prefix.
create policy storage_public_read on storage.objects
  for select using (
    bucket_id in ('avatars', 'vehicle-covers', 'list-covers', 'record-photos', 'record-documents')
  );

create policy storage_public_buckets_insert_own_prefix on storage.objects
  for insert with check (
    bucket_id in ('avatars', 'vehicle-covers', 'list-covers', 'record-photos', 'record-documents')
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_public_buckets_delete_own_prefix on storage.objects
  for delete using (
    bucket_id in ('avatars', 'vehicle-covers', 'list-covers', 'record-photos', 'record-documents')
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_user_is_moderator()
    )
  );

-- Moderation evidence: private. Submitter and moderators only.
create policy storage_moderation_evidence_read on storage.objects
  for select using (
    bucket_id = 'moderation-evidence'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_user_is_moderator()
    )
  );

create policy storage_moderation_evidence_insert on storage.objects
  for insert with check (
    bucket_id = 'moderation-evidence'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
