import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module'; 
import { CurriculumModule } from './curriculum/curriculum.module';

@Module({
  imports: [FirebaseModule, CurriculumModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}