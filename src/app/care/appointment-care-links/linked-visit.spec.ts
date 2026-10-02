import { selectLinkedVisit } from './linked-visit';
describe('Appointment linked intake history', () => {
  it('retains cancelled history without blocking a fresh check-in', () => {
    expect(selectLinkedVisit([{ _id:'cancelled', state:'cancelled' }])).toEqual({ current:null, latest:{_id:'cancelled',state:'cancelled'} });
  });
  it('prefers active or completed visits even if cancelled history is newer', () => {
    for (const state of ['waiting','in_progress','completed']) {
      expect(selectLinkedVisit([{_id:'cancelled',state:'cancelled'},{_id:'current',state}]).current?._id).toBe('current');
    }
  });
});
