import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VideoIntroducaoService {
  private readonly API_URL = '/api/video-introducao';
  private readonly REQUEST_TIMEOUT = 5000;

  constructor(private http: HttpClient) {}

  /**
   * Verifica se o usuário já assistiu ao vídeo
   */
  verificarStatusVideo(): Observable<boolean> {
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('❌ Sem token, usando verificação local');
      return of(this.verificarLocal());
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<any>(`${this.API_URL}`, { headers })
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        map(response => {
          console.log('✅ Status verificado:', response.videoIntroducaoAssistido);
          return response.sucesso && response.videoIntroducaoAssistido;
        }),
        catchError(error => {
          console.error('❌ Erro ao verificar:', error);
          return of(this.verificarLocal());
        })
      );
  }

  /**
   * Marca o vídeo como assistido
   */
  marcarComoAssistido(): Observable<boolean> {
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('⚠️ Sem token, apenas marcando localmente');
      this.marcarLocal();
      return of(true);
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<any>(`${this.API_URL}`, {}, { headers })
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        map(response => {
          if (response.sucesso) {
            console.log('✅ Vídeo marcado como assistido');
            this.marcarLocal();
            return true;
          }
          return false;
        }),
        catchError(error => {
          console.error('❌ Erro ao marcar:', error);
          this.marcarLocal(); // Marca localmente mesmo com erro
          return of(true); // Retorna true para não bloquear
        })
      );
  }

  /**
   * Verifica localmente (fallback)
   */
  private verificarLocal(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('videoIntroducaoAssistido') === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Marca localmente
   */
  private marcarLocal(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('videoIntroducaoAssistido', 'true');
        localStorage.setItem('dataVideoAssistido', new Date().toISOString());
      } catch (error) {
        console.error('Erro ao salvar localmente:', error);
      }
    }
  }
}
