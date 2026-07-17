import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-password-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './password-dialog.component.html',
  styleUrls: ['./password-dialog.component.scss'],
})
export class PasswordDialogComponent {
  password = '';

  constructor(
    private dialogRef: MatDialogRef<PasswordDialogComponent, string | null>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message?: string; confirmLabel?: string },
  ) {}

  confirm(): void {
    if (!this.password) return;
    const password = this.password;
    this.password = '';
    this.dialogRef.close(password);
  }
}
