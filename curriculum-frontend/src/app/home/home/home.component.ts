import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor(private authService: AuthService, private router: Router) {}

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      await this.router.navigate(['/login']); // Redireciona para login após o logout
    } catch (error) {
      console.error('Erro ao fazer logout no componente Home:', error);
      alert('Não foi possível sair. Por favor, tente novamente.');
    }
  }
}