
-- 0013_user_section_permissions.sql
-- Section-level permissions for family and volunteers.
-- Admins retain full access.

BEGIN;

-- Store each user's access for each app section.
CREATE TABLE IF NOT EXISTS public.user_section_permissions (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, section_key),
  CONSTRAINT user_section_permissions_edit_requires_view
    CHECK (NOT can_edit OR can_view)
);

ALTER TABLE public.user_section_permissions
  ENABLE ROW LEVEL SECURITY;

-- Admins can manage permissions; users can read their own.
DROP POLICY IF EXISTS "usp_select_own_or_admin"
  ON public.user_section_permissions;
CREATE POLICY "usp_select_own_or_admin"
  ON public.user_section_permissions
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "usp_admin_insert"
  ON public.user_section_permissions;
CREATE POLICY "usp_admin_insert"
  ON public.user_section_permissions
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "usp_admin_update"
  ON public.user_section_permissions;
CREATE POLICY "usp_admin_update"
  ON public.user_section_permissions
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "usp_admin_delete"
  ON public.user_section_permissions;
CREATE POLICY "usp_admin_delete"
  ON public.user_section_permissions
  FOR DELETE
  USING (public.is_admin());

-- Check whether the signed-in user can view or edit a section.
CREATE OR REPLACE FUNCTION public.has_section_access(
  p_section_key text,
  p_access_type text DEFAULT 'view'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.user_section_permissions AS p
        WHERE p.user_id = auth.uid()
          AND p.section_key = p_section_key
          AND (
            (p_access_type = 'view' AND p.can_view)
            OR
            (p_access_type = 'edit' AND p.can_edit)
          )
      )
    );
$function$;

-- Only authenticated users may call the access checker.
REVOKE ALL ON FUNCTION public.has_section_access(text, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_section_access(text, text)
  TO authenticated;

-- Keep permission records private to their owner and admins.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.user_section_permissions TO authenticated;

COMMIT;
