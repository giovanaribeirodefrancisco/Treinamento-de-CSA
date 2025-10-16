import { provideRouter, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { TreinoTeoComponent } from './treino-teo/treino-teo.component';
import { TreinoPraComponent } from './treino-pra/treino-pra.component';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { CreateComponent } from './create/create.component';
import { AuthGuard } from './guard/auth.guard';
import { PerfilComponent } from './perfil/perfil.component';

export const routes: Routes = [
  { path: '', component: HomeComponent},
  { path: 'login', component: LoginComponent },
  {
    path: 'prancha', component: AppComponent,
    children: [
      { path: 'treinoteo', component: TreinoTeoComponent },
      { path: 'treinopra', component: TreinoPraComponent },
      { path: 'perfil', component: PerfilComponent }
    ]
  },
  /*{ path: 'prancha', component: AppComponent },
  { path: 'treinoteo', component: TreinoTeoComponent },
  { path: 'treinopra', component: TreinoPraComponent },*/
  { path: 'criar-conta', component: CreateComponent },
  { path: '**', redirectTo: 'criar-conta' }
];
