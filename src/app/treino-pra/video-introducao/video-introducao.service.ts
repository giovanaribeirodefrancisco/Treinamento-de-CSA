// src/app/treino-pra/video-introducao/video-introducao.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VideoIntroducaoService {
  private readonly API_URL = '/api';

  constructor(private http: HttpClient) {}

  /**
   * Verifica se o usuário já assistiu ao vídeo introdutório
   */
  verificarVideoAssistido(userId: string): Observable<boolean> {
    return this.http.get<any>(`${this.API_URL}/video-status?userId=${userId}`).pipe(
      map(response => response.success && response.videoWatched),
      catchError(error => {
        console.error('Erro ao verificar status do vídeo:', error);
        return of(false);
      })
    );
  }

  /**
   * Marca o vídeo como assistido
   */
  marcarVideoComoAssistido(userId: string): Observable<boolean> {
     return this.http.post<any>(`${this.API_URL}/video-status`, { userId }).pipe(
      map(response => response.success),
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
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('videoIntroducaoAssistido') === 'true';
    } catch (error) {
      console.error('Erro ao acessar localStorage:', error);
      return false;
    }
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

    const userId = localStorage.getItem('userId');
    if (!userId) return this.verificarVideoAssistidoLocal();

    try {
      const statusServidor = await this.verificarVideoAssistido(userId).toPromise();
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
    if (typeof window === 'undefined') return;

    const userId = localStorage.getItem('userId');

    // Marca localmente primeiro
    this.marcarVideoComoAssistidoLocal();

    // Sincroniza com o servidor
    if (userId) {
      try {
        await this.marcarVideoComoAssistido(userId).toPromise();
        console.log('Vídeo marcado como assistido no servidor');
      } catch (error) {
        console.error('Erro ao marcar no servidor, mantendo apenas local:', error);
      }
    }
  }
}
