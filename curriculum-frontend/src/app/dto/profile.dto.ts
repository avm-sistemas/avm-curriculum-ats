import { IProfessionalExperience } from "../interfaces/professional-experience.interface";
import { IProfile } from "../interfaces/profile.interface";
import { ProfessionalExperience } from "./professional-experience.dto";

export class Profile implements IProfile {
    name: string;
    email: string;
    phone: string;
    professionalSummary: string;
    professionalExperience: ProfessionalExperience[];
    skills: string[];
    certificationsAndCourses: string;

    constructor() {
        this.name = '';
        this.email = '';
        this.phone = '';
        this.professionalSummary = '';
        this.professionalExperience = [];
        this.skills = [];
        this.certificationsAndCourses = '';        
    }

}