import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoIntroducaoService } from './video-introducao.service';

@Component({
  selector: 'app-video-introducao',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-container">
      <div class="video-wrapper">
        <h2 class="video-title">Bem-vindo ao Treinamento Prático!</h2>
        <p class="video-description">
          Assista ao vídeo abaixo para entender como funciona esta área do treinamento prático.
        </p>
        <br>

        <!-- Carregando vídeo do Blob -->
        <div class="loading-indicator" *ngIf="carregandoVideo">
          <p>Carregando vídeo...</p>
        </div>

        <!-- Erro ao carregar -->
        <div class="erro-container" *ngIf="erroVideo">
          <p class="erro-mensagem">❌ {{ erroVideo }}</p>
        </div>

        <!-- Vídeo -->
        <video
          #videoPlayer
          class="intro-video"
          controls
          (ended)="onVideoEnded()"
          (loadedmetadata)="onVideoLoaded()"
          (error)="onVideoError($event)"
          *ngIf="videoUrl && !carregandoVideo">
          <source [src]="videoUrl" type="video/mp4">
          <p>Seu navegador não suporta vídeos HTML5.</p>
        </video>

        <div class="controls-container">
          <button
            class="btn-pular"
            (click)="pularVideo()"
            [disabled]="!videoLoaded || carregandoVideo">
            Pular Introdução
          </button>
        </div>

        <!-- Status de assistido -->
        <div class="status-container" *ngIf="statusAssistido">
          <p class="status-message">✅ Vídeo marcado como assistido em {{ dataAssistido | date: 'dd/MM/yyyy HH:mm' }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .video-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: white;
      padding: 20px;
      text-align: center;
    }

    .video-wrapper {
      background: white;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.1);
      max-width: 800px;
      width: 100%;
      text-align: center;
    }

    .video-title {
      color: black;
      margin-bottom: 15px;
      font-size: 2rem;
      font-weight: 600;
    }

    .video-description {
      color: black;
      margin-bottom: 25px;
      font-size: 24px;
      line-height: 1.5;
    }

    .intro-video {
      width: 80%;
      max-width: 80%;
      height: auto;
      border-radius: 10px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      margin-bottom: 20px;
    }

    .controls-container {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      margin-top: 15px;
    }

    .btn-pular {
      background: linear-gradient(45deg, #ff6b6b, #ee5a24);
      color: white;
      border: none;
      padding: 15px 28px;
      border-radius: 25px;
      font-size: 30px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
    }

    .btn-pular:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
    }

    .btn-pular:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .loading-indicator {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
      color: #666;
      font-size: 1.1rem;
    }

    .loading-indicator::after {
      content: '';
      width: 20px;
      height: 20px;
      border: 2px solid #ddd;
      border-top: 2px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-left: 10px;
    }

    .erro-container {
      background: #ffebee;
      color: #c62828;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border: 1px solid #ef5350;
    }

    .erro-mensagem {
      margin: 0;
      font-weight: 500;
    }

    .status-container {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
      border: 1px solid #4caf50;
    }

    .status-message {
      margin: 0;
      font-weight: 500;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .video-wrapper {
        padding: 20px;
        margin: 10px;
      }

      .video-title {
        font-size: 1.5rem;
      }

      .video-description {
        font-size: 1rem;
      }

      .controls-container {
        justify-content: center;
        text-align: center;
      }

      .intro-video {
        width: 100%;
        max-width: 100%;
      }

      .btn-pular {
        font-size: 1.2rem;
        padding: 12px 20px;
      }
    }
  `]
})
export class VideoIntroducaoComponent implements OnInit, AfterViewInit {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  @Output() videoCompleto = new EventEmitter<void>();

  videoLoaded = false;
  videoUrl = 'assets/videos/introducao-treino-pratico.mp4';
  carregandoVideo = true;
  erroVideo = '';
  statusAssistido = false;
  dataAssistido: Date | null = null;

  constructor(private videoService: VideoIntroducaoService) {}

  ngOnInit() {
    this.carregarVideo();
    this.verificarStatus();
  }

  ngAfterViewInit() {
    if (this.videoPlayer) {
      const video = this.videoPlayer.nativeElement;
      video.onloadedmetadata = () => {
        this.videoLoaded = true;
        console.log('✅ Video metadata carregado');
      };
    }
  }

  /**
   * Carrega a URL do vídeo do Vercel Blob
   */
  carregarVideo(): void {
    this.videoService.obterVideoUrl().subscribe({
      next: (url) => {
        this.videoUrl = url;
        this.carregandoVideo = false;
        console.log('✅ Vídeo carregado do Blob');
      },
      error: (error) => {
        //console.error('❌ Erro ao carregar vídeo:', error);
        //this.erroVideo = 'Erro ao carregar vídeo: ' + (error.message || 'Tente novamente');
        this.carregandoVideo = false;
      }
    });
  }

  /**
   * Verifica se o usuário já assistiu o vídeo
   */
  verificarStatus(): void {
    this.videoService.obterStatusCompleto().subscribe({
      next: (status) => {
        this.statusAssistido = status.assistido;
        this.dataAssistido = status.data;
        console.log('✅ Status do vídeo:', status);
      },
      error: (error) => {
        console.warn('⚠️ Não foi possível verificar status:', error);
      }
    });
  }

  /**
   * Marca o vídeo como assistido quando termina
   */
  onVideoEnded() {
    console.log('✅ Vídeo finalizado');
    this.videoService.marcarComoAssistido().subscribe({
      next: () => {
        this.statusAssistido = true;
        this.dataAssistido = new Date();
        console.log('✅ Vídeo marcado como assistido');
      },
      error: (error) => {
        console.error('❌ Erro ao marcar vídeo:', error);
      }
    });

    setTimeout(() => {
      this.videoCompleto.emit();
    }, 2000);
  }

  /**
   * Marca como assistido e emite evento quando o usuário pula
   */
  pularVideo() {
    console.log('Usuário pulou o vídeo');
    this.videoService.marcarComoAssistido().subscribe({
      next: () => {
        console.log('✅ Vídeo marcado como assistido (pulado)');
      },
      error: (error) => {
        console.error('❌ Erro ao marcar vídeo:', error);
      }
    });
    this.videoCompleto.emit();
  }

  /**
   * Trata erro ao carregar o vídeo
   */
  onVideoLoaded() {
    this.videoLoaded = true;
    console.log('✅ Video totalmente carregado');
  }

  /**
   * Trata erro de reprodução
   */
  onVideoError(event: any) {
    //console.error('❌ Erro ao carregar vídeo:', event);
    this.erroVideo = 'Erro ao reproduzir vídeo. Pulando...';
    setTimeout(() => {
      this.videoCompleto.emit();
    }, 2000);
  }
}
