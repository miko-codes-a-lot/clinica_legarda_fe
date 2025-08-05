import { Injectable } from '@angular/core';
import { Day } from '../model/day';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DayService {
  getAll(): Observable<Day[]> {
    return new Observable((s) => {
      const days = [
        { label: 'Monday', code: 'monday', },
        { label: 'Tuesday', code: 'tuesday', },
        { label: 'Wednesday', code: 'wednesday', },
        { label: 'Thursday', code: 'thursday', },
        { label: 'Friday', code: 'friday', },
        { label: 'Saturday', code: 'saturday', },
        { label: 'Sunday', code: 'sunday', },
      ]
      s.next(days)
      
      s.complete()
    })
  }
}
