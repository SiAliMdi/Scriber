import { HeadCell } from '../@types/datatable';

const headCells: readonly HeadCell[] = [
    {
      id: 'first_name',
      numeric: false,
      disablePadding: true,
      label: 'first_name',
    },
    {
      id: 'last_name',
      numeric: false,
      disablePadding: true,
      label: 'last_name',
    },
    {
      id: 'email',
      numeric: false,
      disablePadding: true,
      label: 'email',
    },
    {
      id: 'is_staff',
      numeric: false,
      disablePadding: false,
      label: 'Activated',
    },
    {
      id: 'last_login',
      numeric: true,
      disablePadding: false,
      label: 'Last login',
    },
  ];
  
export default headCells;