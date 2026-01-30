import { Header } from './Header';
import { Footer } from './Footer';
import { useZoom } from '@/contexts/ZoomContext';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export const Layout = ({ children, hideFooter = false }: LayoutProps) => {
  const { zoomLevel } = useZoom();

  return (
    <div 
      className="min-h-screen flex flex-col transition-all duration-300"
      style={{ 
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'top center',
        minHeight: `${100 / zoomLevel}vh`,
      }}
    >
      <Header />
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
};
