import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://olyoukmspibiafejrezj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9seW91a21zcGliaWFmZWpyZXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTgyOTQsImV4cCI6MjA5NzgzNDI5NH0.U8L5kn26czcQnAcnfqN0rs0TLaw7NYb8lVRLkj1wmM4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);