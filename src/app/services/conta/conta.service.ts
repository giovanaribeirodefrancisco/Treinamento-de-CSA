// src/app/services/conta/conta.service.ts

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContaService {

  //private readonly apiUrl = 'http://localhost:3000/api';

  private readonly apiUrl = '/api';

  constructor(private readonly http: HttpClient) { }

  public criar(usuario: any): Observable<any> {
    /*const url = 'http://localhost:3000/api/contas'; // Ajuste a URL da sua API

    return this.http.post(url, usuario);*/

    return this.http.post(`${this.apiUrl}/contas`, usuario);

  }

  public login(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, usuario);
  }
}
