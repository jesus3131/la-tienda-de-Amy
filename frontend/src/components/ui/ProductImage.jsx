import { Package } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export default function ProductImage({ src, alt = '', size = 'md', className = '' }) {
  const sizes = { sm: 'w-10 h-10', md: 'w-12 h-12', lg: 'w-20 h-20', xl: 'w-32 h-32' };
  const resolvedSrc = src ? (src.startsWith('http') ? src : `${API_URL}${src}`) : null;
  return (
    <div className={`${sizes[size]} rounded-lg bg-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}>
      {resolvedSrc ? (
        <img src={resolvedSrc} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <Package className="w-1/2 h-1/2 text-stone-400" />
      )}
    </div>
  );
}