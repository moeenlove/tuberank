import { createClient } from '@supabase/supabase-js'

// Temporary hardcoded (baad mein env se le lenge)
const supabaseUrl = "https://bcaxxeowdghbjsjvwcnu.supabase.co"
const supabaseAnonKey = "sb_publishable_Qe30WsKLKRVgIw2rL4GTDw_PM_cHww6"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)