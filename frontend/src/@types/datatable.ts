import {User} from './user'
type Order = 'asc' | 'desc';

interface HeadCell {
    disablePadding: boolean;
    id: keyof User | string;
    label: string;
    numeric: boolean;
  }

  interface EnhancedUsersTableProps {
    numSelected: number;
    onRequestSort: (event: React.MouseEvent<unknown>, property: keyof User) => void;
    onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
    order: Order;
    orderBy: string;
    rowCount: number;
  }

  interface EnhancedTableToolbarProps {
    numSelected: number;
  }
  
  
export type { Order, HeadCell, EnhancedUsersTableProps, EnhancedTableToolbarProps };
