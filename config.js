// config.js

const SUPABASE_URL = "https://uejjzuclrdnhyxvfgwjp.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_gtOTTympyCDUnRV4A2WpjA_cCbBDZk0";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
