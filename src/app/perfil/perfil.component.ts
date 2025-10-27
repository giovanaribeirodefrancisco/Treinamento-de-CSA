// perfil.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../login/auth.service';
import { Usuario } from '../login/usuario';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss'
})
export class PerfilComponent implements OnInit {
  usuario: Usuario & { progresso: number; fotoPerfil?: string | null } = {
    username: '',
    email: '',
    senha: '',
    progresso: 45,
    fotoPerfil: null
  };

  // Dados originais para comparação
  dadosOriginais = {
    username: '',
    email: '',
    fotoPerfil: null as string | null // ✅ Adicione a foto aqui
  };

  // Variáveis para alteração de senha
  modalSenhaAberto = false;
  senhaAtual = '';
  novaSenha = '';
  confirmarNovaSenha = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const logado = this.authService.getusuarioLogado();

    console.log("Usuário retornado pelo AuthService:", logado);

    if (logado) {
      this.usuario = {
        id: logado.id,
        username: logado.username,
        email: logado.email,
        progresso: 45,
        fotoPerfil: logado.fotoPerfil || null // ✅ Carrega foto do localStorage
      };

      // Salva os dados originais incluindo a foto
      this.dadosOriginais = {
        username: this.usuario.username,
        email: this.usuario.email,
        fotoPerfil: this.usuario.fotoPerfil ?? null // ✅ Salva foto original (garante string | null)
      };
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Verifica se é imagem
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      if (typeof window !== 'undefined'){
        const reader = new FileReader();
        reader.onload = (e: any) => {
          // Comprime a imagem
          this.comprimirImagem(e.target.result, 300, 300, (imagemComprimida) => {
            this.usuario.fotoPerfil = imagemComprimida;
            console.log('Foto comprimida, tamanho:', imagemComprimida.length);
          });
        };
        reader.readAsDataURL(file);
      }
    }
  }

  comprimirImagem(src: string, maxWidth: number, maxHeight: number, callback: (result: string) => void): void {

    if (typeof window !== 'undefined'){
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcula novas dimensões mantendo proporção
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Converte para base64 com qualidade reduzida
        const imagemComprimida = canvas.toDataURL('image/jpeg', 0.7);
        callback(imagemComprimida);
      };
      img.src = src;
    }
  }

  abrirModalSenha(): void {
    this.modalSenhaAberto = true;
    this.senhaAtual = '';
    this.novaSenha = '';
    this.confirmarNovaSenha = '';
  }

  fecharModalSenha(): void {
    this.modalSenhaAberto = false;
    this.senhaAtual = '';
    this.novaSenha = '';
    this.confirmarNovaSenha = '';
  }

  confirmarAlteracaoSenha(): void {
    if (!this.senhaAtual || !this.novaSenha || !this.confirmarNovaSenha) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    if (this.novaSenha.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (this.novaSenha !== this.confirmarNovaSenha) {
      alert('As senhas não coincidem');
      return;
    }

    if (this.senhaAtual === this.novaSenha) {
      alert('A nova senha deve ser diferente da senha atual');
      return;
    }

    const dados = {
      senhaAtual: this.senhaAtual,
      novaSenha: this.novaSenha
    };

    this.authService.alterarSenha(dados).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Senha alterada com sucesso! Use a nova senha no próximo login.');
          this.fecharModalSenha();
        } else {
          alert(response.message || 'Erro ao alterar senha');
        }
      },
      error: (error) => {
        console.error('Erro ao alterar senha:', error);
        if (error.error && error.error.message) {
          alert(error.error.message);
        } else {
          alert('Erro ao alterar senha. Tente novamente.');
        }
      }
    });
  }

  salvarPerfil(): void {
    // ✅ Verifica mudanças incluindo a foto
    const houveMudancas =
      this.usuario.username !== this.dadosOriginais.username ||
      this.usuario.email !== this.dadosOriginais.email ||
      this.usuario.fotoPerfil !== this.dadosOriginais.fotoPerfil;

    if (!houveMudancas) {
      alert('Nenhuma alteração foi feita.');
      return;
    }

    if (!this.usuario.username || this.usuario.username.trim().length < 3) {
      alert('Nome de usuário deve ter pelo menos 3 caracteres');
      return;
    }

    if (!this.usuario.email || !this.usuario.email.includes('@')) {
      alert('Email inválido');
      return;
    }

    const dadosAtualizacao = {
      username: this.usuario.username.trim(),
      email: this.usuario.email.trim(),
      fotoPerfil: this.usuario.fotoPerfil // ✅ Envia a foto
    };

    console.log('Enviando dados para atualização:', dadosAtualizacao);

    this.authService.atualizarPerfil(dadosAtualizacao).subscribe({
      next: (response) => {
        if (response.success) {
          this.authService.atualizarUsuarioLogado(response.user);

          // ✅ Atualiza dados originais incluindo a foto
          this.dadosOriginais = {
            username: response.user.username,
            email: response.user.email,
            fotoPerfil: response.user.fotoPerfil
          };

          alert('Perfil atualizado com sucesso!');
          console.log('Perfil salvo com foto:', response.user);
        } else {
          alert(response.message || 'Erro ao atualizar perfil');
        }
      },
      error: (error) => {
        console.error('Erro ao salvar perfil:', error);
        if (error.error && error.error.message) {
          alert(error.error.message);
        } else {
          alert('Erro ao atualizar perfil. Tente novamente.');
        }
      }
    });
  }
}
