import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service'; // Ajuste o caminho se necessário
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1), // Pega apenas o primeiro valor e completa o Observable
    map(user => {
      if (user) {
        return true; // Usuário logado, permite o acesso
      } else {
        // Usuário não logado, redireciona para a página de login
        router.navigate(['/login']);
        return false;
      }
    })
  );
};