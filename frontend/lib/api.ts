/**
 * API client module for Ebookr backend
 * Handles all HTTP requests to the Django backend
 */

import supabase from './supabase'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

/**
 * Contact type matching Django contact model
 */
export interface Contact {
  id: number
  first_name: string
  last_name: string
  email: string
  company: string
  status: 'lead' | 'active' | 'inactive' | 'lost'
  source: string
  contact_type: 'contact' | 'company'
  contact_cadence: 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  contact_pref: 'email' | 'phone' | 'sms' | 'none'
  drip_campaign_enabled: boolean
  drip_campaign_config: any | null
  next_follow_up_at: string | null
  last_contacted_at: string | null
  notes: string
  created_at: string
  updated_at: string
}

/**
 * Payload for creating a new contact
 */
export interface CreateContactPayload {
  first_name: string
  last_name?: string
  email: string
  company?: string
  source?: string
  status?: Contact['status']
  notes?: string
  contact_type?: Contact['contact_type']
  contact_cadence?: Contact['contact_cadence']
  contact_pref?: Contact['contact_pref']
  drip_campaign_enabled?: boolean
  drip_campaign_config?: any
}

/**
 * Trial status from billing API
 */
export interface TrialStatus {
  status: 'trialing' | 'active' | 'past_due' | 'canceled'
  trial_ends_at: string | null
}

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  data?: T
  error?: string
}

/**
 * Helper function to make HTTP requests
 * @param url - The endpoint URL (relative to API_BASE_URL)
 * @param options - Fetch options
 * @returns Parsed response data
 * @throws Error if response status is not 2xx
 */
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const fullUrl = `${API_BASE_URL}${url}`

  try {
    // Attach Authorization header from mock supabase session when running in browser
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('mock_session')
        if (raw) {
          const session = JSON.parse(raw)
          if (session && session.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`
          }
        }
      } catch (e) {
        // ignore
      }
      // Attach Authorization header from mock supabase session when running in browser
      try {
        const { data } = supabase.getSession()
        const token = data?.session?.access_token
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
      } catch (e) {
        // ignore
      }
    }

    const response = await fetch(fullUrl, {
      headers,
      ...options,
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      const errorMessage =
        errorBody.error || `HTTP ${response.status}: ${response.statusText}`
      throw new Error(errorMessage)
    }

    const data: ApiResponse<T> = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    return data.data as T
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unknown error occurred while calling the API')
  }
}

/**
 * Get all contacts for the authenticated user
 * @returns Array of contacts
 */
export async function getContacts(): Promise<Contact[]> {
  return apiRequest<Contact[]>('/api/contacts/', {
    method: 'GET',
  })
}

/**
 * Create a new contact
 * @param payload - Contact data
 * @returns Created contact object
 */
export async function createContact(
  payload: CreateContactPayload
): Promise<Contact> {
  return apiRequest<Contact>('/api/contacts/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Get a single contact by ID
 * @param id - Contact ID
 * @returns Contact object
 */
export async function getContact(id: number): Promise<Contact> {
  return apiRequest<Contact>(`/api/contacts/${id}/`, {
    method: 'GET',
  })
}

/**
 * Update a contact
 * @param id - Contact ID
 * @param payload - Updated contact data
 * @returns Updated contact object
 */
export async function updateContact(
  id: number,
  payload: Partial<CreateContactPayload>
): Promise<Contact> {
  return apiRequest<Contact>(`/api/contacts/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

/**
 * Delete a contact
 * @param id - Contact ID
 */
export async function deleteContact(id: number): Promise<void> {
  return apiRequest<void>(`/api/contacts/${id}/`, {
    method: 'DELETE',
  })
}

/**
 * Get trial status for the current user
 * @returns Trial status info
 */
export async function getTrialStatus(): Promise<TrialStatus> {
  try {
    return await apiRequest<TrialStatus>('/api/billing/trial-status/', {
      method: 'GET',
    })
  } catch (error) {
    // If endpoint doesn't exist or fails, assume not in trial
    return {
      status: 'active',
      trial_ends_at: null,
    }
  }
}

/**
 * Create a Stripe checkout session
 * @param plan - Plan type: 'monthly' or 'annual'
 * @returns Checkout session with URL
 */
export async function createCheckoutSession(
  plan: 'monthly' | 'annual'
): Promise<{ checkout_url: string }> {
  return apiRequest<{ checkout_url: string }>(
    '/api/billing/create-checkout-session/',
    {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }
  )
}

/**
 * Subscription details from billing API
 */
export interface Subscription {
  id: number
  user_id: number
  stripe_customer_id: string
  stripe_subscription_id: string
  plan: 'monthly' | 'annual'
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid'
  trial_start_at: string | null
  trial_end_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

/**
 * Get current user's subscription
 * @returns Subscription details
 */
export async function getSubscription(): Promise<Subscription | null> {
  try {
    return await apiRequest<Subscription>('/api/billing/subscription/', {
      method: 'GET',
    })
  } catch (error) {
    // If endpoint doesn't exist or fails, return null
    return null
  }
}

/**
 * Drip campaign report types
 */
export interface DripCampaignSummary {
  campaign_id: number
  contact_id: number
  contact_email: string
  status: string
  steps_total: number
  steps_sent: number
  started_at: string | null
  completed_at: string | null
  last_step_sent_at: string | null
  created_at: string
  updated_at: string
}

export interface DripCampaignsReport {
  total_campaigns: number
  counts_by_status: Record<string, number>
  campaigns: DripCampaignSummary[]
}

/**
 * Fetch drip campaigns report from backend
 */
export async function getDripCampaignsReport(): Promise<DripCampaignsReport> {
  try {
    return await apiRequest<DripCampaignsReport>('/api/reports/drip-campaigns/', {
      method: 'GET',
    })
  } catch (error) {
    // If backend isn't available, throw to let caller fallback to mock data
    throw error
  }
}

/**
 * Export all contacts as CSV
 * Triggers a browser download of the CSV file
 */
export async function exportContactsCSV(): Promise<void> {
  const fullUrl = `${API_BASE_URL}/api/contacts/export/csv/`

  try {
    // Attach Authorization header
    const headers: Record<string, string> = {}
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('mock_session')
        if (raw) {
          const session = JSON.parse(raw)
          if (session && session.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`
          }
        }
      } catch (e) {
        // ignore
      }
      // Try supabase session as fallback
      try {
        const { data } = supabase.getSession()
        const token = data?.session?.access_token
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
      } catch (e) {
        // ignore
      }
    }

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Get the CSV blob
    const blob = await response.blob()

    // Create a temporary download link and click it
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'contacts.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to export contacts')
  }
}
