import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://kgrpcfjnenzlnvryghrq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncnBjZmpuZW56bG52cnlnaHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTMxNzYsImV4cCI6MjA5MjI4OTE3Nn0.Bi9T3YjdsGk2OVvF7kfKvGxwqVaJUSoYuUGGGOA2W6U'
);