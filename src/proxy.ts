import { type NextRequest, NextResponse } from 'next/server'

// Proxy simplifié pour test - auth gérée dans les layouts
export function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
