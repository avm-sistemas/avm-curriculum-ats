import { IProfessionalExperience } from "../interfaces/professional-experience.interface";

export class ProfessionalExperience implements IProfessionalExperience {
    company: string;
    title: string;
    period: string;
    location: string;
    description: string;

    constructor() {
        this.company = '';
        this.title = '';
        this.period = '';
        this.location = '';
        this.description = '';
    }
}