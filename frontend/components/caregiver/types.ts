export type { User } from '@/types/user';

export interface MenuItem {
    id: string;
    title: string;
    icon?: React.ReactNode;
    path?: string;
    children?: MenuItem[];
    dividerAfter?: boolean;
}
