import { Link } from 'react-router-dom';
import detectaLogo from '@/assets/detecta-logo.png';

export const Logo = () => {
  return (
    <Link to="/" className="flex items-center transition-opacity hover:opacity-80">
      <img 
        src={detectaLogo} 
        alt="Detecta" 
        className="h-8 w-auto object-contain"
        loading="eager"
      />
    </Link>
  );
};
