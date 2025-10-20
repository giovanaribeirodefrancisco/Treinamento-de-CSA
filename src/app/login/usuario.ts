// src/app/login/usuario.ts

export class Usuario {

  id?: number;
  username!: string;
  email!: string;
  senha?: string;
  token?: string;
  progresso?: number;
  fotoPerfil?: string | null;

}
