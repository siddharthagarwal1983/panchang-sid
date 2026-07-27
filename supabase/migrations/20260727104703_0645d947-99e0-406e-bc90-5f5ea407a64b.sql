DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;

CREATE POLICY "Anonymous visitors can submit feedback"
ON public.feedback
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND length(btrim(message)) BETWEEN 1 AND 5000
  AND category IN ('general', 'bug', 'feature', 'timing', 'other')
  AND (name IS NULL OR length(name) <= 120)
  AND (email IS NULL OR (length(email) <= 320 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'))
);

CREATE POLICY "Signed-in users can submit their own feedback"
ON public.feedback
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND length(btrim(message)) BETWEEN 1 AND 5000
  AND category IN ('general', 'bug', 'feature', 'timing', 'other')
  AND (name IS NULL OR length(name) <= 120)
  AND (email IS NULL OR (length(email) <= 320 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'))
);