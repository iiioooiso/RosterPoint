import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const response = NextResponse.json({
    message: "Cookies cleared successfully",
    cleared: allCookies.map(c => c.name)
  });

  // Delete every single cookie found in the request
  allCookies.forEach(cookie => {
    response.cookies.delete(cookie.name);
  });

  return response;
}
