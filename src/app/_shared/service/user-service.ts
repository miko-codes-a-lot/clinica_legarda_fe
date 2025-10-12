import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../model/user';
import { UserPayload } from '../../admin/user/user-form/user-payload';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly baseUrl = '/users'; // adjust if your backend has a different base path
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<User[]> { 
    return this.http.get<User[]>(this.baseUrl, { withCredentials: true });
  }

  getOne(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  create(user: UserPayload): Observable<User> {
    return this.http.post<User>(this.baseUrl, user, { withCredentials: true });
  }

  update(id: string, user: UserPayload): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, user, { withCredentials: true });
  }

  delete(id: string): Observable<void> {
     return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  createPublic(user: UserPayload): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/register`, user);
  }

}
