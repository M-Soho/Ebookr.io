/**
 * Mocked Supabase client for development.
 *
 * Provides a minimal API: signUp, signIn, getSession, signOut.
 * - signUp/signIn return a session with `access_token: 'mock-token-1'` and a user {id:1,email}
 * - Session is stored in `localStorage` under `mock_session` for browser requests.
 */

export interface MockUser {
  id: number
  email: string
}

export interface MockSession {
  access_token: string
  user: MockUser
}

const STORAGE_KEY = 'mock_session'

export const supabase = {
  async signUp(email: string, _password: string): Promise<{ data: { user: MockUser; session: MockSession } }>{
    const user = { id: 1, email }
    const session = { access_token: 'mock-token-1', user }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)) } catch (e) {}
    return { data: { user, session } }
  },

  async signIn(email: string, _password: string): Promise<{ data: { user: MockUser; session: MockSession } }>{
    const user = { id: 1, email }
    const session = { access_token: 'mock-token-1', user }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)) } catch (e) {}
    return { data: { user, session } }
  },

  getSession(): { data: { session: MockSession | null } } {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
      const session = raw ? JSON.parse(raw) as MockSession : null
      return { data: { session } }
    } catch (e) {
      return { data: { session: null } }
    }
  },

  signOut(): void {
    try { localStorage.removeItem(STORAGE_KEY) } catch (e) {}
  },
}

export default supabase
