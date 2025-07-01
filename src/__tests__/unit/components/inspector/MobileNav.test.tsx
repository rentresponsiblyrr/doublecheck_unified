import { render, screen } from '@testing-library/react';
import { MobileNav } from '@/components/inspector/MobileNav';
import { usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('MobileNav', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/inspector');
  });

  it('should render all navigation items', () => {
    render(<MobileNav />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Capture')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('should highlight active route', () => {
    (usePathname as jest.Mock).mockReturnValue('/inspector');
    const { container } = render(<MobileNav />);

    const homeLink = container.querySelector('a[href="/inspector"]');
    expect(homeLink).toHaveClass('text-primary');
  });

  it('should not highlight inactive routes', () => {
    (usePathname as jest.Mock).mockReturnValue('/inspector');
    const { container } = render(<MobileNav />);

    const activeLink = container.querySelector('a[href="/inspector/active"]');
    expect(activeLink).toHaveClass('text-gray-500');
  });

  it('should have mobile-safe-area class', () => {
    const { container } = render(<MobileNav />);
    
    const safeArea = container.querySelector('.mobile-safe-area');
    expect(safeArea).toBeInTheDocument();
  });

  it('should have touch-manipulation class for mobile interaction', () => {
    const { container } = render(<MobileNav />);
    
    const links = container.querySelectorAll('.touch-manipulation');
    expect(links).toHaveLength(4);
  });

  it('should render icons for each nav item', () => {
    const { container } = render(<MobileNav />);
    
    const svgIcons = container.querySelectorAll('svg');
    expect(svgIcons).toHaveLength(4);
  });
});