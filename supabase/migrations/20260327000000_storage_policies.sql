-- Ensure article-images bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'article-images');

-- Allow anyone to read images (public bucket)
CREATE POLICY "Public read access for article images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'article-images');
