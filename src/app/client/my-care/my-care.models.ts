import { CareClinic, CarePerson } from '../../care/care.models';
export interface PatientVisitSummary {
  _id: string; date: string; clinic: CareClinic; dentist: CarePerson; purpose: 'consultation' | 'treatment'; careCase?: string;
  summary: string; aftercare: string; nextSteps: string; treatments: { description: string; tooth?: string }[];
}
export interface PatientCareCase { _id: string; clinic: CareClinic; dentist: CarePerson; title: string; plan: string; status: 'active' | 'completed' | 'discontinued'; consultationVisit: string; }
export interface PatientSession { _id: string; clinic: CareClinic; dentist: CarePerson; careCase: string; date: string; startTime: string; endTime: string; status: string; }
export interface MyCareRecord { visits: PatientVisitSummary[]; cases: PatientCareCase[]; appointments: PatientSession[]; }
export interface ClinicCareGroup { clinic: CareClinic; visits: PatientVisitSummary[]; cases: (PatientCareCase & { visits: PatientVisitSummary[]; sessions: PatientSession[] })[]; }
