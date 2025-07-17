// src/curriculum/curriculum/curriculum.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Req, Get, Put, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurriculumService } from './curriculum.service';

import { Request } from 'express'; // Importe Request do express
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';

@Controller('curriculum')
@UseGuards(FirebaseAuthGuard) // Aplica o guard a todas as rotas neste controller
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCurriculum(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request // Injeta o objeto Request para acessar req.user
  ) {
    // O userId agora vem do token autenticado
    const userId = req.user.uid;
    return this.curriculumService.processAndSaveCurriculum(userId, file);
  }

  // --- NOVAS ROTAS PARA EXIBIR E EDITAR DADOS ---

  @Get('profile')
  async getProfile(@Req() req: Request) {
    const userId = req.user.uid;
    return this.curriculumService.getProfile(userId);
  }

  @Put('profile')
  async updateProfile(@Req() req: Request, @Body() updatedProfile: any) {
    const userId = req.user.uid;
    return this.curriculumService.updateProfile(userId, updatedProfile);
  }

  @Get('files')
  async getFilesMetadata(@Req() req: Request) {
    const userId = req.user.uid;
    return this.curriculumService.getFilesMetadata(userId);
  }
}