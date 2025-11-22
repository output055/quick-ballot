import { Login } from './pages/login/login';
import { Auth } from './components/organisms/layout/auth/auth';
import { Sidebar } from './components/organisms/layout/dashboard/sidebar/sidebar';
import { Dashboard } from './components/organisms/layout/dashboard/dashboard';

export const routes = [
  {
    path: 'dash',
    component: Dashboard,
    children: [
      {
        path: 'side',
        component: Sidebar,
      },
    ],
  },
  {
    path: 'auth',
    component: Auth,
    children: [
      {
        path: 'login',
        component: Login,
      },
    ],
  },
];
