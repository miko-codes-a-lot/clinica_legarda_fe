export type Dentition = 'permanent' | 'primary';
export interface ToothObservation { tooth: number; observation: string; notes: string; }
export interface ChartAuthor { _id: string; firstName?: string; middleName?: string; lastName?: string; }
export interface DentalChartRecord { _id: string; patient: string; clinic: { _id: string; name: string }; dentition: Dentition; revision: number; teeth: ToothObservation[]; updatedBy: ChartAuthor; updatedAt: string; }
export interface DentalChartRevision { revision: number; updatedBy: ChartAuthor; updatedAt: string; }
export interface DentalChartResponse { chart: DentalChartRecord | null; currentRevision: number; history: DentalChartRevision[]; }
export interface DentalChartPayload { clinic: string; dentition: Dentition; expectedRevision: number; teeth: ToothObservation[]; }
export function chartQuadrants(dentition: Dentition): { label: string; teeth: number[] }[] {
  const primary = dentition === 'primary', count = primary ? 5 : 8;
  return (primary ? [5,6,8,7] : [1,2,4,3]).map((quadrant,index) => ({ label: ['Upper right','Upper left','Lower right','Lower left'][index],
    teeth: Array.from({ length: count }, (_, i) => quadrant * 10 + (index % 2 === 0 ? count - i : i + 1)) }));
}
export const chartAuthorName = (author: ChartAuthor | null | undefined) => [author?.firstName,author?.middleName,author?.lastName].filter(Boolean).join(' ') || 'Clinic staff';
