
-- Storage bucket for explorer file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('explorer-uploads', 'explorer-uploads', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload explorer files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'explorer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public read for uploaded files (needed for AI to access URLs)
CREATE POLICY "Explorer uploads are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'explorer-uploads');

-- Users can delete their own uploads
CREATE POLICY "Users can delete their explorer uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'explorer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Table for saved explorer conversations
CREATE TABLE public.explorer_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.saved_analyses(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled conversation',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.explorer_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
ON public.explorer_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
ON public.explorer_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.explorer_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON public.explorer_conversations FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_explorer_conversations_updated_at
BEFORE UPDATE ON public.explorer_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
