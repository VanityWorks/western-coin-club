CREATE OR REPLACE FUNCTION increment_referral_points(uid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE profiles SET referral_points = referral_points + 1 WHERE id = uid;
$$;
