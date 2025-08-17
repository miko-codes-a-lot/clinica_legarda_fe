import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  private isLoading: Subject<boolean> = new BehaviorSubject<boolean>(false)
  isLoading$: Observable<boolean> = this.isLoading.asObservable()

  setLoading(loading: boolean) {
    this.isLoading.next(loading)
  }
}
