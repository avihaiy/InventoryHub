import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zcpnoknfqvpcbnswevoy.supabase.co'
const supabaseKey = 'sb_publishable_m-WVChDA_IW3quuDkVz1Sw_-2mNSlGx'

export const supabase = createClient(supabaseUrl, supabaseKey)
