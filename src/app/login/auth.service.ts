//auth.service.ts

import { Injectable, EventEmitter } from "@angular/core";
import { Usuario } from "./usuario";
import { Router } from "@angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioAutenticado: boolean = false;
  private usuarioLogado: Usuario | null = null;

  mostrarMenuEmitter = new EventEmitter<boolean>();
  usuarioAtualizadoEmitter = new EventEmitter<Usuario>();

  //private readonly apiUrl = 'http://localhost:3000/api';

  private readonly apiUrl = '/api';

  constructor(private readonly router: Router, private readonly http: HttpClient) {
    this.verificarAutenticacao();
  }

  /*initAuth(): void {

    this.verificarAutenticacao();

  }*/

  private verificarAutenticacao(): void {
    if(typeof window !== 'undefined' && typeof localStorage !== 'undefined'){
      const token = localStorage.getItem('token');
      const usuarioLogado = localStorage.getItem('usuarioLogado');

      if(token && usuarioLogado){
        this.usuarioAutenticado = true;
        this.usuarioLogado = JSON.parse(usuarioLogado);
      }
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loginComServidor(dados: { email: string, password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, dados);
  }

  /*fazerLogin(usuario : Usuario): boolean{

    if (usuario.nome === 'usuario@email.com' && usuario.senha === '123456') {
      this.usuarioAutenticado = true;
      this.mostrarMenuEmitter.emit(true);
      this.router.navigate(['/prancha']);
      return true;
    } else {
      this.usuarioAutenticado = false;
      this.mostrarMenuEmitter.emit(false);
      return false;
    }
  }*/

  /*fazerLogin(usuario: any): boolean {
    if (usuario && usuario.token) {
      this.usuarioAutenticado = true;
      localStorage.setItem('token', usuario.token);  // Armazenando o token

      // Salva dados do usuário (se o backend devolver)
      if (usuario.user) {
        this.usuarioLogado = usuario.user;
        localStorage.setItem('usuarioLogado', JSON.stringify(this.usuarioLogado));
      }
      this.mostrarMenuEmitter.emit(true);
      return true;
    } else {
      this.usuarioAutenticado = false;
      this.usuarioLogado = null;
      this.mostrarMenuEmitter.emit(false);
      return false;
    }
  }*/

  atualizarPerfil(dados: { username: string; email: string, fotoPerfil?: string | null }): Observable<any> {
    //return this.http.put(`${this.apiUrl}/user/:id`, dados, { headers: this.getAuthHeaders() });
    const userId = localStorage.getItem('userId');
    return this.http.put(
      `${this.apiUrl}/usuarios/${userId}`, // Usando a rota do item.routes.js
      dados,
      { headers: this.getAuthHeaders() }
    );
  }

  fazerLogin(user: any): boolean {
    if (user && (user.id || user._id)) {
      this.usuarioAutenticado = true;
      
      // Gerar token simples (em produção, use JWT)
      const token = btoa(`${user.email}:${Date.now()}`);
      localStorage.setItem('token', token);

      this.usuarioLogado = {
        id: user.id || user._id,
        username: user.name || user.username,
        email: user.email,
        fotoPerfil: user.fotoPerfil || null,
        token: token
      };

      localStorage.setItem("userId", user.id || user._id);
      localStorage.setItem('usuarioLogado', JSON.stringify(this.usuarioLogado));
      this.mostrarMenuEmitter.emit(true);
      return true;
    } else {
      this.usuarioAutenticado = false;
      this.usuarioLogado = null;
      this.mostrarMenuEmitter.emit(false);
      return false;
    }
  }

  atualizarUsuarioLogado(novosDados: any): void{
    console.log('🔵 atualizarUsuarioLogado chamado com:', novosDados);

    if(this.usuarioLogado){
      this.usuarioLogado.username = novosDados.username;
      this.usuarioLogado.email = novosDados.email;
      this.usuarioLogado.fotoPerfil = novosDados.fotoPerfil;

      console.log('🔵 Usuario atualizado localmente:', this.usuarioLogado);

      // Atualiza o token se vier um novo
      if(novosDados.token) {
        this.usuarioLogado.token = novosDados.token;
        localStorage.setItem('token', novosDados.token);
      }

      localStorage.setItem('usuarioLogado', JSON.stringify(this.usuarioLogado));

      console.log('🔵 Emitindo evento usuarioAtualizadoEmitter');

      this.usuarioAtualizadoEmitter.emit(this.usuarioLogado);

      console.log('🔵 Evento emitido');

    } else {
      console.log('❌ usuarioLogado é null, não pode atualizar');
    }
  }

  getusuarioLogado(): Usuario | null {
    if(!this.usuarioLogado) {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined'){
        const user = localStorage.getItem('usuarioLogado');
        if (user) {
          this.usuarioLogado = JSON.parse(user);
        }
      }
    }
    return this.usuarioLogado;
  }

  usuarioEstaAutenticado(): boolean{
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined'){
      const token = localStorage.getItem('token');
      return this.usuarioAutenticado && !!token;
    }
    return false;
  }

  logout() {
    this.usuarioAutenticado = false;
    this.usuarioLogado = null;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined'){
      localStorage.removeItem('usuarioLogado');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    }
    this.mostrarMenuEmitter.emit(false);
    this.router.navigate(['/login']);
  }

  alterarSenha(dados: { senhaAtual: string; novaSenha: string }): Observable<any> {
    const userId = localStorage.getItem('userId');
    return this.http.put(
      `${this.apiUrl}/usuarios/${userId}/alterar-senha`,
      dados,
      { headers: this.getAuthHeaders() }
    );
  }

}
