// lib/useSupabase.ts
'use client'

import { useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

export const useSupabase = () =>
  useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return createClient(supabaseUrl, supabaseAnonKey)
  }, [])
