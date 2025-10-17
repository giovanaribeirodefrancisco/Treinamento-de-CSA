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
  confirmaSenha?: string;
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
    senha: '',
    confirmaSenha: ''
  };

  errorMessage = '';
  successMessage = '';
  loading = false;

  constructor(private readonly http: HttpClient, private readonly router: Router, private readonly authService: AuthService) {}

  criarConta() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Validações básicas no frontend
    if (!this.usuario.nome || this.usuario.nome.length < 3) {
      this.errorMessage = 'Nome de usuário deve ter pelo menos 3 caracteres';
      this.loading = false;
      return;
    }

    if (!this.usuario.email || !this.usuario.email.includes('@')) {
      this.errorMessage = 'Email inválido';
      this.loading = false;
      return;
    }

    if (!this.usuario.senha || this.usuario.senha.length < 6) {
      this.errorMessage = 'Senha deve ter pelo menos 6 caracteres';
      this.loading = false;
      return;
    }

    if (this.usuario.senha !== this.usuario.confirmaSenha) {
      this.errorMessage = 'As senhas não conferem';
      this.loading = false;
      return;
    }

    // Enviando os dados corretos para o backend
    const userData = {
      username: this.usuario.nome,
      email: this.usuario.email,
      password: this.usuario.senha,
      confirmPassword: this.usuario.confirmaSenha
    };

    this.http.post<any>('/api/cadastro', userData).subscribe({
      next: (response) => {
        console.log('Usuário criado com sucesso', response);

        if (response.success) {
          this.successMessage = 'Conta criada com sucesso! Redirecionando...';

          // Fazer login automaticamente
          this.authService.fazerLogin(response.user || {
            id: response.userId,
            username: userData.username,
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
        this.errorMessage = error.error?.message || error.error?.error || 'Erro ao criar conta. Por favor, tente novamente.';
        this.loading = false;
      }
    });
  }
}
