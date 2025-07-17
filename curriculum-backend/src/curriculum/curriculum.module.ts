import { Module } from '@nestjs/common';
import { CurriculumController } from './curriculum/curriculum.controller';
import { CurriculumService } from './curriculum/curriculum.service';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [CurriculumController],
  providers: [CurriculumService]
})
export class CurriculumModule {}
