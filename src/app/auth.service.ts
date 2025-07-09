import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

interface User {
  username: string;
  role: 'admin' | 'user';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private storageKey = 'authUser';

  private users: Record<string, { password: string; role: 'admin' | 'user' }> = {
    bj: { password: 'bj', role: 'admin' },
    player: { password: 'player', role: 'user' }
  };

  constructor(private router: Router) {}

  login(username: string, password: string): boolean {
    const cred = this.users[username];
    if (cred && cred.password === password) {
      const user: User = { username, role: cred.role };
      localStorage.setItem(this.storageKey, JSON.stringify(user));
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
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
