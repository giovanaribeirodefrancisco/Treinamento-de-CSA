import { HttpClientModule } from '@angular/common/http';
import { Component, AfterViewInit } from '@angular/core';
import { Usuario } from './usuario';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

declare var M: any; // Declare M globalmente para usar Materialize

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements AfterViewInit {

  mostrarAviso = false;
  errorMessage = '';
  loading = false;

  usuario: Usuario = new Usuario();
  lembrar: boolean = false;
  colunaImg: string = 'assets/Coluna.png';

  ngAfterViewInit() {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        try {
          const elems = document.querySelectorAll('.modal');

          // Validação: Verificar se M e M.Modal existem
          if (typeof M !== 'undefined' && M.Modal && typeof M.Modal.init === 'function') {
            M.Modal.init(elems);
            console.log('Modal TCLE inicializado com sucesso');
          } else {
            console.warn('Materialize M.Modal não está disponível');
          }
        } catch (error) {
          console.error('Erro ao inicializar modal:', error);
        }
      }, 0);
    }
  }

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  fazerLogin() {
    this.loading = true;
    this.errorMessage = '';

    const userData = {
      username: this.usuario.username || '',
      email: this.usuario.email || '',
      password: this.usuario.senha || ''
    };

    this.authService.loginComServidor(userData).subscribe({
      next: (data) => {
        console.log("Resposta do backend:", data);

        if (data.success) {
          this.authService.fazerLogin(data.user);
          this.router.navigate(['/prancha']);
        } else {
          this.errorMessage = data.error || 'Erro ao fazer login';
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao fazer login:', error);
        this.errorMessage = error.error?.error || 'Erro ao fazer login. Verifique as credenciais.';
        this.loading = false;
      }
    });
  }

  testeBotao() {
    // Reservado para testes
  }

  abrirTermo() {
    if (typeof window !== 'undefined') {
      try {
        const modalElement = document.getElementById('modalTermo');

        if (modalElement) {
          let modalInstance = M.Modal.getInstance(modalElement);

          if (!modalInstance) {
            // Validação: Verificar se M.Modal.init existe
            if (typeof M !== 'undefined' && M.Modal && typeof M.Modal.init === 'function') {
              modalInstance = M.Modal.init(modalElement);
            } else {
              console.warn('Materialize M.Modal não está disponível');
              return;
            }
          }

          if (modalInstance && typeof modalInstance.open === 'function') {
            modalInstance.open();
            console.log('Modal TCLE aberto');
          }
        } else {
          console.error('Modal não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao abrir modal:', error);
      }
    }
  }

  aceitarTermo() {
    this.router.navigate(['/criar-conta']);
  }

  recusarTermo() {
    this.mostrarAviso = true;
  }

  fecharAviso() {
    this.mostrarAviso = false;
  }
}
