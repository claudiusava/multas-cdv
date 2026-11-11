import { Routes } from '@angular/router';
import { RankingPage } from './pages/ranking';
import { MultasPage } from './pages/multas';
import { JugadorPage } from './pages/jugador';
import { NuevaPage } from './pages/nueva';
import { AccesoPage } from './pages/acceso';
import { ReglamentoPage } from './pages/reglamento';

export const routes: Routes = [
  { path: '', component: RankingPage, title: 'Ranking · Multas CDV' },
  { path: 'multas', component: MultasPage, title: 'Multas · Multas CDV' },
  { path: 'jugador/:id', component: JugadorPage, title: 'Jugador · Multas CDV' },
  { path: 'nueva', component: NuevaPage, title: 'Nueva multa · Multas CDV' },
  { path: 'acceso', component: AccesoPage, title: 'Responsables · Multas CDV' },
  { path: 'reglamento', component: ReglamentoPage, title: 'Reglamento · Multas CDV' },
  { path: '**', redirectTo: '' },
];
