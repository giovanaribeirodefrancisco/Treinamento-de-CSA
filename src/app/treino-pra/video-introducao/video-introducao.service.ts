/*import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timeout } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VideoIntroducaoService {
  private readonly API_URL = '/api';
  private readonly REQUEST_TIMEOUT = 5000; // 5 segundos de timeout

  constructor(private http: HttpClient) {}

  /**
   * Verifica se o usuário já assistiu ao vídeo introdutório

  verificarVideoAssistido(userId: string): Observable<boolean> {
    return this.http.get<any>(`${this.API_URL}/video-status?userId=${userId}`).pipe(
      timeout(this.REQUEST_TIMEOUT),
      map(response => response.success && response.videoWatched),
      catchError(error => {
        console.error('Erro ao verificar status do vídeo:', error);
        // Em caso de erro, considera como não assistido (fallback seguro)
        return of(false);
      })
    );
  }

  /**
   * Marca o vídeo como assistido

  marcarVideoComoAssistido(userId: string): Observable<boolean> {
    return this.http.post<any>(`${this.API_URL}/video-status`, { userId }).pipe(
      timeout(this.REQUEST_TIMEOUT),
      map(response => response.success),
      catchError(error => {
        console.error('Erro ao marcar vídeo como assistido:', error);
        return of(true); // Retorna true para não bloquear o fluxo
      })
    );
  }

  /**
   * Método para verificação local (fallback)

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
  marcarVideoComoAssistidoLocal(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('videoIntroducaoAssistido', 'true');
        localStorage.setItem('dataVideoAssistido', new Date().toISOString());
      } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
      }
    }
  }

  /**
   * Método MELHORADO: Usa com timeout para não ficar eternamente
  async verificarStatusVideo(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const userId = localStorage.getItem('userId');

    // Se não há userId, usa o cache local
    if (!userId) {
      console.log('❌ Sem userId, usando verificação local');
      return this.verificarVideoAssistidoLocal();
    }

    try {
      console.log('🔍 Verificando status do vídeo no servidor...');

      // Cria uma promise que resolve com timeout
      const promiseComTimeout = new Promise<boolean>((resolve) => {
        const timeoutId = setTimeout(() => {
          console.warn('⏱️ Timeout ao verificar vídeo, usando cache local');
          resolve(this.verificarVideoAssistidoLocal());
        }, this.REQUEST_TIMEOUT);

        this.verificarVideoAssistido(userId).subscribe(
          (result) => {
            clearTimeout(timeoutId);
            console.log('✅ Status do vídeo verificado:', result);
            resolve(result);
          },
          (error) => {
            clearTimeout(timeoutId);
            console.warn('⚠️ Erro ao verificar no servidor, usando cache local:', error);
            resolve(this.verificarVideoAssistidoLocal());
          }
        );
      });

      return await promiseComTimeout;
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      return this.verificarVideoAssistidoLocal();
    }
  }

  /**
   * Método para marcar como assistido (com fallback)
  async marcarComoAssistido(): Promise<void> {
    if (typeof window === 'undefined') return;

    const userId = localStorage.getItem('userId');

    // Marca localmente PRIMEIRO
    this.marcarVideoComoAssistidoLocal();

    // Tenta sincronizar com servidor em background (sem bloquear)
    if (userId) {
      try {
        await new Promise<void>((resolve) => {
          const timeoutId = setTimeout(() => {
            console.warn('⏱️ Timeout ao marcar vídeo no servidor');
            resolve();
          }, this.REQUEST_TIMEOUT);

          this.marcarVideoComoAssistido(userId).subscribe(
            (success) => {
              clearTimeout(timeoutId);
              if (success) {
                console.log('✅ Vídeo marcado como assistido no servidor');
              }
              resolve();
            },
            (error) => {
              clearTimeout(timeoutId);
              console.warn('⚠️ Erro ao marcar no servidor, mantendo local:', error);
              resolve();
            }
          );
        });
      } catch (error) {
        console.error('❌ Erro ao sincronizar:', error);
      }
    }
  }
}
*/
