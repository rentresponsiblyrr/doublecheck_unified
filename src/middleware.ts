import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // Handle subdomain routing
  if (hostname.includes('admin.doublecheckverified.com')) {
    // Admin routes - redirect to admin pages
    if (url.pathname === '/') {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    // Allow admin paths to pass through
    if (url.pathname.startsWith('/dashboard') || 
        url.pathname.startsWith('/admin') ||
        url.pathname.startsWith('/api') ||
        url.pathname.startsWith('/_next') ||
        url.pathname.includes('.')) {
      return NextResponse.next()
    }
    // Redirect other paths to dashboard
    url.pathname = '/dashboard' + url.pathname
    return NextResponse.redirect(url)
  }

  if (hostname.includes('app.doublecheckverified.com')) {
    // Inspector app routes
    if (url.pathname === '/') {
      url.pathname = '/inspector'
      return NextResponse.redirect(url)
    }
    // Allow inspector paths to pass through
    if (url.pathname.startsWith('/inspector') ||
        url.pathname.startsWith('/api') ||
        url.pathname.startsWith('/auth') ||
        url.pathname.startsWith('/_next') ||
        url.pathname.includes('.')) {
      return NextResponse.next()
    }
    // Redirect other paths to inspector
    url.pathname = '/inspector' + url.pathname
    return NextResponse.redirect(url)
  }

  // Default behavior for other domains or Railway's default domain
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}