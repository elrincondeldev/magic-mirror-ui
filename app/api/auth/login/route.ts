import { NextResponse } from 'next/server'

// Hardcoded credentials — change these before deploying to production
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123'

// Must match the value checked in middleware.ts
const SESSION_TOKEN = 'mm_valid_session_v1'
const COOKIE_NAME = 'mm_session'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))

  if (body.username === ADMIN_USERNAME && body.password === ADMIN_PASSWORD) {
    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, SESSION_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    return response
  }

  return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
}
