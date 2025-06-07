import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Needed for ngModel
//import { HttpClientModule } from '@angular/common/http'; // Needed for HttpClient
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MainPageComponent } from './main-page/main-page';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, MainPageComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  password: string = '';
  message: string = '';
  loading = false;
  private timeoutHandle: any;

  //HIDE
  accessGranted = false;
  resultHtml = '';

  constructor(private http: HttpClient) {}

  checkPassword() {
    if (!this.password) {
      this.message = '';
      return;
    }
    this.loading = true;
    this.message = '';

    // Set up a timeout for 20 seconds
    if (this.timeoutHandle) clearTimeout(this.timeoutHandle);
    this.timeoutHandle = setTimeout(() => {
      this.loading = false;
      this.message = 'error, try again';
    }, 20000);

    // Call the PHP backend (replace with your actual PHP URL)
    this.http.post<{timestamp: number}>(
      'https://digitorumflex.com/fullstack_password.php',
      { password: this.password }
    ).subscribe({
      next: (data) => {
        clearTimeout(this.timeoutHandle);
        this.loading = false;
        const CORRECT_TIMESTAMP = 1749182760;
        if (data?.timestamp === CORRECT_TIMESTAMP) {
          //this.accessGranted = true;
          this.grantAccess();
        } else {
          this.message = "You don't have access";
        }
      },
      error: () => {
        clearTimeout(this.timeoutHandle);
        this.loading = false;
        this.message = 'error, try again';
      }
    });
  }

  grantAccess() {
    this.accessGranted = true;
  }

}
