// Exemplo em um serviço Angular (ex: src/app/services/auth.service.ts ou src/app/services/curriculum.service.ts)
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '@angular/fire/auth'; // Importe Auth
import { firstValueFrom } from 'rxjs';
import { IFilesMetadata } from '../interfaces/files-metadata.interface';
import { IProfile } from '../interfaces/profile.interface';

@Injectable({
  providedIn: 'root'
})
export class CurriculumService { // Renomeado para ser mais genérico para chamadas de API
  private apiUrl = 'http://localhost:3000/curriculum'; // URL do seu backend NestJS

  constructor(private http: HttpClient, private auth: Auth) {}

  private async getAuthHeaders(): Promise<HttpHeaders> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Usuário não autenticado.');
    }
    const idToken = await user.getIdToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${idToken}`
    });
  }

 // Método para buscar o perfil do usuário
  async getProfile(): Promise<IProfile> {
    const headers = await this.getAuthHeaders();

    // Assumindo que o backend usa o userId da sessão/token ou um ID padrão
    // Se o backend espera um ID na URL, você precisará passá-lo aqui:
    // return firstValueFrom(this.http.get<Profile>(`${this.apiUrl}/profile/${userId}`));
    return firstValueFrom(this.http.get<IProfile>(`${this.apiUrl}/profile`, { headers }));
  }

  // Método para atualizar o perfil do usuário
  async updateProfile(profileData: IProfile): Promise<any> {
    const headers = await this.getAuthHeaders();
    // O backend pode esperar o userId no body ou na URL, ajuste conforme sua API
    return firstValueFrom(this.http.put<any>(`${this.apiUrl}/profile`, profileData, { headers }));
  }

  // Método para buscar metadados de arquivos
  async getFilesMetadata(): Promise<IFilesMetadata> {
    const headers = await this.getAuthHeaders();
    // Similar ao getProfile, ajuste se precisar de userId na URL
    return firstValueFrom(this.http.get<IFilesMetadata>(`${this.apiUrl}/files`, { headers }));
  }

  // Método para upload de currículo (se o ProfileEditorComponent for fazer o upload)
  async uploadCurriculum(file: File): Promise<IProfile> {
    const headers = await this.getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);
    return firstValueFrom(this.http.post<IProfile>(`${this.apiUrl}/upload`, formData, { headers }));
  }
}
