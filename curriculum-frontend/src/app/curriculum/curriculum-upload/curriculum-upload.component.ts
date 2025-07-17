// src/app/curriculum/curriculum-upload.component.ts
import { Component, OnInit } from '@angular/core'; // Adicione OnInit
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // Importe HttpClient e HttpClientModule
import { AuthService } from '../../auth/auth.service';
import { CurriculumService } from '../../services/curriculum.service';

@Component({
  selector: 'app-curriculum-upload', // Altere o seletor
  standalone: true,
  imports: [CommonModule, HttpClientModule], // Adicione HttpClientModule
  templateUrl: './curriculum-upload.component.html',
  styleUrl: './curriculum-upload.component.scss'
})
export class CurriculumUploadComponent implements OnInit { // Implemente OnInit
  selectedFile: File | null = null;
  uploading = false;
  uploadSuccess = false;
  uploadError: string | null = null;
  userProfile: any | null = null; // Para armazenar o perfil do usuário
  userUid: string | null = null; // Para armazenar o UID do usuário

  // TODO: URL da sua API NestJS
  private backendUrl = 'http://localhost:3000/curriculum'; // Adapte para a porta do seu NestJS

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private curriculumService: CurriculumService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUserUid().subscribe(uid => {
      this.userUid = uid;
      if (uid) {
        this.checkExistingCurriculum(uid);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Validação de tipo de arquivo
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (allowedTypes.includes(file.type)) {
        this.selectedFile = file;
        this.uploadError = null; // Limpa erros anteriores
        this.uploadSuccess = false;
      } else {
        this.selectedFile = null;
        this.uploadError = 'Formato de arquivo inválido. Por favor, envie PDF, DOCX ou TXT.';
      }
    } else {
      this.selectedFile = null;
    }
  }

  /**
   * Envia o arquivo do currículo para o backend.
   */
  async onSubmit(): Promise<void> {
    if (!this.selectedFile || !this.userUid) {
      this.uploadError = 'Por favor, selecione um arquivo e certifique-se de estar logado.';
      return;
    }

    this.uploading = true;
    this.uploadSuccess = false;
    this.uploadError = null;

    const formData = new FormData();
    formData.append('curriculum', this.selectedFile); // 'curriculum' é o nome do campo esperado pelo NestJS

    // Opcional: Adicione o UID do usuário no FormData, se o backend precisar validar
    // formData.append('userId', this.userUid);

    try {
      // No Angular, o token de autenticação JWT é geralmente adicionado a cada requisição
      // Se o backend exigir o token de autenticação, você precisará obtê-lo.
      // Por enquanto, vamos assumir que o backend não exige um token para o upload,
      // mas validará se o usuário tem um perfil associado ao UID depois que o Firebase decodificá-lo.

      // Para obter o token (se necessário pelo backend):
      // const idToken = await this.authService.auth.currentUser?.getIdToken();
      // const headers = idToken ? new HttpHeaders().set('Authorization', `Bearer ${idToken}`) : undefined;
      // E passar para o post: { headers }

      await this.curriculumService.uploadCurriculum(this.selectedFile); // .toPromise() para async/await
      
      this.uploadSuccess = true;
      this.selectedFile = null; // Limpa o arquivo selecionado
      this.checkExistingCurriculum(this.userUid); // Verifica o currículo novamente após o upload
      console.log('Currículo enviado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao enviar currículo:', error);
      this.uploadError = error.error?.message || 'Erro ao enviar o currículo. Por favor, tente novamente.';
    } finally {
      this.uploading = false;
    }
  }

  /**
   * Verifica se o usuário já possui um currículo cadastrado.
   * Isso envolverá uma chamada ao backend para consultar o Firestore.
   */
  private async checkExistingCurriculum(uid: string): Promise<void> {
    try {
      // TODO: Implementar endpoint no NestJS para verificar/obter perfil
      // Por enquanto, vamos simular a verificação ou assumir que não há perfil.
      // Idealmente, você chamaria um endpoint como `http://localhost:3000/profile/${uid}`
      // const profile = await this.http.get<any>(`${this.backendUrl}/profile/${uid}`).toPromise();
      // this.userProfile = profile;
      // console.log('Perfil existente:', this.userProfile);

      // Simulação: Se o profile for encontrado, userProfile seria preenchido
      this.userProfile = null; // Limpar para simular que não existe
    } catch (error) {
      console.error('Erro ao verificar currículo existente:', error);
      this.userProfile = null;
    }
  }


  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erro ao fazer logout no componente de currículo:', error);
      alert('Não foi possível sair. Por favor, tente novamente.');
    }
  }
}