interface PatientIdentity { firstName?: string; lastName?: string; deletedAt?: string; }
export function patientDisplayName(patient: PatientIdentity | null | undefined): string {
  if (!patient) return 'Unknown patient';
  const name = [patient.firstName, patient.lastName].filter(Boolean).join(' ');
  return patient.deletedAt ? (name ? `${name} (Deleted patient)` : 'Deleted patient') : (name || 'Unknown patient');
}
export function isRetainedPatient(patient: PatientIdentity | null | undefined): boolean { return !patient || !!patient.deletedAt; }
