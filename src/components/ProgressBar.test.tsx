import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<ProgressBar progress={50} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should render with custom label', () => {
      render(<ProgressBar progress={75} label="Test Progress" />);
      expect(screen.getByText('Test Progress')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should hide percentage when showPercentage is false', () => {
      render(<ProgressBar progress={50} showPercentage={false} />);
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('should show percentage when showPercentage is true', () => {
      render(<ProgressBar progress={50} showPercentage={true} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render small size correctly', () => {
      const { container } = render(<ProgressBar progress={50} size="sm" />);
      const progressBarContainer = container.querySelector('.h-2');
      expect(progressBarContainer).toBeInTheDocument();
    });

    it('should render medium size correctly', () => {
      const { container } = render(<ProgressBar progress={50} size="md" />);
      const progressBarContainer = container.querySelector('.h-4');
      expect(progressBarContainer).toBeInTheDocument();
    });

    it('should render large size correctly', () => {
      const { container } = render(<ProgressBar progress={50} size="lg" />);
      const progressBarContainer = container.querySelector('.h-6');
      expect(progressBarContainer).toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    it('should show 0% progress correctly', () => {
      render(<ProgressBar progress={0} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should show 100% progress correctly', () => {
      render(<ProgressBar progress={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should round decimal progress to whole number', () => {
      render(<ProgressBar progress={45.7} />);
      expect(screen.getByText('46%')).toBeInTheDocument();
    });

    it('should show green color for 100% completion', () => {
      const { container } = render(<ProgressBar progress={100} />);
      const percentageText = screen.getByText('100%');
      expect(percentageText).toHaveClass('text-green-600');
    });

    it('should show gray color for incomplete progress', () => {
      const { container } = render(<ProgressBar progress={50} />);
      const percentageText = screen.getByText('50%');
      expect(percentageText).toHaveClass('text-gray-600');
    });
  });

  describe('Animation', () => {
    it('should animate progress when animated is true', () => {
      const { rerender } = render(<ProgressBar progress={0} animated={true} />);
      
      // Initial render should show 0
      expect(screen.getByText('0%')).toBeInTheDocument();
      
      // After timer, should animate to target
      vi.advanceTimersByTime(150);
      rerender(<ProgressBar progress={50} animated={true} />);
      
      // Should eventually show target progress
      vi.advanceTimersByTime(150);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should not animate when animated is false', () => {
      render(<ProgressBar progress={50} animated={false} />);
      // Should immediately show the progress without animation
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative progress gracefully', () => {
      render(<ProgressBar progress={-10} />);
      expect(screen.getByText('-10%')).toBeInTheDocument();
    });

    it('should handle progress over 100', () => {
      render(<ProgressBar progress={150} />);
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('should handle very small progress values', () => {
      render(<ProgressBar progress={0.1} />);
      expect(screen.getByText('0%')).toBeInTheDocument(); // Rounds to 0
    });

    it('should handle very large progress values', () => {
      render(<ProgressBar progress={999} />);
      expect(screen.getByText('999%')).toBeInTheDocument();
    });
  });
});
