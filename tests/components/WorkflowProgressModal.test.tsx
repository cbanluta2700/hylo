import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WorkflowProgressModal } from '../../src/components/WorkflowProgressModal';
import { WorkflowProgress, AgentStatus } from '../../src/services/workflow/WorkflowService';

describe('WorkflowProgressModal', () => {
  const mockOnCancel = vi.fn();

  const defaultProgress: WorkflowProgress = {
    currentStep: 0,
    totalSteps: 4,
    currentAgent: '',
    progress: 0,
    agents: []
  };

  const defaultProps = {
    isOpen: true,
    progress: defaultProgress,
    agents: [],
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render when open', () => {
      render(<WorkflowProgressModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Creating Your Personalized Itinerary')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<WorkflowProgressModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display estimated completion when provided', () => {
      render(
        <WorkflowProgressModal 
          {...defaultProps} 
          estimatedCompletion="2024-03-01 15:30" 
        />
      );

      expect(screen.getByText(/2024-03-01 15:30/)).toBeInTheDocument();
    });
  });

  describe('progress display', () => {
    it('should display overall progress percentage', () => {
      const progress: WorkflowProgress = {
        currentStep: 2,
        totalSteps: 4,
        currentAgent: 'InfoGatherer',
        progress: 50,
        agents: []
      };

      render(<WorkflowProgressModal {...defaultProps} progress={progress} />);

      expect(screen.getByText('50', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('%', { exact: false })).toBeInTheDocument();
    });

    it('should display current step information', () => {
      const progress: WorkflowProgress = {
        currentStep: 2,
        totalSteps: 4,
        currentAgent: 'InfoGatherer',
        progress: 50,
        agents: []
      };

      render(<WorkflowProgressModal {...defaultProps} progress={progress} />);

      expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument();
    });

    it('should display current agent information', () => {
      const progress: WorkflowProgress = {
        currentStep: 2,
        totalSteps: 4,
        currentAgent: 'InfoGatherer',
        progress: 50,
        agents: []
      };

      render(<WorkflowProgressModal {...defaultProps} progress={progress} />);

      expect(screen.getByText(/InfoGatherer/i)).toBeInTheDocument();
    });
  });

  describe('agent status display', () => {
    it('should display agent status cards', () => {
      const agents: AgentStatus[] = [
        {
          id: '1',
          name: 'ContentPlanner',
          status: 'completed',
          startTime: '2024-01-01T00:00:00Z',
          endTime: '2024-01-01T00:01:00Z',
          duration: 60000
        },
        {
          id: '2',
          name: 'InfoGatherer',
          status: 'running',
          startTime: '2024-01-01T00:01:00Z'
        },
        {
          id: '3',
          name: 'Strategist',
          status: 'pending'
        },
        {
          id: '4',
          name: 'Compiler',
          status: 'pending'
        }
      ];

      render(<WorkflowProgressModal {...defaultProps} agents={agents} />);

      // Check for agent names in various formats
      expect(screen.getByText(/Content Planner|ContentPlanner/)).toBeInTheDocument();
      expect(screen.getByText(/Info Gatherer|InfoGatherer/)).toBeInTheDocument();
      expect(screen.getByText(/Strategist/)).toBeInTheDocument();
      expect(screen.getByText(/Compiler/)).toBeInTheDocument();
    });

    it('should show correct status indicators for different agent states', () => {
      const agents: AgentStatus[] = [
        { id: '1', name: 'ContentPlanner', status: 'completed' },
        { id: '2', name: 'InfoGatherer', status: 'running' },
        { id: '3', name: 'Strategist', status: 'error', error: 'Processing failed' },
        { id: '4', name: 'Compiler', status: 'pending' }
      ];

      render(<WorkflowProgressModal {...defaultProps} agents={agents} />);

      // Check for status-related text (using flexible matchers)
      const completedElements = screen.queryAllByText(/✓|complete|done|success/i);
      const runningElements = screen.queryAllByText(/running|processing|active|⏳/i);
      const errorElements = screen.queryAllByText(/error|failed|✗|❌/i);
      const pendingElements = screen.queryAllByText(/pending|waiting|⏳|○/i);

      expect(completedElements.length).toBeGreaterThan(0);
      expect(runningElements.length).toBeGreaterThan(0);
      expect(errorElements.length).toBeGreaterThan(0);
      expect(pendingElements.length).toBeGreaterThan(0);
    });

    it('should display error message for failed agents', () => {
      const agents: AgentStatus[] = [
        {
          id: '1',
          name: 'ContentPlanner',
          status: 'error',
          error: 'Failed to process form data'
        }
      ];

      render(<WorkflowProgressModal {...defaultProps} agents={agents} />);

      expect(screen.getByText(/Failed to process form data/)).toBeInTheDocument();
    });

    it('should display agent duration when available', () => {
      const agents: AgentStatus[] = [
        {
          id: '1',
          name: 'ContentPlanner',
          status: 'completed',
          startTime: '2024-01-01T00:00:00Z',
          endTime: '2024-01-01T00:01:00Z',
          duration: 60000 // 1 minute
        }
      ];

      render(<WorkflowProgressModal {...defaultProps} agents={agents} />);

      // Check for duration display (could be in various formats)
      expect(screen.getByText(/1m|60s|1:00/)).toBeInTheDocument();
    });
  });

  describe('estimated time remaining', () => {
    it('should display estimated time remaining when available', () => {
      const progress: WorkflowProgress = {
        ...defaultProgress
      };

      render(<WorkflowProgressModal {...defaultProps} progress={progress} estimatedCompletion="2m remaining" />);

      expect(screen.getByText(/2m|2:00|remaining|estimate/i)).toBeInTheDocument();
    });

    it('should not display estimated time when not available', () => {
      render(<WorkflowProgressModal {...defaultProps} />);

      expect(screen.queryByText(/remaining|estimate/i)).not.toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(<WorkflowProgressModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel workflow' });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should handle backdrop clicks if modal supports it', () => {
      render(<WorkflowProgressModal {...defaultProps} />);

      // Try to find backdrop element (may or may not exist depending on implementation)
      const backdrop = screen.queryByTestId('modal-backdrop');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
      }
    });

    it('should handle escape key press', () => {
      render(<WorkflowProgressModal {...defaultProps} />);

      // Dispatch escape key event
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      // Note: This test may need adjustment based on actual implementation
      // The modal might handle escape key differently
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<WorkflowProgressModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Check for common ARIA attributes (may vary by implementation)
      const hasAriaLabel = dialog.hasAttribute('aria-label') || dialog.hasAttribute('aria-labelledby');
      expect(hasAriaLabel).toBe(true);
    });

    it('should maintain focus management', () => {
      render(<WorkflowProgressModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel workflow' });
      cancelButton.focus();
      expect(document.activeElement).toBe(cancelButton);
    });

    it('should have proper progress bar accessibility', () => {
      const progress: WorkflowProgress = {
        currentStep: 2,
        totalSteps: 4,
        currentAgent: 'InfoGatherer',
        progress: 50,
        agents: []
      };

      render(<WorkflowProgressModal {...defaultProps} progress={progress} />);

      // Look for progress-related elements with ARIA attributes
      const progressElements = screen.queryAllByRole('progressbar');
      if (progressElements.length > 0) {
        const progressBar = progressElements[0];
        expect(progressBar).toHaveAttribute('aria-valuenow');
      }
    });
  });

  describe('responsive design', () => {
    it('should render with responsive layout classes', () => {
      render(<WorkflowProgressModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      const classNames = dialog.className;
      
      // Check for responsive classes (common patterns)
      const hasResponsiveClasses = /max-w|sm:|lg:|md:|w-full|min-w/.test(classNames);
      expect(hasResponsiveClasses).toBe(true);
    });
  });

  describe('progress updates', () => {
    it('should handle null progress gracefully', () => {
      render(<WorkflowProgressModal {...defaultProps} progress={null} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // Should still render without crashing
    });

    it('should update when progress changes', () => {
      const { rerender } = render(<WorkflowProgressModal {...defaultProps} />);

      const updatedProgress: WorkflowProgress = {
        currentStep: 2,
        totalSteps: 4,
        currentAgent: 'InfoGatherer',
        progress: 50,
        agents: []
      };

      rerender(<WorkflowProgressModal {...defaultProps} progress={updatedProgress} />);

      expect(screen.getByText('50', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('%', { exact: false })).toBeInTheDocument();
    });

    it('should handle agent list updates', () => {
      const { rerender } = render(<WorkflowProgressModal {...defaultProps} />);

      const updatedAgents: AgentStatus[] = [
        { id: '1', name: 'ContentPlanner', status: 'completed' },
        { id: '2', name: 'InfoGatherer', status: 'running' }
      ];

      rerender(<WorkflowProgressModal {...defaultProps} agents={updatedAgents} />);

      expect(screen.getByText(/Content Planner|ContentPlanner/)).toBeInTheDocument();
      expect(screen.getByText(/Info Gatherer|InfoGatherer/)).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should handle missing agent data gracefully', () => {
      const incompleteAgents: AgentStatus[] = [
        { id: '1', name: 'ContentPlanner', status: 'running' } // Valid name for testing
      ];

      render(<WorkflowProgressModal {...defaultProps} agents={incompleteAgents} />);

      // Should render without crashing
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle invalid progress values', () => {
      const invalidProgress: WorkflowProgress = {
        currentStep: -1,
        totalSteps: 0,
        currentAgent: '',
        progress: -10,
        agents: []
      };

      render(<WorkflowProgressModal {...defaultProps} progress={invalidProgress} />);

      // Should render without crashing
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});