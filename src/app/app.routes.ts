import { Login } from './pages/login/login';
import { Auth } from './components/organisms/layout/auth/auth';
import { Sidebar } from './components/organisms/layout/dashboard/sidebar/sidebar';
import { Dashboard } from './components/organisms/layout/dashboard/dashboard';
import { CreateUser } from './pages/create-user/create-user';
import { Users } from './pages/users/users';
import { UserDetail } from './pages/user/user';
import { UserEdit } from './pages/user-edit/user-edit';

export const routes = [
  {
    path: 'dash',
    component: Dashboard,
    children: [
      {
        path: 'side',
        component: Sidebar,
      },
      {
        path: 'create-user',
        component: CreateUser,
      },
      {
        path: 'user-management',
        component: Users,
      },
      {
        path: 'user-management/:id',
        component: UserDetail,
      },
      {
        path: 'user-management/:id/edit',
        component: UserEdit,
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
