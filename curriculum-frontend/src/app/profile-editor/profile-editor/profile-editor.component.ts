// Exemplo: src/app/profile-editor/profile-editor.component.ts
import { Component, OnInit } from '@angular/core';
import { CurriculumService } from '../../services/curriculum.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IFilesMetadata } from '../../interfaces/files-metadata.interface';
import { Profile } from '../../dto/profile.dto';
import { IProfile } from '../../interfaces/profile.interface';
import { ExperienceModalComponent } from '../../modals/experience-modal/experience-modal.component';
import { IProfessionalExperience } from '../../interfaces/professional-experience.interface';

@Component({
  selector: 'app-profile-editor',
  templateUrl: './profile-editor.component.html',
  styleUrls: ['./profile-editor.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ExperienceModalComponent
  ],  
})
export class ProfileEditorComponent implements OnInit {
  //profile: any = {};
  profile?: IProfile = new Profile()

  filesMetadata?: IFilesMetadata | null = null;
  loading = true;
  error: string | null = null;

  skillsInput: string = '';

  showExperienceModal: boolean = false;
  currentExperience: IProfessionalExperience | undefined; // Experiência sendo editada (ou undefined para nova)
  indexOfExperienceToEdit: number = -1; // Índice da experiência no array para edição
  isNewExperience: boolean = false;

  constructor(private curriculumService: CurriculumService) {}

  async ngOnInit() {
    await this.loadProfileData();
  }

  async loadProfileData() {
    this.loading = true;
    this.error = null;
    try {
      const fetchedProfile = await this.curriculumService.getProfile();
      this.profile = fetchedProfile;
      
      // Converte o array de skills para uma string para o input
      if (this.profile.skills && this.profile.skills.length > 0) {
        this.skillsInput = this.profile.skills.join(', ');
      } else {
        this.skillsInput = '';
      }

      this.filesMetadata = await this.curriculumService.getFilesMetadata();

      // Se filesMetadata for null, inicialize como um objeto vazio para evitar erros no template
      if (!this.filesMetadata) {
        this.filesMetadata = { originalFileName: 'N/A', mimeType: 'N/A', uploadDate: 'N/A' };
      }
    } catch (err) {
      console.error('Erro ao carregar dados do perfil:', err);
      this.error = 'Falha ao carregar os dados do perfil.';
      // Inicializa profile e filesMetadata para evitar erros no template se houver falha
      this.profile = {
        name: '', email: '', phone: '', professionalSummary: '', professionalExperience: [], skills: [], certificationsAndCourses: ''
      };
      this.filesMetadata = { originalFileName: 'N/A', mimeType: 'N/A', uploadDate: 'N/A' };
    } finally {
      this.loading = false;
    }
  }

  async saveProfile() {
    this.loading = true;
    this.error = null;
    try {
      // Converte a string do input de skills de volta para um array antes de salvar
      this.profile!.skills = this.skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);

      await this.curriculumService.updateProfile(this.profile!);
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      this.error = 'Falha ao salvar as alterações.';
    } finally {
      this.loading = false;
    }
  }  

  // --- Métodos para o Modal de Experiência ---

  openNewExperienceModal(): void {
    this.currentExperience = undefined; // Indica que é uma nova experiência
    this.isNewExperience = true; // Define para nova experiência
    this.showExperienceModal = true;
  }

  openEditExperienceModal(exp: IProfessionalExperience, index: number): void {
    this.currentExperience = exp; // Passa a experiência existente
    this.indexOfExperienceToEdit = index; // Guarda o índice para atualização
    this.isNewExperience = false; // Define para edição
    this.showExperienceModal = true;
  }

  onExperienceSaved(savedExp: IProfessionalExperience): void {
    if (this.isNewExperience) {
      // Adiciona a nova experiência ao início do array (ou onde preferir)
      this.profile!.professionalExperience.unshift(savedExp);
    } else {
      // Atualiza a experiência existente
      if (this.indexOfExperienceToEdit > -1) {
        this.profile!.professionalExperience[this.indexOfExperienceToEdit] = savedExp;
      }
    }
    this.showExperienceModal = false; // Fecha o modal
    this.saveProfile(); // Salva as alterações no backend
  }

  onExperienceModalCanceled(): void {
    this.showExperienceModal = false; // Fecha o modal
    this.currentExperience = undefined; // Limpa a experiência atual
    this.indexOfExperienceToEdit = -1; // Reseta o índice
  }

  onDeleteExperience(index: number): void {
    if (confirm('Tem certeza que deseja excluir esta experiência?')) {
      this.profile!.professionalExperience.splice(index, 1);
      this.saveProfile(); // Salva as alterações no backend
    }
  }  

  moveExperienceUp(index: number): void {
    if (index > 0) { // Garante que não é o primeiro item
      // Troca os elementos de posição usando desestruturação de array
      [this.profile!.professionalExperience[index], this.profile!.professionalExperience[index - 1]] = 
      [this.profile!.professionalExperience[index - 1], this.profile!.professionalExperience[index]];
      this.saveProfile(); // Salva a nova ordem no backend
    }
  }

  moveExperienceDown(index: number): void {
    if (index < this.profile!.professionalExperience.length - 1) { // Garante que não é o último item
      // Troca os elementos de posição usando desestruturação de array
      [this.profile!.professionalExperience[index], this.profile!.professionalExperience[index + 1]] = 
      [this.profile!.professionalExperience[index + 1], this.profile!.professionalExperience[index]];
      this.saveProfile(); // Salva a nova ordem no backend
    }
  }  

exportToAtsModel(): void {
    console.log('Botão "Exportar para Modelo ATS" clicado.');
    alert('A exportação para Modelo ATS está em desenvolvimento. Será baixado um arquivo de texto simples como exemplo.');
    
    // **NOTA:** Em uma aplicação real, você faria uma chamada ao backend aqui.
    // Exemplo:
    // this.curriculumService.exportProfileToAts().then(atsData => {
    //   // atsData viria já formatado pelo backend (ex: string de texto, PDF blob, etc.)
    //   this.downloadTextFile(atsData, 'perfil-ats.txt'); 
    // }).catch(error => {
    //   console.error('Erro ao exportar para ATS:', error);
    //   alert('Ocorreu um erro ao exportar para Modelo ATS.');
    // });

    // Implementação temporária: gera um texto simples no cliente e baixa como .txt
    const atsText = this.generateSimpleAtsText(this.profile!);
    this.downloadTextFile(atsText, 'perfil-andre-ats.txt'); // Nome do arquivo sugerido
  }

  // Função auxiliar para gerar um texto simples do perfil para ATS
  private generateSimpleAtsText(profile: Profile): string {
    let atsContent = `Nome: ${profile.name}\n`;
    atsContent += `Email: ${profile.email}\n`;
    atsContent += `Telefone: ${profile.phone}\n\n`;
    atsContent += `Resumo Profissional:\n${profile.professionalSummary}\n\n`;
    
    if (profile.skills && profile.skills.length > 0) {
      atsContent += `Habilidades:\n${profile.skills.join(', ')}\n\n`;
    }

    if (profile.professionalExperience && profile.professionalExperience.length > 0) {
      atsContent += `Experiência Profissional:\n`;
      profile.professionalExperience.forEach(exp => {
        atsContent += `  - ${exp.title}\n`;
        atsContent += `  - ${exp.company}\n`;        
        atsContent += `  - ${exp.period}\n`;
        atsContent += `    Local: ${exp.location}\n`;
        atsContent += `    Descrição: ${exp.description}\n\n`;
      });
    }

    if (profile.certificationsAndCourses) {
      atsContent += `Certificações e Cursos:\n${profile.certificationsAndCourses}\n`;
    }

    return atsContent;
  }

  // Função auxiliar para baixar um arquivo de texto no navegador
  private downloadTextFile(text: string, filename: string): void {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    // Simula um clique no elemento para iniciar o download
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  // --- Função para manipulação de data do firestore ---
  getDate(date: any): string {
    if (!date) {
      return 'N/A';
    }

    try {
      let jsDate: Date;

      // Se já for um objeto Date
      if (date instanceof Date) {
        jsDate = date;
      }
      // Se for um objeto Timestamp do Firestore (com ou sem underscores)
      else if (typeof date === 'object' && date !== null) {
        // Tenta com _seconds e _nanoseconds (formato mais comum de serialização)
        if ('_seconds' in date && typeof date._seconds === 'number' &&
            '_nanoseconds' in date && typeof date._nanoseconds === 'number') {
          jsDate = new Date(date._seconds * 1000 + (date._nanoseconds || 0) / 1_000_000);
        }
        // Tenta com seconds e nanoseconds (caso o backend remova os underscores)
        else if ('seconds' in date && typeof date.seconds === 'number' &&
                 'nanoseconds' in date && typeof date.nanoseconds === 'number') {
          jsDate = new Date(date.seconds * 1000 + (date.nanoseconds || 0) / 1_000_000);
        }
        // Se for um objeto, mas não um Timestamp reconhecido, tenta .toDate() se existir (para Timestamps reais)
        else if (typeof date.toDate === 'function') {
          jsDate = date.toDate();
        }
        else {
          return 'N/A'; // Objeto não é um formato de data reconhecido
        }
      }
      // Se for uma string (tentar parsear)
      else if (typeof date === 'string') {
        jsDate = new Date(date);
      }
      // Se nenhum dos anteriores, não é uma data válida
      else {
        return 'N/A';
      }

      // Validação final após a conversão
      if (isNaN(jsDate.getTime())) {
        return 'Data Inválida'; 
      }

      return jsDate.toLocaleDateString(); // Formata como string de data local
    } catch (e) {
      console.error('Erro ao processar data:', e, date);
      return 'Erro na Data'; 
    }
  }
  // --- Fim das funções de data ---  

}