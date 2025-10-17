// src/app/treino-pra/video-introducao/video-introducao.component.ts
import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

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
        <video
          #videoPlayer
          class="intro-video"
          controls
          (ended)="onVideoEnded()"
          (loadedmetadata)="onVideoLoaded()">
          <source src="../../../assets/videos/introducao-treino-pratico.mp4" type="video/mp4">
          <p>Seu navegador não suporta vídeos HTML5.</p>
        </video>

        <div class="controls-container">
          <button
            class="btn-pular"
            (click)="pularVideo()"
            [disabled]="!videoLoaded">
            Pular Introdução
          </button>

          <!--div class="progress-indicator" *ngIf="videoLoaded">
            <span>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
          </!--div-->
        </div>

        <div class="loading-indicator" *ngIf="!videoLoaded">
          <p>Carregando vídeo...</p>
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

    /*.video-wrapper {
      background: white;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.1);
      max-width: 800px;
      width: 100%;
      text-align: center;
    }*/

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

    /*.progress-indicator {
      background: #f8f9fa;
      padding: 8px 16px;
      border-radius: 20px;
      color: #666;
      font-size: 0.9rem;
      font-weight: 500;
    }*/

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
    }
  `]
})
export class VideoIntroducaoComponent implements AfterViewInit {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  @Output() videoCompleto = new EventEmitter<void>();

  videoLoaded = false;
  currentTime = 0;
  duration = 0;

  ngAfterViewInit() {
    const video = this.videoPlayer.nativeElement;

    video.onloadedmetadata = () => {
      this.videoLoaded = true;
    };

    /*video.addEventListener('timeupdate', () => {
      this.currentTime = video.currentTime;
    });

    video.addEventListener('loadedmetadata', () => {
      this.duration = video.duration;
    });*/
  }

  onVideoLoaded() {
    this.videoLoaded = true;
  }

  onVideoEnded() {
    // Aguarda 2 segundos antes de redirecionar automaticamente
    setTimeout(() => {
      this.videoCompleto.emit();
    }, 2000);
  }

  pularVideo() {
    this.videoCompleto.emit();
  }

  formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
