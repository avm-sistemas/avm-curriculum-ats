import { ProfessionalExperience } from "../dto/professional-experience.dto";

export interface IProfile {
  name: string;
  email: string;
  phone: string;
  professionalSummary: string;
  professionalExperience: ProfessionalExperience[];
  skills: string[]; // Agora é um array de strings
  certificationsAndCourses: string; // Nova propriedade  
  // Adicione outros campos do perfil aqui
}