
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zzhbhyfqsfmobrzgergi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Ui-TgVfospVWZAfTyR5YEA_UFEHi48O';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
