import { User } from '@supabase/supabase-js';

export const Links = [
  {
    user: 'super_admin',
    links: [
      {
        label: 'Dashboard',
        path: '/dash',
        icon: 'heroHome',
        role: ['super_admin', 'admin', 'voter'],
      },
      {
        label: 'User Management',
        path: '/dash/user-management',
        icon: 'heroUsers',
        role: ['super_admin', 'admin'],
      },
      {
        label: 'Create New User',
        path: '/dash/create-user',
        icon: 'heroUserPlus',
        role: ['super_admin', 'admin'],
      },
    ],
    role: ['super_admin', 'admin', 'voter'],
  },
];


//  {
//     'super-admin': [
//       { label: 'Dashboard', path: '/dashboard' },
//       { label: 'Manage Elections', path: '/dashboard/elections' },
//       { label: 'Manage Users', path: '/dashboard/users' },
//       { label: 'Settings', path: '/dashboard/settings' },
//     ],
//     'admin': [
//       { label: 'Dashboard', path: '/dashboard' },
//       { label: 'Manage Elections', path: '/dashboard/elections' },
//       { label: 'Settings', path: '/dashboard/settings' },
//     ],
//     'voter': [
//       { label: 'Dashboard', path: '/dashboard' },
//       { label: 'Vote Now', path: '/dashboard/vote' },
//       { label: 'Results', path: '/dashboard/results' },
//     ]
//   }
