/**
 * Airtable Client for Motesart Converter
 *
 * Connects to the existing Airtable base for:
 * - Key Mappings (reference data)
 * - Users (auth & profiles)
 * - Conversions (storing results)
 * - Uploaded Files (file tracking)
 * - Analytics
 *
 * Note: Uses the Airtable REST API directly (no SDK needed for lightweight usage).
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appul9PF1Wp6DM7li';
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

interface AirtableRecord<T = Record<string, unknown>> {
  id: string;
  fields: T;
  createdTime: string;
}

interface AirtableResponse<T = Record<string, unknown>> {
  records: AirtableRecord<T>[];
  offset?: string;
}

/**
 * Generic Airtable API fetch helper.
 */
async function airtableFetch<T = Record<string, unknown>>(
  tableName: string,
  options?: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    params?: Record<string, string>;
    body?: unknown;
    recordId?: string;
  }
): Promise<AirtableResponse<T>> {
  const { method = 'GET', params, body, recordId } = options || {};

  let url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;
  if (recordId) url += `/${recordId}`;

  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };

  const fetchOptions: RequestInit = { method, headers };
  if (body) fetchOptions.body = JSON.stringify(body);

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Airtable API error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  return response.json();
}

// ==================== Key Mappings ====================

export interface KeyMappingFields {
  mapping_id: number;
  key_name: string;
  tonic_letter: string;
  scale_degrees: string;
  letter_mapping: string;
  accidentals: string;
  relative_minor: string;
}

/**
 * Fetch all key mappings from Airtable.
 */
export async function getKeyMappings(): Promise<AirtableRecord<KeyMappingFields>[]> {
  const data = await airtableFetch<KeyMappingFields>('Key_Mappings', {
    params: { sort: JSON.stringify([{ field: 'mapping_id', direction: 'asc' }]) },
  });
  return data.records;
}

// ==================== Conversions ====================

export interface ConversionFields {
  conversion_id?: string;
  user_id?: string;
  input_text: string;
  output_json: string;
  key_used: string;
  time_signature: string;
  created_at: string;
}

/**
 * Save a conversion result to Airtable.
 */
export async function saveConversion(
  fields: ConversionFields
): Promise<AirtableRecord<ConversionFields>> {
  const data = await airtableFetch<ConversionFields>('Conversions', {
    method: 'POST',
    body: {
      records: [{ fields }],
    },
  });
  return data.records[0];
}

/**
 * Get recent conversions for a user.
 */
export async function getUserConversions(
  userId: string,
  limit = 10
): Promise<AirtableRecord<ConversionFields>[]> {
  const data = await airtableFetch<ConversionFields>('Conversions', {
    params: {
      filterByFormula: `{user_id} = "${userId}"`,
      sort: JSON.stringify([{ field: 'created_at', direction: 'desc' }]),
      maxRecords: String(limit),
    },
  });
  return data.records;
}

// ==================== Users ====================

export interface UserFields {
  user_id: string;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  total_conversions: number;
  subscription_tier: 'Free' | 'Pro' | 'Premium';
  account_status?: string;
}

/**
 * Get a user by their ID.
 */
export async function getUser(
  userId: string
): Promise<AirtableRecord<UserFields> | null> {
  const data = await airtableFetch<UserFields>('Users', {
    params: {
      filterByFormula: `{user_id} = "${userId}"`,
      maxRecords: '1',
    },
  });
  return data.records[0] || null;
}

/**
 * Increment a user's conversion count.
 */
export async function incrementUserConversions(
  recordId: string,
  currentCount: number
): Promise<void> {
  await airtableFetch('Users', {
    method: 'PATCH',
    body: {
      records: [
        {
          id: recordId,
          fields: {
            total_conversions: currentCount + 1,
            last_login: new Date().toISOString(),
          },
        },
      ],
    },
  });
}

// ==================== Analytics ====================

export interface AnalyticsFields {
  event_type: string;
  user_id?: string;
  metadata?: string;
  created_at: string;
}

/**
 * Log an analytics event.
 */
export async function logAnalyticsEvent(
  fields: AnalyticsFields
): Promise<void> {
  await airtableFetch('Analytics_Stats', {
    method: 'POST',
    body: {
      records: [{ fields }],
    },
  });
}
