import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ruollgnqyebvuozchmxj.supabase.co'
const supabaseKey = 'sb_publishable_To58sCRrxsGGmpuqizLa_g_RZjEPZKZ'

export const supabase = createClient(supabaseUrl, supabaseKey)
