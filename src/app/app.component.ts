import { AfterViewInit, Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './login/auth.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Usuario } from './login/usuario';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  title = 'projeto';

  mostrarMenu: boolean = false;
  exibirImagem: boolean = false;
  mostrarCartoesPrancha: boolean = false;

  usuarioLogado: Usuario | null = null;

  iconTeorico = 'arrow_drop_up';
  iconPratico = 'arrow_drop_up';

  sidenavInstance: any;

  private readonly subscriptions: Subscription[] = [];

  constructor(public readonly authservice: AuthService, private readonly router: Router, private readonly http: HttpClient, private readonly cdr: ChangeDetectorRef) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        console.log('Rota atual:', event.url);

        const isExactPranchaRoute = event.url === '/prancha';

        this.exibirImagem = false;

        this.mostrarCartoesPrancha = isExactPranchaRoute;

        this.iconTeorico = this.router.url.includes('treinoteo') ? 'arrow_drop_down' : 'arrow_drop_up';
        this.iconPratico = this.router.url.includes('treinopra') ? 'arrow_drop_down' : 'arrow_drop_up';
      }
    });
  }

  toggleIcon(page: string): void {
    if (page === 'teorico') {
      this.iconTeorico = this.iconTeorico === 'arrow_drop_up' ? 'arrow_drop_down' : 'arrow_drop_up';
    } else if (page === 'pratico') {
      this.iconPratico = this.iconPratico === 'arrow_drop_up' ? 'arrow_drop_down' : 'arrow_drop_up';
    }
  }

  onCardClick(cardTitle: string): void {
    console.log(`Card clicado: ${cardTitle}`);

    // Atualiza os ícones baseado na seleção
    if (cardTitle === 'Orientações Teóricas') {
      this.iconTeorico = 'arrow_drop_down';
    } else if (cardTitle === 'Treinamento Prático') {
      this.iconPratico = 'arrow_drop_down';
    }
  }

  ngOnInit() {
    const menuSub = this.authservice.mostrarMenuEmitter.subscribe(
      mostrar => {
        this.mostrarMenu = mostrar;
        // Reinicializa sidenav quando o menu é mostrado
        if (mostrar) {
          setTimeout(() => this.initSidenav(), 0);
        }
      }
    );
    this.subscriptions.push(menuSub);

    // Inscreve-se para atualizações do usuário
    const usuarioSub = this.authservice.usuarioAtualizadoEmitter.subscribe(
      (usuarioAtualizado) => {
        console.log('🟢 app.component recebeu usuário atualizado:', usuarioAtualizado);

        this.usuarioLogado = { ...usuarioAtualizado };

        console.log('Usuário atualizado no navbar:', usuarioAtualizado);
        this.cdr.detectChanges();
      }
    );
    this.subscriptions.push(usuarioSub);

    // Carrega dados iniciais do usuario
    if(typeof window !== 'undefined'){
      this.usuarioLogado = this.authservice.getusuarioLogado();
    }
  }

  ngOnDestroy(){
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewInit() {
    setTimeout(() => this.initSidenav(), 100);

    // Observe mudanças na rota e reinicialize o sidenav após navegação
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd && this.mostrarMenu) {
        if(!this.sidenavInstance) {
          setTimeout(() => this.initSidenav(), 200);
        }
      }
    });
  }

  initSidenav() {
    if (typeof window !== 'undefined') {
      import('materialize-css').then(M => {
        const elems = document.querySelectorAll('.sidenav');

        if (elems.length > 0) {
          // Destruir instância existente para evitar duplicação
          if (this.sidenavInstance && typeof this.sidenavInstance.destroy === 'function') {
            try {
              this.sidenavInstance.destroy();
            } catch (e) {
              console.warn('Erro ao destruir sidenav anterior:', e);
            }
            this.sidenavInstance = null;
          }

          // Inicializar sidenav com validação
          try {
            if (M && M.Sidenav && typeof M.Sidenav.init === 'function') {
              this.sidenavInstance = M.Sidenav.init(elems[0], {
                edge: 'left',
                draggable: true
              });
              console.log('Sidenav inicializado com sucesso');
            } else {
              console.warn('M.Sidenav não está disponível');
            }
          } catch (error) {
            console.error('Erro ao inicializar sidenav:', error);
          }
        }
      }).catch(err => console.error('Erro ao importar materialize-css:', err));
    }
  }

  // Método para abrir o sidenav programaticamente
  openSidenav() {
    if (this.sidenavInstance && typeof this.sidenavInstance.open === 'function') {
      this.sidenavInstance.open();
    }
  }
}
