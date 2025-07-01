import { render, screen } from '@testing-library/react';
import { QuickStats } from '@/components/inspector/QuickStats';

describe('QuickStats', () => {
  it('should render all stat cards', () => {
    render(<QuickStats />);

    expect(screen.getByText('Completed Today')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
  });

  it('should display correct values', () => {
    render(<QuickStats />);

    expect(screen.getByText('3')).toBeInTheDocument(); // Completed Today
    expect(screen.getByText('2')).toBeInTheDocument(); // In Progress
    expect(screen.getByText('1')).toBeInTheDocument(); // Pending Review
  });

  it('should have correct styling for each stat', () => {
    const { container } = render(<QuickStats />);

    const completedStat = container.querySelector('.bg-green-50');
    const progressStat = container.querySelector('.bg-blue-50');
    const pendingStat = container.querySelector('.bg-amber-50');

    expect(completedStat).toBeInTheDocument();
    expect(progressStat).toBeInTheDocument();
    expect(pendingStat).toBeInTheDocument();
  });

  it('should be responsive grid layout', () => {
    const { container } = render(<QuickStats />);
    
    const grid = container.querySelector('.grid-cols-3');
    expect(grid).toBeInTheDocument();
  });
});