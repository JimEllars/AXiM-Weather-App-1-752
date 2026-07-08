import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pvbcdndqjguzqeafhwhw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2YmNkbmRxamd1enFlYWZod2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTA2NDIsImV4cCI6MjA3Mzk2NjY0Mn0.xEy43ag_mVaQv1WnueNVQJtyP7j1Hap2XjlegeuG7zc';

export const supabase = createClient(supabaseUrl, supabaseKey);
