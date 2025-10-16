// src/app/treino-pra/video-introducao/video-introducao.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VideoIntroducaoService {
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Verifica se o usuário já assistiu ao vídeo introdutório
   */
  verificarVideoAssistido(token: string): Observable<boolean> {
    return this.http.get<any>(`${this.API_URL}/user/video-status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).pipe(
      map(response => response.sucesso && response.videoAssistido),
      catchError(error => {
        console.error('Erro ao verificar status do vídeo:', error);
        return of(false); // Se der erro, assume que não assistiu
      })
    );
  }

  /**
   * Marca o vídeo como assistido
   */
  marcarVideoComoAssistido(token: string): Observable<boolean> {
    return this.http.post<any>(`${this.API_URL}/user/marcar-video-assistido`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).pipe(
      map(response => response.sucesso),
      catchError(error => {
        console.error('Erro ao marcar vídeo como assistido:', error);
        return of(false);
      })
    );
  }

  /**
   * Método para verificação local (fallback caso não tenha conexão)
   */
  verificarVideoAssistidoLocal(): boolean { 
    if (typeof window !== 'undefined'){
      try {
        const videoStatus = localStorage.getItem('videoIntroducaoAssistido');
        return videoStatus === 'true';
      } catch (error) {
        console.error('Erro ao acessar localStorage:', error);
        return false;
      }
    }
    return false; // fallback para SSR
  }

  /**
   * Marca localmente que o vídeo foi assistido
   */
  marcarVideoComoAssistidoLocal(): void {
    if (typeof window !== 'undefined'){
      try {
        localStorage.setItem('videoIntroducaoAssistido', 'true');
        localStorage.setItem('dataVideoAssistido', new Date().toISOString());
      } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
      }
    }
  }

  /**
   * Método combinado que tenta servidor primeiro, depois local
   */
  async verificarStatusVideo(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem('token');

    if (!token) {
      return this.verificarVideoAssistidoLocal();
    }

    try {
      const statusServidor = await this.verificarVideoAssistido(token).toPromise();
      return statusServidor || false;
    } catch (error) {
      console.error('Falha ao verificar no servidor, usando cache local:', error);
      return this.verificarVideoAssistidoLocal();
    }
  }

  /**
   * Método combinado para marcar como assistido
   */
  async marcarComoAssistido(): Promise<void> {
    if (typeof window === 'undefined') return; // SSR fallback


    const token = localStorage.getItem('token');

    // Sempre marca localmente primeiro
    this.marcarVideoComoAssistidoLocal();

    // Tenta marcar no servidor se houver token
    if (token) {
      try {
        await this.marcarVideoComoAssistido(token).toPromise();
        console.log('Vídeo marcado como assistido no servidor');
      } catch (error) {
        console.error('Erro ao marcar no servidor, mantendo apenas local:', error);
      }
    }
  }
}
