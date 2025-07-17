// src/curriculum/curriculum/curriculum.service.ts
import { Injectable, Inject, BadRequestException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import pdf from 'pdf-parse';
import * as mammoth from 'mammoth';

import * as fs from 'fs';
import * as path from 'path';
import { FIREBASE_ADMIN_PROVIDER } from 'src/firebase/firebase.provider';

@Injectable()
export class CurriculumService {
  private readonly logger = new Logger(CurriculumService.name);
  private firestore: admin.firestore.Firestore;
  private storage?: admin.storage.Storage;

  private readonly UPLOADS_DIR = 'uploads';
  private readonly USE_CLOUD_STORAGE = process.env.USE_CLOUD_STORAGE === 'true';

  constructor(@Inject(FIREBASE_ADMIN_PROVIDER) private firebaseAdmin: admin.app.App) {
    this.firestore = this.firebaseAdmin.firestore();

    if (this.USE_CLOUD_STORAGE) {
      this.storage = this.firebaseAdmin.storage();
      this.logger.log('Firebase Cloud Storage habilitado.');
    } else {
      this.logger.log('Armazenamento local em volume habilitado.');
      const uploadsPath = path.resolve(process.cwd(), this.UPLOADS_DIR);
      if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
        this.logger.log(`Diretório de uploads criado: ${uploadsPath}`);
      }
    }
  }

  async processAndSaveCurriculum(userId: string, file: Express.Multer.File): Promise<any> {
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${userId}_${Date.now()}${fileExtension}`;
    let fileUrl: string | null = null;
    let storagePath: string = ''; // <-- Altere para string vazia em vez de null

    try {
      if (this.USE_CLOUD_STORAGE) {
        const bucket = this.storage!.bucket();
        storagePath = `${userId}/${uniqueFileName}`; // Agora é definitivamente uma string
        const fileRef = bucket.file(storagePath);

        await fileRef.save(file.buffer, {
          metadata: { contentType: file.mimetype },
        });
        const [signedUrl] = await fileRef.getSignedUrl({
          action: 'read',
          expires: '03-09-2491',
        });
        fileUrl = signedUrl;
        this.logger.log(`Arquivo ${storagePath} salvo no Cloud Storage. URL: ${fileUrl}`);

      } else {
        storagePath = path.join(process.cwd(), this.UPLOADS_DIR, uniqueFileName); // Agora é definitivamente uma string
        fs.writeFileSync(storagePath, file.buffer);
        fileUrl = `/${this.UPLOADS_DIR}/${uniqueFileName}`;
        this.logger.log(`Arquivo ${uniqueFileName} salvo localmente em: ${storagePath}`);
      }

      const extractedText = await this.extractTextFromFile(file);
      const parsedProfile = this.parseAtsCurriculum(extractedText);

      const profileDocRef = this.firestore.collection('profile').doc(userId);
      await profileDocRef.set({
        ...parsedProfile,
        userId: userId,
        lastUploadDate: admin.firestore.FieldValue.serverTimestamp(),
        [this.USE_CLOUD_STORAGE ? 'cloudStoragePath' : 'localPath']: storagePath,
        [this.USE_CLOUD_STORAGE ? 'cloudStorageUrl' : 'localUrl']: fileUrl,
        fileName: file.originalname,
        fileMimeType: file.mimetype,
      }, { merge: true });
      this.logger.log(`Perfil do usuário ${userId} salvo no Firestore.`);

      const fileDocRef = this.firestore.collection('files').doc(userId);
      await fileDocRef.set({
        userId: userId,
        originalFileName: file.originalname,
        [this.USE_CLOUD_STORAGE ? 'cloudStoragePath' : 'localPath']: storagePath,
        [this.USE_CLOUD_STORAGE ? 'cloudStorageUrl' : 'localUrl']: fileUrl,
        mimeType: file.mimetype,
        uploadDate: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      this.logger.log(`Metadados do arquivo para ${userId} salvos no Firestore.`);

      return { message: 'Currículo processado e salvo com sucesso!' };
    } catch (error) {
      this.logger.error('Erro ao processar e salvar currículo:', error);
      // A verificação `storagePath` agora é garantida como string
      if (!this.USE_CLOUD_STORAGE && storagePath && fs.existsSync(storagePath)) { // <-- Adicione 'storagePath &&' aqui para segurança
        fs.unlinkSync(storagePath);
        this.logger.warn(`Arquivo ${uniqueFileName} removido localmente após falha.`);
      }
      throw new InternalServerErrorException('Erro ao processar e salvar o currículo.');
    }
  }

  async getProfile(userId: string): Promise<any> {
    const profileDoc = await this.firestore.collection('profile').doc(userId).get();
    if (!profileDoc.exists) {
      throw new NotFoundException(`Perfil para o usuário ${userId} não encontrado.`);
    }
    this.logger.log(`Perfil para o usuário ${userId} recuperado.`);
    return profileDoc.data();
  }

  async updateProfile(userId: string, updatedProfile: any): Promise<any> {
    const profileDocRef = this.firestore.collection('profile').doc(userId);
    // Remove o userId do objeto para evitar que ele seja sobrescrito se for enviado no body
    const { userId: _, ...dataToUpdate } = updatedProfile;
    await profileDocRef.set(dataToUpdate, { merge: true }); // Usa merge para atualizar apenas os campos fornecidos
    this.logger.log(`Perfil para o usuário ${userId} atualizado no Firestore.`);
    return { message: 'Perfil atualizado com sucesso!' };
  }

  async getFilesMetadata(userId: string): Promise<any> {
    const fileDoc = await this.firestore.collection('files').doc(userId).get();
    if (!fileDoc.exists) {
      // Pode retornar um array vazio ou null se o usuário ainda não tiver arquivos
      return null; // Ou [] se preferir uma lista vazia
    }
    this.logger.log(`Metadados do arquivo para o usuário ${userId} recuperados.`);
    return fileDoc.data();
  }  

  private async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    let textContent = '';
    const buffer = file.buffer;

    switch (file.mimetype) {
      case 'application/pdf':
        const data = await pdf(buffer);
        textContent = data.text;
        break;
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const result = await mammoth.extractRawText({ buffer: buffer });
        textContent = result.value;
        break;
      case 'text/plain':
        textContent = buffer.toString('utf8');
        break;
      default:
        throw new BadRequestException('Tipo de arquivo não suportado para extração de texto.');
    }
    return textContent;
  }

  /**
   * Analisa o texto extraído de um currículo e extrai informações ATS.
   * @param text O texto bruto extraído do currículo.
   * @returns Um objeto contendo os dados do perfil.
   */
  private parseAtsCurriculum(text: string): any {
    const profile: any = {};
    
    text = text.trim();

    const originalTextLines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const normalizedText = text.replace(/\s+/g, ' ').toLowerCase();

    // --- Extração de Email ---
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      profile.email = emailMatch[0];
    }

    // --- Extração de Telefone ---
    const phoneRegex = /(\+?\d{1,3}[-. ]?)?(\(?\d{2}\)?[-. ]?)?\d{4,5}[-. ]?\d{4}/g;
    const phoneMatches = text.match(phoneRegex);
    if (phoneMatches && phoneMatches.length > 0) {
      profile.phone = phoneMatches[0];
    }

    // --- Lógica para Extração de Nome ---
    let foundName: string | null = null;

    if (originalTextLines.length > 0) {
        let potentialName = originalTextLines[0];
        potentialName = potentialName.replace(/^[^a-zA-ZÀ-Ÿ\s]+|[^a-zA-ZÀ-Ÿ\s]+$/g, '').trim();
        
        const isAllUppercase = potentialName === potentialName.toUpperCase() && potentialName.length > 3;
        const hasMultipleWords = potentialName.split(' ').filter(w => w.length > 1).length >= 2;
        
        const commonTitles = new Set(['desenvolvedor full stack sênior', 'especialista', 'arquiteto de soluções', 'resumo profissional', 'habilidades', 'experiência profissional', 'contato']);
        const potentialNameLower = potentialName.toLowerCase();
        const isCommonTitle = Array.from(commonTitles).some(title => potentialNameLower.includes(title));

        if (isAllUppercase && hasMultipleWords && !isCommonTitle && !potentialName.includes('@') && !/\d/.test(potentialName)) {
             foundName = potentialName.trim();
        } else {
             const flexibleNamePattern = /^[A-ZÀ-Ÿ][a-zà-ÿ.'-]*(\s+[A-ZÀ-Ÿa-zà-ÿ.'-]*){1,5}$/;
             if (potentialName.match(flexibleNamePattern) && !potentialName.includes('@') && !/\d/.test(potentialName) && hasMultipleWords) {
                 foundName = potentialName.trim();
             } else {
                 if (originalTextLines.length > 1) {
                     let secondLine = originalTextLines[1];
                     secondLine = secondLine.replace(/^[^a-zA-ZÀ-Ÿ\s]+|[^a-zA-ZÀ-Ÿ\s]+$/g, '').trim();
                     const secondLineHasMultipleWords = secondLine.split(' ').filter(w => w.length > 1).length >= 2;
                     if (secondLine.length < 30 && secondLine.match(flexibleNamePattern) && !secondLine.includes('@') && !/\d/.test(secondLine) && secondLineHasMultipleWords) {
                         foundName = secondLine.trim();
                     }
                 }
             }
        }
    }
    
    if (!foundName || foundName === "Nome Não Encontrado") {
        const fallbackNameRegex = /^([A-ZÀ-Ÿ][a-zà-ÿ]+(?: [A-ZÀ-Ÿ][a-zà-ÿ]+){1,3}(?: [A-ZÀ-Ÿ][a-zà-ÿ]+)?)(?:\s|$)/;
        const fallbackNameMatch = text.match(fallbackNameRegex);
        if (fallbackNameMatch && fallbackNameMatch[1].length > 5) {
            foundName = fallbackNameMatch[1].trim();
        }
    }

    profile.name = foundName || "Nome Não Encontrado";


    // --- Extração de Resumo Profissional ---
    const summaryRegex = /(?:resumo profissional:|professional summary:|sumário profissional:)\s*([\s\S]*?)(?:habilidades:|skills:|experiência profissional:|work experience:|educação:|education:|certifica[çc][oõ]es:|certifications:|idiomas:|languages:|projetos:|projects:|portfólio:|$)/i;
    const summaryMatch = text.match(summaryRegex);
    if (summaryMatch && summaryMatch[1]) {
        profile.professionalSummary = summaryMatch[1].trim();
    } else {
        profile.professionalSummary = "Resumo Profissional Não Encontrado";
    }

    // --- Extração de Experiência Profissional como Array ---
    profile.professionalExperience = [];
    const experienceSectionRegex = /(?:experiencia profissional:|experiência profissional:|work experience:|employment history:)\s*([\s\S]*?)(?:certifica[çc][oõ]es:|certifications:|habilidades:|skills:|educação:|education:|idiomas:|languages:|projetos:|projects:|portfólio:|resumo profissional:|$)/i;
    const experienceSectionMatch = text.match(experienceSectionRegex);
    
    if (experienceSectionMatch && experienceSectionMatch[1]) {
        let rawExperienceText = experienceSectionMatch[1];
        
        // Aprimorar a divisão das entradas:
        // Procura por uma nova linha seguida por um nome de empresa (capitalizado)
        // que por sua vez é seguido por uma nova linha e então uma data ou um cargo.
        const experienceEntrySeparator = /\n(?=[A-Z][A-Za-z\s,.'-]+\b(?:,\s*(?:SA|Ltda|ME|Eireli|Software|Innovation|Sistemas|Informática|Brasil|Portugal)\b)?\s*\n(?:(?:\w+\s+\d{4}|presente|atual)|\b[A-Z][a-z\s,&'-]+(?:Desenvolvedor|Arquiteto|Analista|Sócio|Consultor|DevOps)\b))/g;

        const experienceEntries = rawExperienceText.split(experienceEntrySeparator)
                                                    .map(entry => entry.trim())
                                                    .filter(entry => entry.length > 0);

        const monthNames = "(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)";
        const dateRangeRegex = new RegExp(`(${monthNames}?\\s*\\d{4})\\s*(?:-|–|até|a|to)?\\s*(${monthNames}?\\s*\\d{4}|atual|presente)`, 'i');
        const locationRegex = /([A-ZÀ-Ÿ][a-zà-ÿ.'-]*\s*,\s*[A-ZÀ-Ÿ][a-zà-ÿ.'-]*|\b(?:remoto|presencial|híbrido)\b|\b[A-Z]{2,}\s*,\s*[A-Z][a-z]+)/i;
        const titleKeywords = /(desenvolvedor|arquiteto|analista|engenheiro|consultor|sócio|fullstack|front-end|back-end|devops|s[êe]nior|senior)/i;


        experienceEntries.forEach(entryText => {
            const experience: any = {
                company: "Não Encontrado",
                title: "Não Encontrado",
                period: "Não Encontrado",
                location: "Não Encontrado",
                description: "Nenhuma descrição detalhada encontrada."
            };
            
            const lines = entryText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            if (lines.length === 0) return; 

            let currentLineIndex = 0;

            // 1. Company: Always the first line
            experience.company = lines[currentLineIndex];
            currentLineIndex++;

            // Correção: Tipagem explícita para evitar 'never[]'
            let tempDescriptionLines: string[] = []; 

            // Iterate through the rest of the lines to find Period, Title, Location, and Description
            // The order of checks here is crucial based on the PDF format (Period, then Location, then Title, then description)
            for (let i = currentLineIndex; i < lines.length; i++) {
                const line = lines[i];

                // Check for Period first
                if (experience.period === "Não Encontrado" && line.match(dateRangeRegex)) {
                    experience.period = line;
                } 
                // Then check for Location
                else if (experience.location === "Não Encontrado" && line.match(locationRegex)) {
                    experience.location = line;
                } 
                // Then check for Title (after period and location, to avoid false positives)
                else if (experience.title === "Não Encontrado" && (line.match(titleKeywords) || (line.split(' ').length > 1 && line[0] === line[0].toUpperCase() && !line.includes('@') && !/\d/.test(line)))) {
                    experience.title = line;
                }
                // All other lines after identifying company, period, title, location are description.
                else {
                    tempDescriptionLines.push(line);
                }
            }
            
            // Re-assign description, making sure to remove any remaining bullets and extra spaces
            experience.description = tempDescriptionLines.join('\n').trim();
            experience.description = experience.description.replace(/^[-\s•\u2022\u00B7]+\s*/gm, '').replace(/\s+/g, ' ').trim();
            
            if (experience.description.length === 0) {
                experience.description = "Nenhuma descrição detalhada encontrada.";
            }

            profile.professionalExperience.push(experience);
        });

    } else {
        profile.professionalExperience = "Experiência Profissional Não Encontrada";
    }

    // --- Extração de Certificações e Cursos ---
    const certificationsRegex = /(?:certifica[çc][oõ]es:|certifications:|certificados e cursos:|certificações e cursos:)\s*([\s\S]*?)(?:idiomas:|languages:|projetos:|projects:|portfólio:|habilidades:|$)/i;
    const certificationsMatch = text.match(certificationsRegex);
    if (certificationsMatch && certificationsMatch[1]) {
        profile.certificationsAndCourses = certificationsMatch[1].trim();
    } else {
        profile.certificationsAndCourses = "Certificações e Cursos Não Encontrados";
    }


    // --- Refinando a Extração de Habilidades (Skills) ---
    profile.skills = [];

    const skillsSectionRegex = /(?:habilidades:|skills:|habilidades t[ée]cnicas|competencias|competências)[:\s\n-]*([\s\S]*?)(?:experiencia|experiência|formacao|formação|certifica[çc][oõ]es|idiomas|contato|projetos|portfólio|$)/i;
    const skillsSectionMatch = normalizedText.match(skillsSectionRegex);

    if (skillsSectionMatch && skillsSectionMatch[1]) {
        let rawSkillsText = skillsSectionMatch[1];
        
        // Comentado para evitar logs excessivos no output final
        // this.logger.log('DEBUG 1: rawSkillsText inicial:', rawSkillsText); 

        rawSkillsText = rawSkillsText.replace(/c#/gi, 'C#'); 
        rawSkillsText = rawSkillsText.replace(/vb\.net/gi, 'VB.NET'); 
        
        // this.logger.log('DEBUG 2: Após C# e VB.NET:', rawSkillsText); 

        rawSkillsText = rawSkillsText.replace(/(?<!vb\.)\.?net\b/gi, '.NET');
        
        // this.logger.log('DEBUG 3: Após .NET dot fix:', rawSkillsText); 

        rawSkillsText = rawSkillsText.replace(/asp[\s\.\-]*net/gi, 'ASP.NET');

        // this.logger.log('DEBUG 4: Após ASP.NET base:', rawSkillsText); 

        rawSkillsText = rawSkillsText.replace(/asp\.net\s*core?\s*mvc/gi, 'ASP.NET MVC');
        rawSkillsText = rawSkillsText.replace(/asp\.net\s*core?\s*webforms/gi, 'ASP.NET WebForms');
        
        // this.logger.log('DEBUG 5: Após ASP.NET MVC/WebForms diretos:', rawSkillsText); 

        rawSkillsText = rawSkillsText.replace(/(?<!asp\.)net\s*mvc/gi, 'ASP.NET MVC');
        rawSkillsText = rawSkillsText.replace(/(?<!asp\.)net\s*webforms/gi, 'ASP.NET WebForms');

        // this.logger.log('DEBUG 6: Após ASP.NET MVC/WebForms fallback:', rawSkillsText); 

        let cleanedSkillsText = rawSkillsText.replace(/[\r\n]+/g, ' ')
                                         .replace(/\s+/g, ' ') 
                                         .replace(/[•\u2022\u00B7]/g, ',')
                                         .replace(/;\s*/g, ', ')
                                         .trim();
        
        // this.logger.log('DEBUG 7: cleanedSkillsText:', cleanedSkillsText); 

        const complexSkillsMap = {
            'c#': 'C#', 
            '.net': '.NET', 
            'vb.net': 'VB.NET',
            'vb': 'VB.NET',
            'visual studio': 'Visual Studio',
            'sql server': 'SQL Server',
            't-sql': 'T-SQL',
            'pl/sql': 'PL/SQL',
            'psql': 'PSQL',
            'stored procedures': 'Stored Procedures',
            'windows services': 'Windows Services',
            'wcf services': 'WCF Services',
            'ms integration services': 'MS Integration Services',
            'devops': 'DevOps',
            'php': 'PHP',
            'asp.net mvc': 'ASP.NET MVC', 
            'asp.net webforms': 'ASP.NET WebForms', 
            'cloud computing': 'Cloud Computing',
            'firebase': 'Firebase',
            'amazon web services (aws)': 'Amazon Web Services (AWS)',
            'aws': 'AWS',
            'microsoft azure': 'Microsoft Azure',
            'azure': 'Azure',
            'nestjs': 'NestJs',
            'nodejs': 'NodeJs',
            'reactjs': 'ReactJs',
            'angular': 'Angular',
            'ionic': 'Ionic',
            'delphi': 'Delphi',
            'xamarin': 'Xamarin'
        };

        let textToProcess = cleanedSkillsText;

        const sortedKeys = Object.keys(complexSkillsMap).sort((a, b) => b.length - a.length);

        for (const key of sortedKeys) {
            const value = complexSkillsMap[key];
            let regex: RegExp;
            if (['c#', '.net', 'vb.net', 'asp.net mvc', 'asp.net webforms'].includes(key)) {
                regex = new RegExp(key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
            } else {
                regex = new RegExp(`\\b${key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
            }
            textToProcess = textToProcess.replace(regex, value);
        }
        
        // this.logger.log('DEBUG 8: textToProcess após complexSkillsMap:', textToProcess); 

        const skillTerms = textToProcess.split(/,\s*|\s{2,}|\n/);

        const tempSkills: Set<string> = new Set();

        const commonWords = new Set([
            'e', 'ou', 'de', 'do', 'da', 'em', 'para', 'com', 'sem', 'd', 's', 'l', 'a', 'o', 'um', 'uma', 'no', 'na', 'os', 'as',
            'ti', 'api', 'web', 'app', 'core', 'mvc', 'sql', 'js', 'ios', 'android', 'fullstack', 'senior', 'sênior',
            'development', 'developer', 'software', 'system', 'systems', 'platform', 'management', 'service', 'services', 'tools',
            'frameworks', 'linguagens', 'bancos', 'dados', 'cloud', 'computing', 'integration', 'process', 'procedures', 'studio',
            'visual', 'ms', 'microsoft', 'amazon', 'google', 'oracle', 'mysql', 'postgres', 'xp', 'ci', 'cd', 'backend', 'frontend',
            'experiência', 'profissional', 'consultor', 'arquiteto', 'devops', 'specialista', 'expert', 'solution', 'solutions',
            'desenvolvedor', 'engenheiro', 'engineer', 'analista', 'analysis', 'programador', 'programmer', 'programing', 'programação',
            'sólida', 'atuação', 'camadas', 'amplo', 'conhecimento', 'histórico', 'projetos', 'grandes', 'empresas', 'setor', 'focados',
            'proativo', 'autodidata', 'perfil', 'generalista', 'apto', 'equipes', 'ágeis', 'ágil', 'práticas', 'entregas',
            'trabalho', 'trabalhar', 'webforms', 'dot', 'asp' 
        ]);


        skillTerms.forEach(skillRaw => {
            let skill = skillRaw.trim(); 
            skill = skill.replace(/^['"]|['"]$/g, '');

            if (skill.length > 1 && !commonWords.has(skill.toLowerCase()) && skill.toLowerCase() !== 'aspasp') {
                tempSkills.add(skill);
            }
        });
        
        profile.skills = Array.from(tempSkills).slice(0, 40);
    }


    this.logger.log('Dados extraídos (refinado):', profile);
    return profile;
  }
}
