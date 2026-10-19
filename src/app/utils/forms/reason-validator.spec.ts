import { FormControl } from '@angular/forms';
import { reasonTextValidator } from './reason-validator';
describe('New referral reason text', () => {
  it('requires 3 to 500 meaningful characters without counting padding', () => {
    for (const value of ['', '  ', ' ab ', 'a'.repeat(501)]) expect(new FormControl(value, reasonTextValidator).invalid).toBeTrue();
    expect(new FormControl('  Patient needs specialist care  ', reasonTextValidator).valid).toBeTrue();
  });
});
