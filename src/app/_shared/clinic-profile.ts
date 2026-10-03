import profile from './clinic-profile.json';

export interface OfferedService {
  readonly name: string;
  readonly duration: number;
  readonly aliases: readonly string[];
  readonly assessment?: boolean;
  readonly multipleSessions?: boolean;
}

interface ClinicProfile {
  readonly shortName: string;
  readonly fullName: string;
  readonly tagline: string;
  readonly logo: string;
  readonly mainClinicId: string;
  readonly address: string;
  readonly phones: readonly string[];
  readonly email: string;
  readonly serviceGroups: readonly { readonly title: string; readonly icon: string; readonly services: readonly OfferedService[] }[];
}

/** Client-owned presentation content; the guarded database migration reads this same JSON. */
export const CLINIC_PROFILE: ClinicProfile = profile;
