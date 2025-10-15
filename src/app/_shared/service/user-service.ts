import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
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
  
  uploadProfilePicture(userId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const url = `${this.baseUrl}/${userId}/pictures`;

    return this.http.put(url, formData, { withCredentials: true });
  }


  getProfilePicture(userId: string): Observable<string> {
    const url = `${this.baseUrl}/${userId}/picture`;

    return this.http.get(url, { responseType: 'blob', withCredentials: true }).pipe(
      map(blob => URL.createObjectURL(blob))
    );
  }
}
