UPDATE profiles p
SET membership_number = ma.reference_number
FROM membership_applications ma
WHERE ma.member_id = p.id
  AND ma.status = 'approved'
  AND p.membership_number IS NULL;
