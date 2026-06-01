import React from 'react';
import { User } from 'lucide-react';
import { cn } from '../../utils/cn';
import { getMediaUrl } from '../../utils/api';

const Avatar = React.forwardRef(({ className, src, alt, fallback, size = 'md' }, ref) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const [imgError, setImgError] = React.useState(false);

  const handleImageError = () => {
    setImgError(true);
  };

  const shouldShowFallback = !src || imgError;

  // Ensure full URL for profile pictures
  const fullSrc = src ? getMediaUrl(src) : null;

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        sizes[size],
        className
      )}
    >
      {shouldShowFallback ? (
        <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
          {fallback ? (
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {fallback}
            </span>
          ) : (
            <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      ) : (
        <img
          src={fullSrc}
          alt={alt || 'Avatar'}
          className="aspect-square h-full w-full object-cover"
          onError={handleImageError}
        />
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

export default Avatar;
