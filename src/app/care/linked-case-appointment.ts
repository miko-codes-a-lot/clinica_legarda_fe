import { Appointment, AppointmentStatus } from '../_shared/model/appointment';
import { Clinic } from '../_shared/model/clinic';
import { PatientDirectoryEntry } from '../_shared/model/user-directory';
import { TreatmentCase } from './care.models';
export function linkedCaseAppointment(base: Appointment, careCase: TreatmentCase, clinics: readonly Clinic[], patients: readonly PatientDirectoryEntry[]): Appointment {
  if (careCase.status !== 'active') throw new Error('This treatment case is closed.');
  const clinic = clinics.find(item => item._id === careCase.clinic._id);
  const patient = patients.find(item => item._id === careCase.patient._id);
  if (!clinic || !patient) throw new Error('The case patient or clinic is outside your available appointment choices.');
  return { ...base, _id: '', careCase: careCase._id, clinic,
    patient: { ...base.patient, ...patient }, dentist: { ...base.dentist, ...careCase.dentist },
    status: AppointmentStatus.PENDING, isWalkIn: false, startTime: '', endTime: '', services: [],
    notes: { patientNotes: '', clinicNotes: '' }, history: [], referral: undefined, createdBy: undefined,
  };
}
