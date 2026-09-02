'use server'

import { cookies } from 'next/headers'

export async function setActiveCompany(companyId: string) {
  const cookieStore = await cookies();
  cookieStore.set('cx_active_company', companyId, { path: '/' });
}
