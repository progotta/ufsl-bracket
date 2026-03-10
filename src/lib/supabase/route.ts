import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export const createRouteClient = () => {
  return createRouteHandlerClient<Database>({ cookies })
}
