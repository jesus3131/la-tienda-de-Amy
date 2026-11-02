import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Sin datos', description = '', icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="w-12 h-12 text-stone-300 mb-3" />
      <h3 className="text-sm font-medium text-stone-600">{title}</h3>
      {description && <p className="text-xs text-stone-400 mt-1">{description}</p>}
    </div>
  );
}