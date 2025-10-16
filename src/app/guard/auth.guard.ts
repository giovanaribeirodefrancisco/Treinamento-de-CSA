import { CanActivateFn, Router} from '@angular/router';
import { AuthService } from '../login/auth.service';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

export const AuthGuard: CanActivateFn = (
  route: any,
  state: any,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AuthGuard');

  return verificarAcesso(authService, router);
};

function verificarAcesso(authService: AuthService, router: Router):  boolean | Observable<boolean> | Promise<boolean> {
  if (authService.usuarioEstaAutenticado()){
    return true;
  }
  router.navigate(['/login']);
  return false;
}
