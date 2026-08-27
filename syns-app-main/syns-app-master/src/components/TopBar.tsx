import { Menu } from 'lucide-react';

interface TopBarProps {
  title: string;
  onOpenSidebar: () => void;
  right?: React.ReactNode;
}

export default function TopBar({ title, onOpenSidebar, right }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 h-16 bg-bg/80 backdrop-blur-md border-b border-border flex items-center px-4 lg:px-8 gap-4">
      <button
        onClick={onOpenSidebar}
        className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-card-hover"
      >
        <Menu size={22} />
      </button>
      <h1 className="text-lg font-bold text-text flex-1 truncate">{title}</h1>
      {right}
    </header>
  );
}
