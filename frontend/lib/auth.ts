/**
 * Fake Auth Module (Development Only)
 *
 * TODO: Replace this entire module with real Supabase auth when ready.
 * This is a placeholder that returns a hard-coded test user for development.
 *
 * @see https://supabase.com/docs/guides/auth
 */

export interface CurrentUser {
  id: number
  name: string
  email: string
}

/**
 * Get the currently logged-in user.
 *
 * TODO: Replace this with actual Supabase auth provider logic:
 * - Call supabase.auth.getSession() or useAuth() hook
 * - Return null if user is not authenticated
 * - Implement proper logout/signup/login flows
 *
 * For now, returns a hard-coded test user for development.
 */
import supabase from './supabase'

export function getCurrentUser(): CurrentUser {
  // Try to read a client-side mock session if available; fall back to hard-coded
  try {
    const { data } = supabase.getSession()
    if (data && data.session) {
      return {
        id: data.session.user.id,
        name: data.session.user.email.split('@')[0],
        email: data.session.user.email,
      }
    }
  } catch (e) {
    // ignore
  }

  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
  }
}

/**
 * Check if a user is authenticated.
 *
 * TODO: Replace with real auth check once Supabase is integrated.
 */
export function isAuthenticated(): boolean {
  try {
    const { data } = supabase.getSession()
    return !!(data && data.session)
  } catch (e) {
    return true
  }
}
