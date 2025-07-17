import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { HomeComponent } from './home/home/home.component';
import { authGuard } from './auth/auth-guard';
import { CurriculumUploadComponent } from './curriculum/curriculum-upload/curriculum-upload.component';
import { ProfileEditorComponent } from './profile-editor/profile-editor/profile-editor.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'curriculo',
    component: CurriculumUploadComponent, 
    canActivate: [authGuard] 
  },
  {
    path: 'profile',
    component: ProfileEditorComponent,
    canActivate: [authGuard]
  },  
  { path: '', redirectTo: '/profile', pathMatch: 'full' }, // Redireciona a raiz para /curriculo
  { path: '**', redirectTo: '/login' } // Redireciona rotas não encontradas para /curriculo
];