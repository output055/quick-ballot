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
];
