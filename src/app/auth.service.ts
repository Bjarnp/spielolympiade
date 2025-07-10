import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { User } from './models/user.model';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private storageKey = 'authUser';

  constructor(private http: HttpClient, private router: Router, private userService: UserService) {}

  login(username: string, password: string): Observable<'success' | 'change' | 'fail'> {
    return this.http.get<User[]>(`http://localhost:3000/users?username=${username}`).pipe(
      map(users => users[0]),
      map(user => {
        if (user && user.password === password) {
          localStorage.setItem(this.storageKey, JSON.stringify(user));
          return user.needsPasswordChange ? 'change' : 'success';
        }
        return 'fail';
      })
    );
  }

  changePassword(newPassword: string): Observable<User | null> {
    const user = this.getUser();
    if (!user) return of(null);
    const updated: User = { ...user, password: newPassword, needsPasswordChange: false };
    return this.userService.updateUser(updated).pipe(
      tap(u => localStorage.setItem(this.storageKey, JSON.stringify(u)))
    );
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.router.navigate(['/login']);
  }

  getUser(): User | null {
    const data = localStorage.getItem(this.storageKey);
    return data ? (JSON.parse(data) as User) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }

  isAdmin(): boolean {
    return this.getUser()?.role === 'admin';
  }
}
