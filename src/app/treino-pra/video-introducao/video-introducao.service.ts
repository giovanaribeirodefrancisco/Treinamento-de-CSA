// src/app/treino-pra/video-introducao/video-introducao.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VideoIntroducaoService {
  private readonly API_VIDEO = '/api/video-introducao';
  private readonly API_GET_VIDEO_URL = '/api/get-video-url';
  private readonly API_UPLOAD_VIDEO = '/api/upload-video';
  private readonly REQUEST_TIMEOUT = 10000;

  constructor(private http: HttpClient) {}

  /**
   * Obter URL do vídeo do Vercel Blob
   */
  obterVideoUrl(): Observable<string> {
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('❌ Sem token para obter vídeo');
      return throwError(() => new Error('Token não encontrado'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<any>(`${this.API_GET_VIDEO_URL}`, { headers })
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        map(response => {
          if (response.sucesso && response.videos && response.videos.length > 0) {
            const videoUrl = response.videos[0].url;
            console.log('✅ URL do vídeo obtida:', videoUrl);
            return videoUrl;
          }
          throw new Error('Nenhum vídeo encontrado');
        }),
        catchError(error => {
          console.error('❌ Erro ao obter URL do vídeo:', error);
          return throwError(() => error);
        })
      );
  }

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

    return this.http.get<any>(`${this.API_VIDEO}`, { headers })
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

    return this.http.post<any>(`${this.API_VIDEO}`, {}, { headers })
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
   * Fazer upload de um vídeo para o Vercel Blob
   * @param file Arquivo de vídeo selecionado
   */
  uploadVideo(file: File): Observable<{ url: string; mensagem: string }> {
    const token = localStorage.getItem('token');

    if (!token) {
      return throwError(() => new Error('Token não encontrado'));
    }

    // Validar tamanho (máx 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return throwError(() => new Error('Arquivo muito grande. Máximo permitido: 500MB'));
    }

    const reader = new FileReader();

    return new Observable(observer => {
      reader.onload = (e: any) => {
        try {
          const buffer = e.target.result;
          const filename = `videos/${file.name}-${Date.now()}`;

          const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

          this.http.post<any>(`${this.API_UPLOAD_VIDEO}`, {
            buffer: buffer.toString('base64'),
            filename
          }, { headers })
            .pipe(
              timeout(this.REQUEST_TIMEOUT),
              map(response => {
                if (response.sucesso) {
                  console.log('✅ Vídeo enviado com sucesso:', response.url);
                  return response;
                }
                throw new Error(response.erro || 'Erro ao fazer upload');
              }),
              catchError(error => {
                console.error('❌ Erro no upload:', error);
                return throwError(() => error);
              })
            )
            .subscribe({
              next: (response) => observer.next(response),
              error: (error) => observer.error(error),
              complete: () => observer.complete()
            });
        } catch (error) {
          observer.error(error);
        }
      };

      reader.onerror = () => {
        observer.error(new Error('Erro ao ler o arquivo'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Obter status completo do vídeo (assistido + data)
   */
  obterStatusCompleto(): Observable<{ assistido: boolean; data: Date | null }> {
    const token = localStorage.getItem('token');

    if (!token) {
      return of({
        assistido: this.verificarLocal(),
        data: this.obterDataLocal()
      });
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<any>(`${this.API_VIDEO}`, { headers })
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        map(response => {
          if (response.sucesso) {
            return {
              assistido: response.videoIntroducaoAssistido,
              data: response.dataAssistido ? new Date(response.dataAssistido) : null
            };
          }
          return {
            assistido: this.verificarLocal(),
            data: this.obterDataLocal()
          };
        }),
        catchError(error => {
          console.error('❌ Erro ao obter status completo:', error);
          return of({
            assistido: this.verificarLocal(),
            data: this.obterDataLocal()
          });
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
   * Obter data local de quando assistiu
   */
  private obterDataLocal(): Date | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem('dataVideoAssistido');
      return data ? new Date(data) : null;
    } catch (error) {
      return null;
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
