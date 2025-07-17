import { Provider } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs'; // Importe o módulo 'fs' para leitura de arquivos

export const FIREBASE_ADMIN_PROVIDER = 'FIREBASE_ADMIN_PROVIDER';

export const FirebaseAdminProvider: Provider = {
  provide: FIREBASE_ADMIN_PROVIDER,
  useFactory: () => {
    if (!admin.apps.length) {
      // Caminho absoluto para o arquivo JSON
      // Assume que o arquivo está na raiz do projeto (onde o comando 'node dist/main' é executado)
      const serviceAccountPath = path.resolve(process.cwd(), 'src', 'config', 'firebase-adminsdk.json');
      // OU se estiver em uma pasta 'config' na raiz do projeto:
      // const serviceAccountPath = path.resolve(process.cwd(), 'config', 'firebase-adminsdk.json');


      // Verifique se o arquivo existe antes de tentar lê-lo
      if (!fs.existsSync(serviceAccountPath)) {
        console.error(`Erro: Arquivo de chave de serviço do Firebase não encontrado em: ${serviceAccountPath}`);
        throw new Error('Chave de serviço do Firebase ausente.');
      }

      // Lê o arquivo JSON diretamente
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // storageBucket: 'your-project-id.appspot.com'
      });
      console.log('Firebase Admin SDK inicializado.');
    }
    return admin;
  },
};