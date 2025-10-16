import { HttpClientModule } from '@angular/common/http';
import { Component, AfterViewInit } from '@angular/core';
import { Usuario } from './usuario';
import { FormsModule,  } from '@angular/forms';
import { AuthService } from './auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements AfterViewInit {

  mostrarAviso = false;
  errorMessage = ''; // NOVO: Mensagem de erro
  loading = false; // NOVO: Estado de carregamento

  usuario: Usuario = new Usuario();
  lembrar: boolean = false;
  colunaImg: string = 'assets/Coluna.png';

  ngAfterViewInit() {
    if (typeof window !== 'undefined'){
      setTimeout(() => {
        const elems = document.querySelectorAll('.modal');
        M.Modal.init(elems);
        console.log('Modal TCLE inicializado com sucesso');
      });
    }
  }


  constructor(private readonly authService: AuthService, private readonly router: Router){}

  fazerLogin(){
    this.loading = true; // NOVO
    this.errorMessage = ''; // NOVO

    const userData = {
      username: this.usuario.username || '',
      email: this.usuario.email || '', // eu uso o "nome" no front, mas aqui é o email
      password: this.usuario.senha || ''
    };

     // ATUALIZADO: Usar a nova API /api/login
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
    //console.log('Botão clicado');
    //alert('Botão clicado!');
  }

  abrirTermo() {
    if (typeof window !== 'undefined'){
      const modalElement = document.getElementById('modalTermo');
      if (modalElement) {
        let modalInstance = M.Modal.getInstance(modalElement);
        if (!modalInstance) {
          modalInstance = M.Modal.init(modalElement);
        }
        modalInstance.open();
        console.log('Modal TCLE aberto');
      } else {
        console.error('Modal não encontrado.');
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
