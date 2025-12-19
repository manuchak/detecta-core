import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HomeHeaderProps {
  userName?: string;
  userEmail?: string;
  onSignOut?: () => void;
}

export const HomeHeader = ({ userName, userEmail, onSignOut }: HomeHeaderProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const displayName = userName || userEmail?.split('@')[0] || 'Usuario';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex items-center justify-between py-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 border-2 border-white/50 shadow-lg">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm text-muted-foreground">
            {getGreeting()}
          </p>
          <h1 className="text-xl font-semibold text-foreground">
            {displayName}
          </h1>
        </div>
      </div>

      {onSignOut && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onSignOut}
          className="h-10 w-10 rounded-full hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      )}
    </header>
  );
};
