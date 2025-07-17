import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfessionalExperience } from '../../dto/professional-experience.dto';

@Component({
  selector: 'app-experience-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './experience-modal.component.html',
  styleUrls: ['./experience-modal.component.scss']
})
export class ExperienceModalComponent implements OnInit {
  // @Input para receber a experiência a ser editada (ou undefined/null para nova)
  @Input() experience: ProfessionalExperience | undefined;

  // @Output para emitir a experiência salva ou indicar cancelamento
  @Output() save = new EventEmitter<ProfessionalExperience>();
  @Output() cancel = new EventEmitter<void>();

  // Cópia local da experiência para edição no formulário
  localExperience: ProfessionalExperience = {
    company: '',
    title: '',
    period: '',
    location: '',
    description: ''
  };

  isNewExperience = true;

  ngOnInit(): void {
    if (this.experience) {
      // Se uma experiência foi passada, estamos editando
      this.isNewExperience = false;
      // Faça uma cópia profunda para não modificar o objeto original diretamente
      this.localExperience = { ...this.experience };
    } else {
      // Se nenhuma experiência foi passada, estamos criando uma nova
      this.isNewExperience = true;
      this.localExperience = {
        company: '',
        title: '',
        period: '',
        location: '',
        description: ''
      };
    }
  }

  onSave(): void {
    // Emite a experiência editada/nova
    this.save.emit(this.localExperience);
  }

  onCancel(): void {
    // Emite o evento de cancelamento
    this.cancel.emit();
  }
}