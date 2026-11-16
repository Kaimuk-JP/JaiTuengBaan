import { ElderlyHeader } from '../header';

interface ElderlyConfirmHeaderProps {
    user: any;
    onToggleSidebar?: () => void;
}

export function ElderlyConfirmHeader({ user, onToggleSidebar }: ElderlyConfirmHeaderProps) {
    return <ElderlyHeader user={user} onToggleSidebar={onToggleSidebar || (() => {})} />;
}
