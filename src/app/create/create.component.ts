import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../login/auth.service';

interface Usuario {
  nome: string;
  email: string;
  senha: string;
}

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class CreateComponent {

  usuario: Usuario = {
    nome: '',
    email: '',
    senha: ''
  };

  errorMessage = ''; // NOVO
  successMessage = ''; // NOVO
  loading = false; // NOVO

  constructor(private readonly http: HttpClient, private readonly router: Router, private readonly authService: AuthService) {}

  criarConta() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const userData = {
      name: this.usuario.nome,
      email: this.usuario.email,
      password: this.usuario.senha
    };

    /*this.http.post('http://localhost:3000/api/users', userData)
      .subscribe(
        (response: any) => {
          console.log('Usuário criado com sucesso', response);
          if (response.success) {
            this.authService.fazerLogin(response.user);  // Usa o AuthService para autenticar
            alert('Conta criada com sucesso!');
            this.router.navigate(['/prancha']);
          }

          /*alert('Conta criada com sucesso!');
          this.router.navigate(['/prancha']);

        },
        (error) => {
          console.error('Erro ao criar usuário', error);
          alert('Erro ao criar conta. Por favor, tente novamente.');
        }
      );*/
    this.http.post<any>('/api/cadastro', userData).subscribe({
      next: (response) => {
        console.log('Usuário criado com sucesso', response);
        
        if (response.success) {
          this.successMessage = 'Conta criada com sucesso! Redirecionando...';
          
          // Fazer login automaticamente
          this.authService.fazerLogin(response.user || {
            id: response.userId,
            name: userData.name,
            email: userData.email
          });
          
          // Redirecionar após 2 segundos
          setTimeout(() => {
            this.router.navigate(['/prancha']);
          }, 2000);
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao criar usuário', error);
        this.errorMessage = error.error?.error || 'Erro ao criar conta. Por favor, tente novamente.';
        this.loading = false;
      }
    });

  }


}
