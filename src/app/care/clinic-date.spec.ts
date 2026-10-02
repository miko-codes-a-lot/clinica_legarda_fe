import { DatePipe } from '@angular/common';
import { ClinicDate } from './clinic-date';
describe('Clinic calendar date display', () => {
  it('preserves the Manila calendar day independently of browser timezone', () => {
    const pipe = new ClinicDate();
    expect(pipe.transform('2026-10-03')).toBe('Oct 3, 2026');
    expect(pipe.transform('2026-10-03T00:00:00.000Z')).toBe('Oct 3, 2026');
    expect(pipe.transform(null)).toBe('—');
    expect(new DatePipe('en-US').transform('2026-10-03T00:00:00.000Z','mediumDate','UTC')).toBe(pipe.transform('2026-10-03'));
  });
});
