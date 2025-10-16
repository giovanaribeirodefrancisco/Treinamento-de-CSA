import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, QueryList, ViewChildren, AfterViewInit, Renderer2, ChangeDetectorRef } from '@angular/core';
import { EnunciadosComponent } from "./enunciados/enunciados.component";
import { VideoIntroducaoComponent } from './video-introducao/video-introducao.component';
import { VideoIntroducaoService } from './video-introducao/video-introducao.service';
import { BehaviorSubject } from 'rxjs';
import { OnInit, OnDestroy } from '@angular/core';
import { TreinoService } from './treino-pra.service';

@Component({
  selector: 'app-treino-pra',
  standalone: true,
  imports: [CommonModule, EnunciadosComponent, VideoIntroducaoComponent],
  templateUrl: './treino-pra.component.html',
  styleUrl: './treino-pra.component.scss'
})
export class TreinoPraComponent implements OnInit, OnDestroy {
  @Input() etapa: number = 1;
  @Input() userId!: string;
  @Output() respostaCorreta = new EventEmitter<void>();

  mostrarVideoIntroducao: boolean = false;
  carregandoStatusVideo: boolean = true;

  tempoDeEsperaEmSegundos: number = 10;
  timerHandle: any = null;

  textosSelecionados: string[] = [];
  textoExibido: string | null = null;
  categoriaAtual: string = 'todas';
  mostrarDica: boolean = false;
  mensagemFeedback: string = '';
  tipoFeedback: 'sucesso' | 'erro' = 'sucesso';
  mostrarFeedback: boolean = false;

  pictogramaCorreto: string = '';

  private readonly dicaVisibilidadeSource = new BehaviorSubject<boolean>(false);
  dicaVisibilidade$ = this.dicaVisibilidadeSource.asObservable();

  private dicasUtilizadas: Map<number, number> = new Map();
  dicaClicada: boolean = false;

  constructor(private renderer: Renderer2, private treinoService: TreinoService, private cdr: ChangeDetectorRef,
              private videoService: VideoIntroducaoService
  ) {}

  async ngOnInit() {
    console.log('Componente inicializado, etapa inicial:', this.etapa);

    const token = localStorage.getItem('token');
    /*if (token) {
      console.log('Token encontrado, carregando progresso...');
      this.carregarProgresso(token);
    } else {
      console.error("⚠ Nenhum userId encontrado no localStorage!");
      this.etapa = 1;
      this.carregandoStatusVideo = false;
      return;
    }*/
    if (!token) {
      console.error("Nenhum token encontrado no localStorage!");
      this.etapa = 1;
      this.carregandoStatusVideo = false;
      return;
    }


    try {
      // NOVA FUNCIONALIDADE: Verifica se deve mostrar o vídeo introdutório
      console.log('Verificando status do vídeo introdutório...');
      const videoJaAssistido = await this.videoService.verificarStatusVideo();

      if (!videoJaAssistido) {
        console.log('Primeiro acesso - mostrando vídeo introdutório');
        this.mostrarVideoIntroducao = true;
        this.carregandoStatusVideo = false;
        return; // Não carrega o progresso ainda, aguarda o vídeo
      }

      console.log('Vídeo já foi assistido - carregando progresso normal');
      this.mostrarVideoIntroducao = false;
      this.carregandoStatusVideo = false;

      // Carrega o progresso normalmente
      this.carregarProgresso(token);

    } catch (error) {
      console.error('Erro ao verificar status do vídeo:', error);
      this.mostrarVideoIntroducao = false;
      this.carregandoStatusVideo = false;
      this.carregarProgresso(token);
    }


    /*setInterval(() => {
      this.salvarProgresso();
    }, 30000);*/
  }

  async onVideoIntroducaoConcluida() {
    console.log('Vídeo introdutório concluído');

    try {
      // Marca o vídeo como assistido
      await this.videoService.marcarComoAssistido();
      console.log('Vídeo marcado como assistido');

      // Esconde o vídeo e carrega o progresso
      this.mostrarVideoIntroducao = false;

      const token = localStorage.getItem('token');
      if (token) {
        this.carregarProgresso(token);
      } else {
        this.etapa = 1; // Fallback
      }

    } catch (error) {
      console.error('Erro ao marcar vídeo como assistido:', error);
      // Mesmo com erro, continua para o treinamento
      this.mostrarVideoIntroducao = false;
      this.etapa = 1;
    }
  }

  carregarProgresso(token: string) {
    console.log('Iniciando carregamento do progresso...');

    this.treinoService.getProgresso(token).subscribe({
      next: (progresso) => {
        if (progresso) {
          // CORREÇÃO PRINCIPAL: Verifica se etapaAtual existe e é maior que 0
          // Se for 0 ou undefined, começa da questão 1
          if (progresso.etapaAtual && progresso.etapaAtual > 0) {
            this.etapa = progresso.etapaAtual;
            console.log('Etapa restaurada do progresso salvo:', this.etapa);
          } else {
            this.etapa = 1; // Primeira questão
            console.log('Iniciando da primeira questão (etapaAtual era 0 ou undefined)');
          }

          // Carrega as dicas utilizadas
          this.dicasUtilizadas = new Map(
            Object.entries(progresso.dicasUsadas || {}).map(([k, v]) => [Number(k), Number(v)])
          );

          console.log('Progresso completo carregado:', {
            etapaAtual: progresso.etapaAtual,
            etapaDefinida: this.etapa,
            dicasUsadas: progresso.dicasUsadas,
            dicasUtilizadasMap: Object.fromEntries(this.dicasUtilizadas)
          });

          // Força a atualização da view se necessário
          setTimeout(() => {
            console.log('Etapa atual após carregamento:', this.etapa);
            this.cdr.detectChanges();
          }, 100);

        } else {
          console.log('Nenhum progresso encontrado, iniciando da primeira questão');
          this.etapa = 1;
          this.dicasUtilizadas = new Map();
        }
      },
      error: (err) => {
        console.error('Erro ao carregar progresso:', err);
        // Em caso de erro, começa da primeira questão
        this.etapa = 1;
        this.dicasUtilizadas = new Map();
        console.log('Definindo etapa como 1 devido ao erro');
      }
    });
  }

  limparDestaques() {
    const elementos = document.querySelectorAll('[data-texto]');
    elementos.forEach(el => {
      this.renderer.removeClass(el, 'destaque-dica');
    });
  }

  dica() {
    const dicasAtuais = this.dicasUtilizadas.get(this.etapa) || 0;
    this.dicasUtilizadas.set(this.etapa, dicasAtuais + 1);

    // Marcar que a dica foi clicada nesta questão
    this.dicaClicada = true;

    console.log(`Dica clicada ${dicasAtuais + 1} vez(es) na etapa ${this.etapa}`);

    this.mostrarDica = !this.mostrarDica;
    this.dicaVisibilidadeSource.next(this.mostrarDica);

    if (!this.mostrarDica) {
      this.limparDestaques();
      return;
    }

    if (this.etapa === 1) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Você';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Você') {
        this.pictogramaCorreto = 'Querer';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Você' && this.textosSelecionados[1] === 'Querer') {
        this.pictogramaCorreto = 'Ajuda';
      }
    }
    else if (this.etapa === 2) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Eu';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Eu') {
        this.pictogramaCorreto = 'Ser';
      }
    } else if (this.etapa === 3) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Qual';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Qual') {
        this.pictogramaCorreto = 'Ser';
      }
    } else if (this.etapa === 4) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Não';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Não') {
        this.pictogramaCorreto = 'Pode';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Não' && this.textosSelecionados[1] === 'Pode') {
        this.pictogramaCorreto = 'Conversar';
      }
    } else if (this.etapa === 5) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Quem';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Quem') {
        this.pictogramaCorreto = 'Querer';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Quem' && this.textosSelecionados[1] === 'Querer') {
        this.pictogramaCorreto = 'Sair';
      } else if (this.textosSelecionados.length === 3 && this.textosSelecionados[0] === 'Quem' && this.textosSelecionados[1] === 'Querer' && this.textosSelecionados[2] === 'Sair') {
        this.pictogramaCorreto = 'Pode';
      } else if (this.textosSelecionados.length === 4 && this.textosSelecionados[0] === 'Quem' && this.textosSelecionados[1] === 'Querer' && this.textosSelecionados[2] === 'Sair' && this.textosSelecionados[3] === 'Pode') {
        this.pictogramaCorreto = 'Ajuda';
      }
    } else if (this.etapa === 6) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Eu';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Eu') {
        this.pictogramaCorreto = 'Estar';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Eu' && this.textosSelecionados[1] === 'Estar') {
        this.pictogramaCorreto = 'Aqui';
      } else if (this.textosSelecionados.length === 3 && this.textosSelecionados[0] === 'Eu' && this.textosSelecionados[1] === 'Estar' && this.textosSelecionados[2] === 'Aqui') {
        this.pictogramaCorreto = 'para';
      } else if (this.textosSelecionados.length === 4 && this.textosSelecionados[0] === 'Eu' && this.textosSelecionados[1] === 'Estar' && this.textosSelecionados[2] === 'Aqui' && this.textosSelecionados[3] === 'para') {
        this.pictogramaCorreto = 'Ajuda';
      } else if (this.textosSelecionados.length === 5 && this.textosSelecionados[0] === 'Eu' && this.textosSelecionados[1] === 'Estar' && this.textosSelecionados[2] === 'Aqui' && this.textosSelecionados[3] === 'para' && this.textosSelecionados[4] === 'Ajuda') {
        this.pictogramaCorreto = 'Você';
      }
    } else if (this.etapa === 7) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Agora';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Agora') {
        this.pictogramaCorreto = 'Você';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Agora' && this.textosSelecionados[1] === 'Você') {
        this.pictogramaCorreto = 'Pode';
      } else if (this.textosSelecionados.length === 3 && this.textosSelecionados[0] === 'Agora' && this.textosSelecionados[1] === 'Você' && this.textosSelecionados[2] === 'Pode') {
        this.pictogramaCorreto = 'Abrir';
      }
    } else if (this.etapa === 8) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Você';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Você') {
        this.pictogramaCorreto = 'Pode';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Você' && this.textosSelecionados[1] === 'Pode') {
        this.pictogramaCorreto = 'Querer';
      } else if (this.textosSelecionados.length === 3 && this.textosSelecionados[0] === 'Você' && this.textosSelecionados[1] === 'Pode' && this.textosSelecionados[2] === 'Querer') {
        this.pictogramaCorreto = 'Ajuda';
      } else if (this.textosSelecionados.length === 4 && this.textosSelecionados[0] === 'Você' && this.textosSelecionados[1] === 'Pode' && this.textosSelecionados[2] === 'Querer' && this.textosSelecionados[3] === 'Ajuda') {
        this.pictogramaCorreto = 'Eu';
      } else if (this.textosSelecionados.length === 5 && this.textosSelecionados[0] === 'Você' && this.textosSelecionados[1] === 'Pode' && this.textosSelecionados[2] === 'Querer' && this.textosSelecionados[3] === 'Ajuda' && this.textosSelecionados[4] === 'Eu') {
        this.pictogramaCorreto = 'Estar';
      } else if (this.textosSelecionados.length === 6 && this.textosSelecionados[0] === 'Você' && this.textosSelecionados[1] === 'Pode' && this.textosSelecionados[2] === 'Querer' && this.textosSelecionados[3] === 'Ajuda' && this.textosSelecionados[4] === 'Eu' && this.textosSelecionados[5] === 'Estar') {
        this.pictogramaCorreto = 'Aqui';
      }
    } else if (this.etapa === 9) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Quem';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Quem') {
        this.pictogramaCorreto = 'Gosta';
      }
    } else if (this.etapa === 10) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Você';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Você') {
        this.pictogramaCorreto = 'Querer';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Você' && this.textosSelecionados[1] === 'Querer') {
        this.pictogramaCorreto = 'Mais';
      } else if (this.textosSelecionados.length === 3 && this.textosSelecionados[0] === 'Você' && this.textosSelecionados[1] === 'Querer' && this.textosSelecionados[2] === 'Mais') {
        this.pictogramaCorreto = 'Agora';
      }
    } else if (this.etapa === 11) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Você';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Você') {
        this.pictogramaCorreto = 'Querer';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Você' && this.textosSelecionados[1] === 'Querer') {
        this.pictogramaCorreto = 'Mais';
      }
    } else if (this.etapa === 12) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Você';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Você') {
        this.pictogramaCorreto = 'Não';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Você' && this.textosSelecionados[1] === 'Não') {
        this.pictogramaCorreto = 'Querer';
      } else if (this.textosSelecionados.length === 3 && this.textosSelecionados[0] === 'Você' && this.textosSelecionados[1] === 'Não' && this.textosSelecionados[2] === 'Querer') {
        this.pictogramaCorreto = 'Mais';
      }
    } else if (this.etapa === 13) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Agora';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Agora') {
        this.pictogramaCorreto = 'Em cima';
      }
    } else if (this.etapa === 14) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Quando';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Quando') {
        this.pictogramaCorreto = 'Acabar';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Quando' && this.textosSelecionados[1] === 'Acabar') {
        this.pictogramaCorreto = 'Você';
      } else if (this.textosSelecionados.length === 3 && this.textosSelecionados[0] === 'Quando' && this.textosSelecionados[1] === 'Acabar' && this.textosSelecionados[2] === 'Você') {
        this.pictogramaCorreto = 'Pode';
      } else if (this.textosSelecionados.length === 4 && this.textosSelecionados[0] === 'Quando' && this.textosSelecionados[1] === 'Acabar' && this.textosSelecionados[2] === 'Você' && this.textosSelecionados[3] === 'Pode') {
        this.pictogramaCorreto = 'Sair';
      } else if (this.textosSelecionados.length === 5 && this.textosSelecionados[0] === 'Quando' && this.textosSelecionados[1] === 'Acabar' && this.textosSelecionados[2] === 'Você' && this.textosSelecionados[3] === 'Pode' && this.textosSelecionados[4] === 'Sair') {
        this.pictogramaCorreto = 'para';
      } else if (this.textosSelecionados.length === 6 && this.textosSelecionados[0] === 'Quando' && this.textosSelecionados[1] === 'Acabar' && this.textosSelecionados[2] === 'Você' && this.textosSelecionados[3] === 'Pode' && this.textosSelecionados[4] === 'Sair' && this.textosSelecionados[5] === 'para') {
        this.pictogramaCorreto = 'Comer';
      }
    } else if (this.etapa === 15) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Nós';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Nós') {
        this.pictogramaCorreto = 'Ir';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Nós' && this.textosSelecionados[1] === 'Ir') {
        this.pictogramaCorreto = 'Sair';
      } else if (this.textosSelecionados.length === 3 && this.textosSelecionados[0] === 'Nós' && this.textosSelecionados[1] === 'Ir' && this.textosSelecionados[2] === 'Sair') {
        this.pictogramaCorreto = 'Agora';
      } else if (this.textosSelecionados.length === 4 && this.textosSelecionados[0] === 'Nós' && this.textosSelecionados[1] === 'Ir' && this.textosSelecionados[2] === 'Sair' && this.textosSelecionados[3] === 'Agora') {
        this.pictogramaCorreto = 'para';
      } else if (this.textosSelecionados.length === 5 && this.textosSelecionados[0] === 'Nós' && this.textosSelecionados[1] === 'Ir' && this.textosSelecionados[2] === 'Sair' && this.textosSelecionados[3] === 'Agora' && this.textosSelecionados[4] === 'para') {
        this.pictogramaCorreto = 'Fazer';
      } else if (this.textosSelecionados.length === 6 && this.textosSelecionados[0] === 'Nós' && this.textosSelecionados[1] === 'Ir' && this.textosSelecionados[2] === 'Sair' && this.textosSelecionados[3] === 'Agora' && this.textosSelecionados[4] === 'para' && this.textosSelecionados[5] === 'Fazer') {
        this.pictogramaCorreto = 'Diferente';
      }
    } else if (this.etapa === 16) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Qual';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Qual') {
        this.pictogramaCorreto = 'Nós';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Qual' && this.textosSelecionados[1] === 'Nós') {
        this.pictogramaCorreto = 'Ir';
      }
    } else if (this.etapa === 17) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Qual';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Qual') {
        this.pictogramaCorreto = 'Você';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Qual' && this.textosSelecionados[1] === 'Você') {
        this.pictogramaCorreto = 'Querer';
      }
    } else if (this.etapa === 18) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Nós';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Nós') {
        this.pictogramaCorreto = 'Ir';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Nós' && this.textosSelecionados[1] === 'Ir') {
        this.pictogramaCorreto = 'para';
      }
    } else if (this.etapa === 19) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Você';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Você') {
        this.pictogramaCorreto = 'Gosta';
      }
    } else if (this.etapa === 20) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Quando';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Quando') {
        this.pictogramaCorreto = 'Você';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Quando' && this.textosSelecionados[1] === 'Você') {
        this.pictogramaCorreto = 'Querer';
      } else if (this.textosSelecionados.length === 3 && this.textosSelecionados[0] === 'Quando' && this.textosSelecionados[1] === 'Você' && this.textosSelecionados[2] === 'Querer') {
        this.pictogramaCorreto = 'Fazer';
      } else if (this.textosSelecionados.length === 4 && this.textosSelecionados[0] === 'Quando' && this.textosSelecionados[1] === 'Você' && this.textosSelecionados[2] === 'Querer' && this.textosSelecionados[3] === 'Fazer') {
        this.pictogramaCorreto = 'Outro';
      } else if (this.textosSelecionados.length === 5 && this.textosSelecionados[0] === 'Quando' && this.textosSelecionados[1] === 'Você' && this.textosSelecionados[2] === 'Querer' && this.textosSelecionados[3] === 'Fazer' && this.textosSelecionados[4] === 'Outro') {
        this.pictogramaCorreto = 'Fora';
      }
    } else if (this.etapa === 21) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Eu';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Eu') {
        this.pictogramaCorreto = 'Gosta';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Eu' && this.textosSelecionados[1] === 'Gosta') {
        this.pictogramaCorreto = 'De';
      } else if (this.textosSelecionados.length === 3 && this.textosSelecionados[0] === 'Eu' && this.textosSelecionados[1] === 'Gosta' && this.textosSelecionados[2] === 'De') {
        this.pictogramaCorreto = 'Fazer';
      }
    } else if (this.etapa === 22) {
      if (this.textosSelecionados.length === 0) {
        this.pictogramaCorreto = 'Nós';
      } else if (this.textosSelecionados.length === 1 && this.textosSelecionados[0] === 'Nós') {
        this.pictogramaCorreto = 'Acabar';
      } else if (this.textosSelecionados.length === 2 && this.textosSelecionados[0] === 'Nós' && this.textosSelecionados[1] === 'Acabar') {
        this.pictogramaCorreto = 'Sair';
      }
    }

    this.limparDestaques();

    const elementos = document.querySelectorAll('[data-texto]');

    console.log('Elementos encontrados:', elementos.length);

    elementos.forEach(el => {
      const texto = el.getAttribute('data-texto');
      console.log('Texto do elemento:', texto);

      if (texto === this.pictogramaCorreto) {
        console.log('Aplicando destaque no pictograma', texto);
        this.renderer.addClass(el, 'destaque-dica');
      }
    });
  }

  getQuantidadeDicasUsadas(etapa: number): number {
    return this.dicasUtilizadas.get(etapa) || 0;
  }

  // Método para verificar se a dica foi usada na etapa atual
  isDicaUsadaNaEtapaAtual(): boolean {
    return this.dicaClicada;
  }

  // Método para obter dados completos de uso de dicas
  getDadosUsoDesDicas(): { etapa: number, quantidade: number }[] {
    const dados: { etapa: number, quantidade: number }[] = [];
    this.dicasUtilizadas.forEach((quantidade, etapa) => {
      dados.push({ etapa, quantidade: quantidade });
    });
    return dados;
  }

  esconderDica() {
    this.mostrarDica = false;
    this.dicaVisibilidadeSource.next(false);
    this.limparDestaques();
  }

  conjugacoes: { [verbo: string]: { [pronome: string]: string } } = {
    'Querer': { 'Eu': 'quero', 'Você': 'quer', 'Ele': 'quer', 'Ela': 'quer', 'Nós': 'queremos', 'Eles': 'querem', 'Elas': 'querem' },
    'Estar': { 'Eu': 'estou', 'Você': 'está', 'Ele': 'está', 'Ela': 'está', 'Nós': 'estamos', 'Eles': 'estão', 'Elas': 'estão' },
    'Ser': { 'Eu': 'sou', 'Você': 'é', 'Ele': 'é', 'Ela': 'é', 'Nós': 'somos', 'Eles': 'são', 'Elas': 'são' },
    'Ter': { 'Eu': 'tenho', 'Você': 'tem', 'Ele': 'tem', 'Ela': 'tem', 'Nós': 'temos', 'Eles': 'têm', 'Elas': 'têm' },
    'Ir': { 'Eu': 'vou', 'Você': 'vai', 'Ele': 'vai', 'Ela': 'vai', 'Nós': 'vamos', 'Eles': 'vão', 'Elas': 'vão' },
    'Vir': { 'Eu': 'venho', 'Você': 'vem', 'Ele': 'vem', 'Ela': 'vem', 'Nós': 'vimos', 'Eles': 'vêm', 'Elas': 'vêm' },
    'Jogar': { 'Eu': 'jogo', 'Você': 'joga', 'Ele': 'joga', 'Ela': 'joga', 'Nós': 'jogamos', 'Eles': 'jogam', 'Elas': 'jogam' },
    'Abrir': { 'Eu': 'abro', 'Você': 'abre', 'Ele': 'abre', 'Ela': 'abre', 'Nós': 'abrimos', 'Eles': 'abrem', 'Elas': 'abrem' },
    'Brincar': { 'Eu': 'brinco', 'Você': 'brinca', 'Ele': 'brinca', 'Ela': 'brinca', 'Nós': 'brincamos', 'Eles': 'brincam', 'Elas': 'brincam' },
    'Pegar': { 'Eu': 'pego', 'Você': 'pega', 'Ele': 'pega', 'Ela': 'pega', 'Nós': 'pegamos', 'Eles': 'pegam', 'Elas': 'pegam' },
    'Comer': { 'Eu': 'como', 'Você': 'come', 'Ele': 'come', 'Ela': 'come', 'Nós': 'comemos', 'Eles': 'comem', 'Elas': 'comem' },
    'Sentir': { 'Eu': 'sinto', 'Você': 'sente', 'Ele': 'sente', 'Ela': 'sente', 'Nós': 'sentimos', 'Eles': 'sentem', 'Elas': 'sentem' },
    'Fazer': { 'Eu': 'faço', 'Você': 'faz', 'Ele': 'faz', 'Ela': 'faz', 'Nós': 'fazemos', 'Eles': 'fazem', 'Elas': 'fazem' },
    'Entrar': { 'Eu': 'entro', 'Você': 'entra', 'Ele': 'entra', 'Ela': 'entra', 'Nós': 'entramos', 'Eles': 'entram', 'Elas': 'entram' },
    'Beber': { 'Eu': 'bebo', 'Você': 'bebe', 'Ele': 'bebe', 'Ela': 'bebe', 'Nós': 'bebemos', 'Eles': 'bebem', 'Elas': 'bebem' },
    'Acabar': { 'Eu': 'acabo', 'Você': 'acaba', 'Ele': 'acaba', 'Ela': 'acaba', 'Nós': 'acabamos', 'Eles': 'acabam', 'Elas': 'acabam' },
    'Parar': { 'Eu': 'paro', 'Você': 'para', 'Ele': 'para', 'Ela': 'para', 'Nós': 'paramos', 'Eles': 'param', 'Elas': 'param' },
    'Sair': { 'Eu': 'saio', 'Você': 'sai', 'Ele': 'sai', 'Ela': 'sai', 'Nós': 'saímos', 'Eles': 'saem', 'Elas': 'saem' },
    'Gosta': { 'Eu': 'gosto', 'Você': 'gosta', 'Ele': 'gosta', 'Ela': 'gosta', 'Nós': 'gostamos', 'Eles': 'gostam', 'Elas': 'gostam' },
    'Assistir': { 'Eu': 'assisto', 'Você': 'assiste', 'Ele': 'assiste', 'Ela': 'assiste', 'Nós': 'assistimos', 'Eles': 'assistem', 'Elas': 'assistem' },
    'Passear': { 'Eu': 'passeio', 'Você': 'passeia', 'Ele': 'passeia', 'Ela': 'passeia', 'Nós': 'passeamos', 'Eles': 'passeiam', 'Elas': 'passeiam' },
    'Ajuda': { 'Eu': 'ajudo', 'Você': 'ajuda', 'Ele': 'ajuda', 'Ela': 'ajuda', 'Nós': 'ajudamos', 'Eles': 'ajudam', 'Elas': 'ajudam' },
    'Conversar': { 'Eu': 'converso', 'Você': 'conversa', 'Ele': 'conversa', 'Ela': 'conversa', 'Nós': 'conversamos', 'Eles': 'conversam', 'Elas': 'conversam' },
    'Pode': { 'Eu': 'posso', 'Você': 'pode', 'Ele': 'pode', 'Ela': 'pode', 'Nós': 'podemos', 'Eles': 'podem', 'Elas': 'podem' }
  };

  gerundios: { [verbo: string]: string } = {
    'Querer': 'querendo',
    'Ser': 'sendo',
    'Ter': 'tendo',
    'Ir': 'indo',
    'Vir': 'vindo',
    'Jogar': 'jogando',
    'Abrir': 'abrindo',
    'Brincar': 'brincando',
    'Pegar': 'pegando',
    'Comer': 'comendo',
    'Sentir': 'sentindo',
    'Fazer': 'fazendo',
    'Entrar': 'entrando',
    'Beber': 'bebendo',
    'Acabar': 'acabando',
    'Parar': 'parando',
    'Sair': 'saindo',
    'Gosta': 'gostando',
    'Assistir': 'assistindo',
    'Passear': 'passeando',
    'Ajuda': 'ajudando',
    'Conversar': 'conversando',
    'Pode': 'podendo'
  };


  palavras: {
    pronomes: string[],
    verbos: string[],
    auxiliares: string[],
    interrogativas: string[],
    negacoes: string[],
    conectivos: string[],
    afirmacoes: string[],
    artigos: string[],
    outros: string[]
  } = {
    pronomes: ['Eu', 'Você', 'Ele', 'Ela', 'Nós', 'Eles', 'Elas'],
    verbos: Object.keys(this.conjugacoes),
    auxiliares: ['Querer', 'Estar', 'Ser', 'Ter', 'Ir', 'Vir', 'Pode'],
    interrogativas: ['Por que', 'Qual', 'Onde', 'Quando', 'Quem', 'O que'],
    negacoes: ['Não'],
    conectivos: ['E', 'Mas', 'Porque', 'para', 'Com', 'De'],
    afirmacoes: ['Sim', 'Mais'],
    artigos: ['O', 'A'],
    outros: ['Agora', 'Depois', 'Aqui', 'Ali', 'Embaixo', 'Em cima', 'Igual', 'Diferente', 'Dentro', 'Fora', 'Outros']
  };

  mostrarTextoESom(texto: string) {
    const index = this.textosSelecionados.indexOf(texto);

    if (index > -1) {
      this.textosSelecionados.splice(index, 1);
    } else {
      this.textosSelecionados.push(texto);
    }

    this.gerarFraseEFala();

    if (this.mostrarDica) {
      this.atualizarDestaquesDica();
    }

    // Salvar progresso automaticamente a cada interação
    //this.salvarProgresso();
  }

  atualizarDestaquesDica(){

    this.limparDestaques();

    this.mostrarDica = false;
    this.dicaVisibilidadeSource.next(false);
  }


  /*gerarFraseEFala() {
    if (this.textosSelecionados.length === 0) {
      this.textoExibido = null;
      return;
    }

    // Análise dos componentes selecionados
    const pronomes = this.palavras.pronomes;
    const verbos = this.palavras.verbos;
    const verbosAuxiliares = this.palavras.auxiliares;
    const negacoes = this.palavras.negacoes;
    const interrogativas = this.palavras.interrogativas;
    const conectivos = this.palavras.conectivos;
    const afirmacoes = this.palavras.afirmacoes;
    const artigos = this.palavras.artigos;
    const outros = this.palavras.outros;

    // Encontrar o primeiro pronome e verbo
    const pronomesSelecionados = this.textosSelecionados.filter(t => pronomes.includes(t));
    const verbosSelecionados = this.textosSelecionados.filter(t => verbos.includes(t));
    const negacaoSelecionada = this.textosSelecionados.find(t => negacoes.includes(t));
    const interrogativaSelecionada = this.textosSelecionados.find(t => interrogativas.includes(t));
    const comSelecionado = this.textosSelecionados.includes("Com");
    const conectivoSelecionado = this.textosSelecionados.find(t => conectivos.includes(t));
    const afirmacaoSelecionada = this.textosSelecionados.find(t => afirmacoes.includes(t));
    const artigoSelecionado = this.textosSelecionados.find(t => artigos.includes(t));
    const outroSelecionado = this.textosSelecionados.find(t => outros.includes(t));

    // Verbos em ordem de seleção
    const verboPrincipal = verbosSelecionados.length > 0 ? verbosSelecionados[0] : undefined;
    const verboSecundario = verbosSelecionados.length > 1 ? verbosSelecionados[1] : undefined;
    const verboTerciario = verbosSelecionados.length > 2 ? verbosSelecionados[2] : undefined;

    // Complementos (outros itens que não são pronomes, verbos, etc)
    const complementos = this.textosSelecionados.filter(
      t => !pronomes.includes(t) &&
           !verbos.includes(t) &&
           !negacoes.includes(t) &&
           !interrogativas.includes(t) &&
           !conectivos.includes(t) &&
           !afirmacoes.includes(t) &&
           !artigos.includes(t) &&
           !outros.includes(t)
    );

    let frase = '';

    // Caso específico para o conectivo "com"
    if (comSelecionado && pronomesSelecionados.length > 0) {
      // Índice do conectivo "com" nos textos selecionados
      const comIndex = this.textosSelecionados.indexOf("Com");

      // Determinar quais pronomes vêm antes e depois do "com"
      const pronomesAntes = [];
      const pronomeDepois = [];

      for (const pronome of pronomesSelecionados) {
        const pronomeIndex = this.textosSelecionados.indexOf(pronome);
        if (pronomeIndex < comIndex) {
          pronomesAntes.push(pronome);
        } else if (pronomeIndex > comIndex) {
          pronomeDepois.push(pronome);
        }
      }

      // Se temos pronomes antes e depois do "com", criamos a frase adequadamente
      if (pronomesAntes.length > 0 && pronomeDepois.length > 0 && verboPrincipal) {
        const pronomeAntes = pronomesAntes[0]; // Pegamos o primeiro pronome antes do "com"
        const verboConjugado = this.conjugacoes[verboPrincipal][pronomeAntes];

        frase = `${pronomeAntes} ${verboConjugado} Com ${pronomeDepois.join(' ')}`;

        // Adicionar complementos, se houver
        if (complementos.length > 0) {
          frase += ' ' + complementos.join(' ');
        }

        this.textoExibido = frase;
        this.falarTexto(frase);
        return;
      }
    }

    // Frases interrogativas
    if (interrogativaSelecionada) {
      frase = `${interrogativaSelecionada} `;

      // CASO ESPECIAL: "Qual" + "Ser" = "Qual seu?"
      if (interrogativaSelecionada === 'Qual' && verboPrincipal === 'Ser') {
        frase = 'Qual seu?';
      }

      else{
        frase = `${interrogativaSelecionada} `;
        if (pronomesSelecionados.length > 0) {
          frase += pronomesSelecionados[0] + ' ';
        }

        if (negacaoSelecionada) {
          frase += negacaoSelecionada + ' ';
        }

        if (verboPrincipal && pronomesSelecionados.length > 0) {
          const verboConjugado = this.conjugacoes[verboPrincipal][pronomesSelecionados[0]];
          frase += verboConjugado + ' ';

          if(verboPrincipal === 'Estar'){
            if (verboSecundario) {
              const verboGerundio = this.gerundios[verboSecundario];
              if(verboGerundio) {
                frase += verboGerundio + ' ';

                if(verboTerciario){
                  frase += verboTerciario.toLowerCase() + ' ';
                }
              }
            }
          }
          else if (verboSecundario) {
            if (verbosAuxiliares.includes(verboPrincipal)) {
              frase += verboSecundario.toLowerCase() + ' ';

              if(verboTerciario){
                frase += verboTerciario.toLowerCase() + ' ';
              }
            } else {
              const verboSecConjugado = this.conjugacoes[verboSecundario][pronomesSelecionados[0]];
              frase += verboSecConjugado + ' ';

              if(verboTerciario){
                frase += verboTerciario.toLowerCase() + ' ';
              }
            }
          }
        } else if (verboPrincipal) {
          frase += verboPrincipal.toLowerCase() + ' ';

          if (verboSecundario){
            frase += verboSecundario.toLowerCase() + ' ';

            if(verboTerciario){
              frase += verboTerciario.toLowerCase() + ' ';
            }
          }
        }

        if (complementos.length > 0) {
          frase += complementos.join(' ') + ' ';
        }

        frase = frase.trim() + '?';
      }
    }
    // Frases declarativas com pronome e verbo
    else if (pronomesSelecionados.length > 0 && verboPrincipal) {
      // Frases declarativas ou negativas
      const conjugacoes = pronomesSelecionados.map(pronome => {
        let fragmento = `${pronome} `;
        if (negacaoSelecionada) {
          fragmento += `${negacaoSelecionada} `;
        }

        // Garante que estamos acessando a conjugação correta para este pronome
        const verboConjugado = this.conjugacoes[verboPrincipal][pronome];
        fragmento += verboConjugado + ' ';

        if (verboPrincipal === 'Estar') {
          if (verboSecundario) {
            const verboGerundio = this.gerundios[verboSecundario];
            if (verboGerundio) {
              fragmento += verboGerundio + ' ';

              if (verboTerciario) {
                fragmento += verboTerciario.toLowerCase() + ' ';
              }
            } else {
              fragmento += verboSecundario.toLowerCase() + ' ';
            }
          }
        }
        else if (verboSecundario) {
          if (verbosAuxiliares.includes(verboPrincipal)) {
            fragmento += verboSecundario.toLowerCase() + ' ';

            if (verboTerciario) {
              fragmento += verboTerciario.toLowerCase() + ' ';
            }
          } else {
            const verboSecConjugado = this.conjugacoes[verboSecundario][pronome];
            fragmento += verboSecConjugado + ' ';

            if (verboTerciario) {
              fragmento += verboTerciario.toLowerCase() + ' ';
            }
          }
        }

        if (conectivoSelecionado && conectivoSelecionado !== "Com") {
          fragmento += conectivoSelecionado + ' ';
        }

        if (complementos.length > 0) {
          fragmento += complementos.join(' ') + ' ';
        }
        return fragmento.trim();
      });

      frase = conjugacoes.join(' E ');
    }
    // Caso com conectivo (exceto "com" que já foi tratado acima)
    else if (conectivoSelecionado && this.textosSelecionados.length > 0 && conectivoSelecionado !== "Com") {
      // Reorganizamos a lógica para evitar duplicação do conectivo
      const textosSemConectivo = this.textosSelecionados.filter(t => t !== conectivoSelecionado);
      frase = textosSemConectivo.join(' ') + ' ' + conectivoSelecionado;

      if (complementos.length > 0) {
        frase += ' ' + complementos.join(' ');
      }
    }
    // Caso simples: apenas juntar os textos selecionados
    else {
      frase = this.textosSelecionados.join(' ');
    }

    this.textoExibido = frase;
    this.falarTexto(frase);
  }*/

  /*gerarFraseEFala() {
    if (this.textosSelecionados.length === 0) {
      this.textoExibido = null;
      return;
    }

    const { pronomes, verbos, negacoes, interrogativas, conectivos, afirmacoes, artigos, outros } = this.palavras;

    const pronomesSelecionados = this.textosSelecionados.filter(t => pronomes.includes(t));
    const verbosSelecionados = this.textosSelecionados.filter(t => verbos.includes(t));
    const negacaoSelecionada = this.textosSelecionados.find(t => negacoes.includes(t));
    const interrogativaSelecionada = this.textosSelecionados.find(t => interrogativas.includes(t));
    const conectivoSelecionado = this.textosSelecionados.find(t => conectivos.includes(t));

    const verboPrincipal = verbosSelecionados[0];
    const verboSecundario = verbosSelecionados[1];
    const verboTerciario = verbosSelecionados[2];

    // === ALTERAÇÃO 1: agora complementos INCLUEM tokens de 'outros', 'conectivos', 'afirmacoes', 'artigos'
    // Mantemos a ordem de seleção; excluímos apenas pronomes / verbos / negações / interrogativas
    const complementos = this.textosSelecionados.filter(t =>
      !pronomes.includes(t) &&
      !verbos.includes(t) &&
      !negacoes.includes(t) &&
      !interrogativas.includes(t)
    );
    // === FIM ALTERAÇÃO 1

    const lc = (s: string) => s ? s.toLowerCase() : '';
    const conjugar = (verbo: string, pronome: string) => {
      // usa o pronome original (ex: "Você", "Eu") para buscar conjugação no this.conjugacoes
      if (!verbo) return '';
      const conj = this.conjugacoes[verbo]?.[pronome];
      return conj ? conj : verbo.toLowerCase();
    };

    // === ALTERAÇÃO 2: incluí 'de' entre os "locativos/preposições" para que seja tratado antes do verbo secundário
    const LOCATIVOS = new Set(['de','para','aqui','ali','em cima','embaixo','dentro','fora','embaixo','emcima']);
    // === FIM ALTERAÇÃO 2

    const complementosLower = complementos.map(c => lc(c));
    const temLocativo = complementosLower.some(c => LOCATIVOS.has(c));

    let partes: string[] = [];

    // === INTERROGATIVAS (sempre no início) ===
    if (interrogativaSelecionada) {
      // caso especial "Qual" + "Ser" -> "Qual seu"
      if (interrogativaSelecionada === 'Qual' && verboPrincipal === 'Ser') {
        partes = ['qual', 'seu'];
      } else {
        partes.push(lc(interrogativaSelecionada)); // ex: "quando", "onde", "por que", "qual"

        // mostrar pronome mesmo que ainda não exista verbo (resolve "Quando" + "Você")
        if (pronomesSelecionados.length > 0) {
          const pronomeOriginal = pronomesSelecionados[0];
          partes.push(lc(pronomeOriginal));
        }

        if (negacaoSelecionada) partes.push(lc(negacaoSelecionada));

        // verbo principal conjugado (só se existir)
        if (verboPrincipal && pronomesSelecionados.length > 0) {
          const pronomeOriginal = pronomesSelecionados[0];
          partes.push(conjugar(verboPrincipal, pronomeOriginal)); // já vem em minúscula pelas conjugações
        } else if (verboPrincipal && pronomesSelecionados.length === 0) {
          // sem pronome: mostra o verbo no infinitivo/minúsculo (fallback)
          partes.push(lc(verboPrincipal));
        }

        // agora posicionamento de complemento vs verbo secundário
        if (verboSecundario) {
          if (temLocativo) {
            // complementos antes do verbo secundário
            if (complementos.length > 0) partes.push(...complementosLower);
            partes.push(lc(verboSecundario));
          } else {
            // verbo secundário antes dos complementos (ex: "fazer outro")
            partes.push(lc(verboSecundario));
            if (complementos.length > 0) partes.push(...complementosLower);
          }
          if (verboTerciario) partes.push(lc(verboTerciario));
        } else {
          // sem verbo secundário, apenas complementos
          if (complementos.length > 0) partes.push(...complementosLower);
        }
      }

      // monta sem ponto de interrogação (você pediu para remover '?')
      let frase = partes.join(' ').trim();
      if (frase.length > 0) frase = frase[0].toUpperCase() + frase.slice(1);
      this.textoExibido = frase;
      this.falarTexto(this.textoExibido);
      return;
    }

    // === FRASES DECLARATIVAS (pronome + verbo) ===
    if (pronomesSelecionados.length > 0 && verboPrincipal) {
      const pronomeOriginal = pronomesSelecionados[0];
      partes.push(lc(pronomeOriginal));

      if (negacaoSelecionada) partes.push(lc(negacaoSelecionada));

      // verbo principal conjugado
      partes.push(conjugar(verboPrincipal, pronomeOriginal));

      // complementos antes do verbo secundário se forem locativos (ex: "aqui", "para")
      if (verboSecundario) {
        if (temLocativo) {
          if (complementos.length > 0) partes.push(...complementosLower);
          partes.push(lc(verboSecundario));
        } else {
          partes.push(lc(verboSecundario));
          if (complementos.length > 0) partes.push(...complementosLower);
        }
        if (verboTerciario) partes.push(lc(verboTerciario));
      } else {
        if (complementos.length > 0) partes.push(...complementosLower);
      }

      let frase = partes.join(' ').trim();
      if (frase.length > 0) frase = frase[0].toUpperCase() + frase.slice(1);
      this.textoExibido = frase;
      this.falarTexto(this.textoExibido);
      return;
    }

    // === CASO SIMPLES / FALLBACK ===
    // apenas junta os tokens (mantendo a ordem). Normaliza para lowercase e capitaliza primeira letra.
    const fallback = this.textosSelecionados.map(t => lc(t)).join(' ').trim();
    this.textoExibido = fallback.length > 0 ? fallback[0].toUpperCase() + fallback.slice(1) : null;
    if (this.textoExibido) this.falarTexto(this.textoExibido);
  }*/

 gerarFraseEFala() {
    if (this.textosSelecionados.length === 0) {
      this.textoExibido = null;
      return;
    }

    const { pronomes, verbos, negacoes, interrogativas, conectivos, afirmacoes, artigos, outros } = this.palavras;

    const pronomesSelecionados = this.textosSelecionados.filter(t => pronomes.includes(t));
    const pronomeSujeito = pronomesSelecionados[0];
    const pronomeComplementos = pronomesSelecionados.slice(1);

    const verbosSelecionados = this.textosSelecionados.filter(t => verbos.includes(t));
    const negacaoSelecionada = this.textosSelecionados.find(t => negacoes.includes(t));
    const interrogativaSelecionada = this.textosSelecionados.find(t => interrogativas.includes(t));
    const conectivoSelecionado = this.textosSelecionados.find(t => conectivos.includes(t));

    const verboPrincipal = verbosSelecionados[0];
    const verboSecundario = verbosSelecionados[1];
    const verboTerciario = verbosSelecionados[2];
    const verboQuaternario = verbosSelecionados[3];

    const complementos = this.textosSelecionados.filter(t => {
      if (t === pronomeSujeito) return false;
      if (pronomes.includes(t)) return true;
      return !verbos.includes(t) &&
            !negacoes.includes(t) &&
            !interrogativas.includes(t);
    });

    const lc = (s: string) => s ? s.toLowerCase() : '';
    const conjugar = (verbo: string, pronome: string) => {
      if (!verbo) return '';
      const conj = this.conjugacoes[verbo]?.[pronome];
      return conj ? conj : verbo.toLowerCase();
    };

    const LOCATIVOS = new Set(['de','para','aqui','ali','em cima','embaixo','dentro','fora','embaixo','emcima']);

    const temLocativoNoMeio = complementos.some((c, index) =>
      LOCATIVOS.has(lc(c)) && index < complementos.length - 1
    );

    let partes: string[] = [];

    // === INTERROGATIVAS ===
    if (interrogativaSelecionada) {
      if (interrogativaSelecionada === 'Qual' && verboPrincipal === 'Ser') {
        partes = ['qual', 'seu'];
      } else {
        partes.push(lc(interrogativaSelecionada));

        // NOVA LÓGICA: Processa na ordem de seleção
        const elementosRestantes: Array<{valor: string, ordem: number}> = [];

        // Adiciona verbos
        if (verboPrincipal) {
          const idx = this.textosSelecionados.indexOf(verboPrincipal);
          elementosRestantes.push({valor: lc(verboPrincipal), ordem: idx});
        }
        if (verboSecundario) {
          const idx = this.textosSelecionados.indexOf(verboSecundario);
          elementosRestantes.push({valor: lc(verboSecundario), ordem: idx});
        }
        if (verboTerciario) {
          const idx = this.textosSelecionados.indexOf(verboTerciario);
          elementosRestantes.push({valor: lc(verboTerciario), ordem: idx});
        }
        if (verboQuaternario) {
          const idx = this.textosSelecionados.indexOf(verboQuaternario);
          elementosRestantes.push({valor: lc(verboQuaternario), ordem: idx});
        }

        // Adiciona pronomes (exceto o primeiro se já foi usado)
        pronomesSelecionados.forEach(p => {
          const idx = this.textosSelecionados.indexOf(p);
          elementosRestantes.push({valor: lc(p), ordem: idx});
        });

        // Adiciona complementos
        complementos.forEach(c => {
          if (!pronomes.includes(c)) { // Evita duplicar pronomes
            const idx = this.textosSelecionados.indexOf(c);
            elementosRestantes.push({valor: lc(c), ordem: idx});
          }
        });

        // Ordena pela ordem de seleção
        elementosRestantes.sort((a, b) => a.ordem - b.ordem);

        // Processa elemento por elemento
        for (let i = 0; i < elementosRestantes.length; i++) {
          const elemento = elementosRestantes[i];
          const ordemOriginal = elemento.ordem;
          const textoOriginal = this.textosSelecionados[ordemOriginal];

          // Verifica se é um verbo
          if (verbos.includes(textoOriginal)) {
            // Procura se há pronome imediatamente antes
            let pronomeAnterior = '';
            for (let j = ordemOriginal - 1; j >= 0; j--) {
              const itemAnterior = this.textosSelecionados[j];

              // Encontrou pronome
              if (pronomes.includes(itemAnterior)) {
                pronomeAnterior = itemAnterior;
                break;
              }

              // Se encontrar interrogativa, para (não conjuga)
              if (interrogativas.includes(itemAnterior)) {
                break;
              }

              // Se encontrar outro verbo, para
              if (verbos.includes(itemAnterior)) {
                break;
              }
            }

            if (pronomeAnterior) {
              // Conjuga o verbo com o pronome encontrado
              partes.push(conjugar(textoOriginal, pronomeAnterior));
            } else {
              // Mantém o verbo no infinitivo (minúscula)
              partes.push(elemento.valor);
            }
          } else {
            // Não é verbo, adiciona normalmente
            partes.push(elemento.valor);
          }
        }
      }

      let frase = partes.join(' ').trim();
      if (frase.length > 0) frase = frase[0].toUpperCase() + frase.slice(1);
      this.textoExibido = frase;
      this.falarTexto(this.textoExibido);
      return;
    }

    // === FRASES DECLARATIVAS ===
    if (pronomeSujeito && verboPrincipal) {
      partes.push(lc(pronomeSujeito));
      if (negacaoSelecionada) partes.push(lc(negacaoSelecionada));
      partes.push(conjugar(verboPrincipal, pronomeSujeito));

      const elementosRestantes: Array<{valor: string, ordem: number}> = [];

      if (verboSecundario) {
        const idx = this.textosSelecionados.indexOf(verboSecundario);
        elementosRestantes.push({valor: lc(verboSecundario), ordem: idx});
      }

      if (verboTerciario) {
        const idx = this.textosSelecionados.indexOf(verboTerciario);
        elementosRestantes.push({valor: lc(verboTerciario), ordem: idx});
      }

      if (verboQuaternario) {
        const idx = this.textosSelecionados.indexOf(verboQuaternario);
        elementosRestantes.push({valor: lc(verboQuaternario), ordem: idx});
      }

      complementos.forEach(c => {
        const idx = this.textosSelecionados.indexOf(c);
        elementosRestantes.push({valor: lc(c), ordem: idx});
      });

      elementosRestantes.sort((a, b) => a.ordem - b.ordem);

      for (let i = 0; i < elementosRestantes.length; i++) {
        const elemento = elementosRestantes[i];
        const ordemOriginal = elemento.ordem;
        const textoOriginal = this.textosSelecionados[ordemOriginal];

        if (verbos.includes(textoOriginal)) {
          let pronomeAnterior = '';
          for (let j = ordemOriginal - 1; j >= 0; j--) {
            const itemAnterior = this.textosSelecionados[j];
            if (pronomes.includes(itemAnterior) && itemAnterior !== pronomeSujeito) {
              pronomeAnterior = itemAnterior;
              break;
            }
            if (verbos.includes(itemAnterior)) {
              break;
            }
          }

          if (pronomeAnterior) {
            partes.push(conjugar(textoOriginal, pronomeAnterior));
          } else {
            partes.push(elemento.valor);
          }
        } else {
          partes.push(elemento.valor);
        }
      }

      let frase = partes.join(' ').trim();
      if (frase.length > 0) frase = frase[0].toUpperCase() + frase.slice(1);
      this.textoExibido = frase;
      this.falarTexto(this.textoExibido);
      return;
    }

    // === CASO SIMPLES / FALLBACK ===
    const fallback = this.textosSelecionados.map(t => lc(t)).join(' ').trim();
    this.textoExibido = fallback.length > 0 ? fallback[0].toUpperCase() + fallback.slice(1) : null;
    if (this.textoExibido) this.falarTexto(this.textoExibido);
  }

  ehCorreta(respostaUsuario: string[], respostaCorreta: string[]): boolean {
    if (respostaUsuario.length !== respostaCorreta.length) {
      return false;
    }
    return respostaUsuario.every((item, index) => item === respostaCorreta[index]);
  }

  getPictogramasSelecionados(): string[] {
    return this.textosSelecionados;
  }

  finalizar() {
    const respostaUsuario = this.getPictogramasSelecionados();
    let respostaCorreta = false;

    if ((this.etapa === 1 && this.ehCorreta(respostaUsuario, ['Você', 'Querer', 'Ajuda'])) ||
        (this.etapa === 2 && this.ehCorreta(respostaUsuario, ['Eu', 'Ser'])) ||
        (this.etapa === 3 && this.ehCorreta(respostaUsuario,  ['Qual', 'Ser'])) || // Qual seu
        (this.etapa === 4 && this.ehCorreta(respostaUsuario, ['Não', 'Pode', 'Conversar'])) ||
        (this.etapa === 5 && this.ehCorreta(respostaUsuario, ['Quem', 'Querer', 'Sair', 'Pode', 'Ajuda'])) ||
        (this.etapa === 6 && this.ehCorreta(respostaUsuario, ['Eu', 'Estar', 'Aqui', 'para', 'Ajuda', 'Você'])) || // Eu estou para ajuda você
        (this.etapa === 7 && this.ehCorreta(respostaUsuario, ['Agora', 'Você', 'Pode', 'Abrir'])) || // Você pode abrir agora
        (this.etapa === 8 && this.ehCorreta(respostaUsuario, ['Você', 'Pode', 'Querer', 'Ajuda', 'Eu', 'Estar', 'Aqui'])) || // Você quer ajuda
        (this.etapa === 9 && this.ehCorreta(respostaUsuario, ['Quem', 'Gosta'])) || // Você gosta
        (this.etapa === 10 && this.ehCorreta(respostaUsuario, ['Você', 'Querer', 'Mais', 'Agora'])) || // Você quer mais agora
        (this.etapa === 11 && this.ehCorreta(respostaUsuario, ['Você', 'Querer', 'Mais'])) || // Você quer mais
        (this.etapa === 12 && this.ehCorreta(respostaUsuario, ['Você', 'Não', 'Querer', 'Mais'])) || // Você não quer mais
        (this.etapa === 13 && this.ehCorreta(respostaUsuario, ['Agora', 'Em cima'])) || // Agora em cima
        (this.etapa === 14 && this.ehCorreta(respostaUsuario, ['Quando', 'Acabar', 'Você', 'Pode', 'Sair', 'para', 'Comer'])) || // Quando acabar pode sair
        (this.etapa === 15 && this.ehCorreta(respostaUsuario, ['Nós', 'Ir', 'Sair', 'Agora', 'para', 'Fazer', 'Diferente'])) || // Nós vamos para fora
        (this.etapa === 16 && this.ehCorreta(respostaUsuario, ['Qual', 'Nós', 'Ir'])) || // O que você (acho que deveria sair)
        (this.etapa === 17 && this.ehCorreta(respostaUsuario, ['Qual', 'Você', 'Querer'])) || // Qual você quer
        (this.etapa === 18 && this.ehCorreta(respostaUsuario, ['Nós', 'Ir', 'para'])) || // Nós vamos para dentro
        (this.etapa === 19 && this.ehCorreta(respostaUsuario, ['Você', 'Gosta'])) || // Você gosta
        (this.etapa === 20 && this.ehCorreta(respostaUsuario, ['Quando', 'Você', 'Querer', 'Fazer', 'Outro', 'Fora'])) || // Quando você quer fazer outro
        (this.etapa === 21 && this.ehCorreta(respostaUsuario, ['Eu', 'Gosta', 'De', 'Fazer'])) || // Eu gosto de fazer
        (this.etapa === 22 && this.ehCorreta(respostaUsuario, ['Nós', 'Acabar', 'Sair'])) // Você pode sair

      ){
      respostaCorreta = true;

      this.mensagemFeedback = "Resposta correta!";
      this.tipoFeedback = "sucesso";
      this.mostrarFeedback = true;

      setTimeout(() => {
        this.irParaProximoExercicio();
      }, 5000);

    } else {
      this.mensagemFeedback = "Tente novamente!";
      this.tipoFeedback = "erro";
      this.mostrarFeedback = true;
    }
    this.gerarFraseEFala();
    setTimeout(() => {
      this.mostrarFeedback = false;
    }, 5000);
  }

  /*irParaProximoExercicio(){
    console.log(`Etapa ${this.etapa} finalizada:`, {
      dicasUsadas: this.getQuantidadeDicasUsadas(this.etapa),
      dicaFoiClicada: this.dicaClicada
    });
    this.respostaCorreta.emit();
    this.limparSelecao();
    this.dicaClicada = false;

    const token = localStorage.getItem('token');
    if (!token) return console.error('⚠ Nenhum token encontrado!');

    // Avança etapa
    this.etapa += 1;

    // Salvar progresso toda vez que avança
    //this.salvarProgresso();
    const progresso = {
      etapaAtual: this.etapa,
      dicasUsadas: Object.fromEntries(this.dicasUtilizadas)
      //dicasUsadas: Object.fromEntries(this.getDadosUsoDesDicas().map(d => [d.etapa, d.quantidade]))
    };

    console.log('Tentando salvar progresso:', progresso);

    this.treinoService.salvarProgresso(token, progresso).subscribe({
      next: (res) => console.log('Progresso salvo com sucesso', res),
      error: (err) => console.error('Erro ao salvar progresso', err)
    });

  }*/

  irParaProximoExercicio() {
    this.respostaCorreta.emit();
    this.limparSelecao();
    this.dicaClicada = false;

    const token = localStorage.getItem('token');
    if (!token) return console.error('⚠ Nenhum token encontrado!');

    this.etapa += 1;

    // Converte o Map de dicas utilizadas em um objeto adequado para envio
    const progresso = {
      etapaAtual: this.etapa,
      dicasUsadas: Object.fromEntries(this.dicasUtilizadas)
    };

    console.log('Tentando salvar progresso:', progresso);

    this.treinoService.salvarProgresso(token, progresso).subscribe({
      next: (res) => console.log('Progresso salvo com sucesso', res),
      error: (err) => console.error('Erro ao salvar progresso', err)
    });

  }

  /*salvarProgresso() {
    const progresso = {
      etapaAtual: this.etapa,
      dicasUsadas: Object.fromEntries(this.getDadosUsoDesDicas().map(d => [d.etapa, d.quantidade]))
    };

    console.log('Tentando salvar progresso:', progresso);

    this.treinoService.salvarProgresso(progresso).subscribe({
      next: (res) => console.log('Progresso salvo com sucesso', res),
      error: (err) => console.error('Erro ao salvar progresso', err)
    });
  }*/


  getTextoDoEnunciadoAtual(): string {
    return new EnunciadosComponent().getEnunciado(this.etapa);
  }

  falarTexto(texto: string) {
    const mensagem = new SpeechSynthesisUtterance(texto);
    mensagem.lang = 'pt-BR';
    mensagem.rate = 1.0;
    window.speechSynthesis.speak(mensagem);
  }

  itemSelecionado(texto: string): boolean {
    return this.textosSelecionados.includes(texto);
  }

  limparSelecao() {
    this.textosSelecionados = [];
    this.textoExibido = null;

    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }

    if(this.mostrarDica){
      this.dica();
    }
  }


  exportarDadosAnalise(): {
    etapaAtual: number,
    dicaClicadaNaEtapaAtual: boolean,
    totalDicasPorEtapa: { etapa: number, quantidade: number }[],
    totalGeralDicas: number
  } {
    const totalGeral = Array.from(this.dicasUtilizadas.values())
      .reduce((total, quantidade) => total + quantidade, 0);

    return {
      etapaAtual: this.etapa,
      dicaClicadaNaEtapaAtual: this.dicaClicada,
      totalDicasPorEtapa: this.getDadosUsoDesDicas(),
      totalGeralDicas: totalGeral
    };

  }

  // Método para resetar todos os dados de dica (útil para reiniciar atividade)
  resetarDadosDicas(): void {
    this.dicasUtilizadas.clear();
    this.dicaClicada = false;
    console.log('Dados de dicas resetados');
  }


  filtrarIconesPorCategoria(categoria: string) {
    this.categoriaAtual = categoria;
  }

  ngOnDestroy() {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
    }
  }
}
