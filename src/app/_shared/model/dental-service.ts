export interface DentalService {
  _id?: string;
  name: string;
  duration: number;
  /** Absent assignments are legacy services; [] means unavailable. */
  clinics?: string[];
  canEditDetails?: boolean;
}

export function servicesForClinic(services: readonly DentalService[], clinicId: string): DentalService[] {
  return clinicId ? services.filter(service => service.clinics === undefined || service.clinics.includes(clinicId)) : [];
}
