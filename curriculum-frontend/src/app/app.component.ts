import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router'; // Importe RouterOutlet e RouterLink
import { AuthService } from './auth/auth.service';
import { User } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink], // Adicione RouterOutlet e RouterLink
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy{
  title = 'curriculum-frontend';
  loggedInUser: User | undefined;
  private userSubscription: Subscription | undefined;

  constructor(private authService: AuthService, private router: Router) {

  }
  ngOnInit(): void {
   this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.loggedInUser = user!;
      /*
      if (user) {
        console.log('Usuário logado:', user.email, user.displayName, user.uid);
      } else {
        console.log('Nenhum usuário logado.');
      }*/
    });
  }
  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/');
  }
}