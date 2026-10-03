import { useState } from 'react';

type AppLogoProps = {
  iconOnly?: boolean;
  className?: string;
  imageClassName?: string;
};

const AppLogo = ({ iconOnly = false, className = '', imageClassName = 'h-8 w-8' }: AppLogoProps) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <span className={`inline-flex items-center gap-2 font-display font-bold ${className}`}>
      {imageFailed ? (
        <span className={`${imageClassName} inline-flex shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary`} aria-hidden="true">D</span>
      ) : (
        <img
          src="/logo.png"
          width={32}
          height={32}
          alt={iconOnly ? "D'Block" : ''}
          onError={() => setImageFailed(true)}
          className={`${imageClassName} shrink-0 rounded-lg object-contain`}
        />
      )}
      {!iconOnly && <span className="text-primary text-glow">D'Block</span>}
    </span>
  );
};

export default AppLogo;