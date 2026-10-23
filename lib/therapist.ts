import { getSupabaseCredentials } from './admin';

export interface TherapistPatientRecord {
  id?: string;
  patient_code: string;
  patient_alias?: string | null;
  therapist_name?: string | null;
  clinic_name?: string | null;
  status: 'active' | 'unlinked' | 'archived';
  notes?: string | null;
  assigned_exercises?: any[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Synchronizes the patient's pairing code and linked therapist/clinic
 * to the Supabase database (`public.therapist_patients`).
 * Uses PostgREST upsert on `patient_code`.
 */
export async function syncTherapistPairing({
  patientCode,
  therapistName,
  clinicName,
  patientAlias,
  unlinked = false,
}: {
  patientCode: string;
  therapistName?: string;
  clinicName?: string;
  patientAlias?: string;
  unlinked?: boolean;
}): Promise<{ ok: boolean; status: number; error?: string }> {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return { ok: false, status: 0, error: 'Chybí konfigurace Supabase' };
  }

  const cleanCode = patientCode.trim().toUpperCase();
  if (!cleanCode) {
    return { ok: false, status: 0, error: 'Neplatný kód pacienta' };
  }

  const payload: Partial<TherapistPatientRecord> = {
    patient_code: cleanCode,
    patient_alias: patientAlias?.trim() || null,
    therapist_name: unlinked ? null : therapistName?.trim() || null,
    clinic_name: unlinked ? null : clinicName?.trim() || null,
    status: unlinked ? 'unlinked' : 'active',
    updated_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${url}/rest/v1/therapist_patients?on_conflict=patient_code`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: text || `HTTP ${res.status}` };
    }

    return { ok: true, status: res.status };
  } catch (err: any) {
    return { ok: false, status: 0, error: err?.message || 'Chyba sítě' };
  }
}

/**
 * Queries current therapist assignments or notes from Supabase for a given patient code.
 */
export async function fetchTherapistStatus(
  patientCode: string
): Promise<{ ok: boolean; data?: TherapistPatientRecord | null; error?: string }> {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return { ok: false, error: 'Chybí konfigurace Supabase' };
  }

  const cleanCode = patientCode.trim().toUpperCase();
  try {
    const res = await fetch(
      `${url}/rest/v1/therapist_patients?patient_code=eq.${encodeURIComponent(cleanCode)}&select=*&limit=1`,
      {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      }
    );

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }

    const rows: TherapistPatientRecord[] = await res.json();
    return { ok: true, data: rows.length > 0 ? rows[0] : null };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Chyba sítě' };
  }
}
