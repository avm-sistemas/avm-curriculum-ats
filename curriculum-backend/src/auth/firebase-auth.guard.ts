// src/auth/firebase-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FIREBASE_ADMIN_PROVIDER } from '../firebase/firebase.provider'; // Importe o provedor Firebase

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(@Inject(FIREBASE_ADMIN_PROVIDER) private firebaseAdmin: admin.app.App) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticação não fornecido ou mal formatado.');
    }

    const idToken = authHeader.split(' ')[1];

    try {
      const decodedToken = await this.firebaseAdmin.auth().verifyIdToken(idToken);
      // Anexa o UID do usuário à requisição para que os controllers e serviços possam acessá-lo
      request.user = { uid: decodedToken.uid };
      return true;
    } catch (error) {
      console.error('Erro na validação do token Firebase:', error);
      throw new UnauthorizedException('Token de autenticação inválido ou expirado.');
    }
  }
}