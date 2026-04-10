-- Remove the weak storage UPDATE policy that allows any authenticated user to overwrite any avatar
DROP POLICY IF EXISTS "Users can update their avatar" ON storage.objects;

-- Remove the weak storage DELETE policy if it exists with similar issue
DROP POLICY IF EXISTS "Users can delete their avatar" ON storage.objects;