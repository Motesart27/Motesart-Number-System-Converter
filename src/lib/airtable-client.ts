const AIRTABLE_BASE_URL = 'https://api.airtable.com/v0';

function getConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID env vars');
  }
  return { apiKey, baseId };
}

function headers() {
  const { apiKey } = getConfig();
  return {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json',
  };
}

function tableUrl(tableName: string) {
  const { baseId } = getConfig();
  return AIRTABLE_BASE_URL + '/' + baseId + '/' + encodeURIComponent(tableName);
}

export async function createRecord(tableName: string, fields: Record<string, unknown>) {
  const res = await fetch(tableUrl(tableName), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('Airtable create failed: ' + res.status + ' ' + err);
  }
  return res.json();
}

export async function findRecords(
  tableName: string,
  filterFormula: string,
  maxRecords?: number
) {
  const params = new URLSearchParams();
  params.set('filterByFormula', filterFormula);
  if (maxRecords) params.set('maxRecords', String(maxRecords));

  const res = await fetch(tableUrl(tableName) + '?' + params.toString(), {
    headers: headers(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('Airtable find failed: ' + res.status + ' ' + err);
  }
  const data = await res.json();
  return data.records || [];
}

export async function updateRecord(
  tableName: string,
  recordId: string,
  fields: Record<string, unknown>
) {
  const res = await fetch(tableUrl(tableName) + '/' + recordId, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('Airtable update failed: ' + res.status + ' ' + err);
  }
  return res.json();
}

export async function upsertRecord(
  tableName: string,
  fields: Record<string, unknown>,
  filterFormula: string
) {
  const existing = await findRecords(tableName, filterFormula, 1);
  if (existing.length > 0) {
    return updateRecord(tableName, existing[0].id, fields);
  }
  return createRecord(tableName, fields);
}
