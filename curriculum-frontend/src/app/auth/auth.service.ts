import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser$: Observable<User | null>;

  constructor(private auth: Auth, private router: Router) {
    // 'user' é um Observable do AngularFireAuth que emite o usuário logado ou null
    this.currentUser$ = user(this.auth);
  }

  /**
   * Inicia o processo de login com a conta Google.
   * Redireciona para o pop-up de autenticação do Google.
   * @returns Promise<void>
   */
  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(this.auth, provider);
      console.log('Login com Google realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      // Você pode querer lançar o erro novamente ou lidar com ele de forma mais específica
      throw error;
    }
  }

  /**
   * Realiza o logout do usuário.
   * @returns Promise<void>
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
      console.log('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  }

  /**
   * Retorna um Observable que emite o UID do usuário logado ou null.
   * Útil para verificar o estado de autenticação e para usar como ID do documento no Firestore.
   */
  getCurrentUserUid(): Observable<string | null> {
    return this.currentUser$.pipe(
      switchMap(user => {
        return from(Promise.resolve(user ? user.uid : null));
      })
    );
  }
}