
-- 0015_secure_storage_permissions.sql
-- Secure wedding document storage using section-level permissions.
-- Admins retain full access through has_section_access().

BEGIN;

-- Remove the existing role-only policies.
DROP POLICY IF EXISTS "Family and admins can view wedding files"
ON storage.objects;

DROP POLICY IF EXISTS "Family and admins can upload wedding files"
ON storage.objects;

-- VIEW: Only users with Files View access can read wedding documents.
CREATE POLICY "Wedding files: section view"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('receipts', 'contracts', 'event-files')
  AND public.has_section_access('files', 'view')
);

-- UPLOAD: Files Edit access is required.
CREATE POLICY "Wedding files: section insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('receipts', 'contracts', 'event-files')
  AND public.has_section_access('files', 'edit')
);

-- UPDATE: Files Edit access is required to replace or modify file objects.
CREATE POLICY "Wedding files: section update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('receipts', 'contracts', 'event-files')
  AND public.has_section_access('files', 'edit')
)
WITH CHECK (
  bucket_id IN ('receipts', 'contracts', 'event-files')
  AND public.has_section_access('files', 'edit')
);

-- DELETE: Files Edit access is required.
CREATE POLICY "Wedding files: section delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('receipts', 'contracts', 'event-files')
  AND public.has_section_access('files', 'edit')
);

COMMIT;
