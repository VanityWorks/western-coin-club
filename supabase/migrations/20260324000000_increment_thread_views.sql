CREATE OR REPLACE FUNCTION increment_thread_views(tid bigint)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE forum_threads SET views = COALESCE(views, 0) + 1 WHERE id = tid;
$$;
