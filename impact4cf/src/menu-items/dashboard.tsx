// assets
import { IconDashboard, IconDeviceAnalytics, IconFileInvoice, IconArticle, IconLifebuoy, IconUsers } from '@tabler/icons-react';

// types
import { NavItemType } from 'types';

const icons = {
  IconDashboard: IconDashboard,
  IconDeviceAnalytics: IconDeviceAnalytics,
  IconFileInvoice: IconFileInvoice,
  IconArticle: IconArticle,
  IconLifebuoy: IconLifebuoy,
  IconUsers: IconUsers
};

// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const dashboard: NavItemType = {
  id: 'dashboard',
  title: 'dashboard',
  icon: icons.IconDashboard,
  type: 'group',
  children: [
    {
      id: 'default',
      title: 'overview',
      type: 'item',
      url: '/dashboard/default',
      icon: icons.IconDashboard,
      breadcrumbs: false
    },
    {
      id: 'users',
      title: 'Users',
      type: 'item',
      url: '/users-list',
      icon: icons.IconUsers,
      breadcrumbs: false
    }
    // {
    //   id: 'default',
    //   title: 'default',
    //   type: 'item',
    //   url: '/dashboard/default',
    //   icon: icons.IconDashboard,
    //   breadcrumbs: false
    // },
    // {
    //   id: 'analytics',
    //   title: 'analytics',
    //   type: 'item',
    //   url: '/dashboard/analytics',
    //   icon: icons.IconDeviceAnalytics,
    //   breadcrumbs: false
    // },
    // {
    //   id: 'invoice1',
    //   title: 'invoice',
    //   icon: icons.IconFileInvoice,
    //   type: 'item',
    //   url: '/dashboard/invoice',
    //   breadcrumbs: false
    // },
    // {
    //   id: 'crm1',
    //   title: 'crm',
    //   icon: icons.IconLifebuoy,
    //   type: 'item',
    //   url: '/dashboard/crm',
    //   breadcrumbs: false
    // },
    // {
    //   id: 'blog1',
    //   title: 'blog',
    //   icon: icons.IconArticle,
    //   type: 'item',
    //   url: '/dashboard/blog',
    //   breadcrumbs: false
    // }
  ]
};

export default dashboard;
