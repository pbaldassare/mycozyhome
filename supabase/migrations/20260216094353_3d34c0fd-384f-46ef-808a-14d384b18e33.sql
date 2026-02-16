-- Create professional_favorites table
CREATE TABLE public.professional_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(professional_id, client_id)
);

-- Enable RLS
ALTER TABLE public.professional_favorites ENABLE ROW LEVEL SECURITY;

-- Professionals can view their own favorites
CREATE POLICY "Professionals can view their favorites"
  ON public.professional_favorites
  FOR SELECT
  USING (professional_id IN (
    SELECT id FROM professionals WHERE user_id = auth.uid()
  ));

-- Professionals can add favorites
CREATE POLICY "Professionals can add favorites"
  ON public.professional_favorites
  FOR INSERT
  WITH CHECK (professional_id IN (
    SELECT id FROM professionals WHERE user_id = auth.uid()
  ));

-- Professionals can remove favorites
CREATE POLICY "Professionals can remove favorites"
  ON public.professional_favorites
  FOR DELETE
  USING (professional_id IN (
    SELECT id FROM professionals WHERE user_id = auth.uid()
  ));