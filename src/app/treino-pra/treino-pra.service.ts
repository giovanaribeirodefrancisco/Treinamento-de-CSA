// src/app/treino-pra/treino-pra.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class TreinoService {
  private url = '/api/progress'; // rota base da API
  //private url = '/api/user'; // rota base da API

  constructor(private http: HttpClient) {}

  // Buscar progresso do usuário
  /*getProgresso(token: string): Observable<Progresso> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<{ progresso?: Progresso }>(`${this.url}/progresso`, { headers })
      .pipe(map(resp => resp.progresso ?? (resp as unknown as Progresso)));
  }*/
  getProgresso(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.url}`, { headers });
  }

  // Salvar progresso do usuário
  /*salvarProgresso(token: string, progresso: Progresso): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/progresso`, progresso, { headers });
  }*/
  salvarProgresso(progresso: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}`, progresso, { headers });
  }
}

export interface Progresso {
  etapaAtual: number;
  dicasUsadas: Record<number, number>;
}
