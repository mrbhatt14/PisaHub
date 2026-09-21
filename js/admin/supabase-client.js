// Public values — safe to expose in browser code, protected by Row-Level Security.
// (Never put the service_role key here; that stays server-side only.)
const SUPABASE_URL = "https://cdrmxbqayedqjwxwgjde.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkcm14YnFheWVkcWp3eHdnamRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5NjM5MTMsImV4cCI6MjEwNTUzOTkxM30.xH5uYfee-f2DRu7WZdxh4PDCLdzytZqv8UlgRlIcfoA";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
