// Re-export supabase client from main lib to avoid multiple instances
// This prevents the "Multiple GoTrueClient instances" warning
export { supabase } from '@/lib/supabase';
