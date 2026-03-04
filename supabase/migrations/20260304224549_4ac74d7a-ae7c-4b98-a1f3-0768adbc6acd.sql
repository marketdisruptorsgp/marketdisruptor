INSERT INTO storage.buckets (id, name, public)
VALUES ('product-visuals', 'product-visuals', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access on product-visuals"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-visuals');

CREATE POLICY "Authenticated upload on product-visuals"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-visuals');

CREATE POLICY "Anon upload on product-visuals"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'product-visuals');