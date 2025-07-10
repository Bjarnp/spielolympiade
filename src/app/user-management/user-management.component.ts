import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../user.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  newUsername = '';
  newRole: 'admin' | 'user' = 'user';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.userService.getUsers().subscribe(u => (this.users = u));
  }

  addUser(): void {
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: this.newUsername,
      password: this.userService.defaultPassword,
      role: this.newRole,
      needsPasswordChange: true
    };
    this.userService.addUser(user).subscribe(() => {
      this.newUsername = '';
      this.newRole = 'user';
      this.load();
    });
  }

  resetPassword(user: User): void {
    const updated = { ...user, password: this.userService.defaultPassword, needsPasswordChange: true };
    this.userService.updateUser(updated).subscribe(() => this.load());
  }
}
