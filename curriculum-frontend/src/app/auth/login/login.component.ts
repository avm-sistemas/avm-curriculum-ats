import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necessário para diretivas como ngIf
import { AuthService } from '../auth.service';
import { Router } from '@angular/router'; // Para redirecionar após o login

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule], // Adicione CommonModule para usar diretivas Angular
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  isLoading = false; // Flag para controlar o estado de carregamento

  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Inicia o processo de login com o Google.
   */
  async signInWithGoogle(): Promise<void> {
    this.isLoading = true; // Ativa o estado de carregamento
    try {
      await this.authService.loginWithGoogle();
      // Redireciona o usuário para a página principal (ou de upload) após o login
      await this.router.navigate(['/profile']); // Vamos criar esta rota em breve
      console.log('Usuário logado e redirecionado.');
    } catch (error) {
      console.error('Erro no componente de login:', error);
      // Você pode exibir uma mensagem de erro para o usuário aqui
      alert('Não foi possível fazer login. Por favor, tente novamente.');
    } finally {
      this.isLoading = false; // Desativa o estado de carregamento
    }
  }
}