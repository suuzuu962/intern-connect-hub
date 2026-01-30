import { Header } from './Header';
import { Footer } from './Footer';
import { useZoom, DEVICE_WIDTHS } from '@/contexts/ZoomContext';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export const Layout = ({ children, hideFooter = false }: LayoutProps) => {
  const { zoomLevel, deviceMode } = useZoom();

  return (
    <div 
      className="min-h-screen flex flex-col mx-auto transition-all duration-300"
      style={{ 
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'top center',
        maxWidth: DEVICE_WIDTHS[deviceMode],
        minHeight: `${100 / zoomLevel}vh`,
      }}
    >
      <Header />
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
};
