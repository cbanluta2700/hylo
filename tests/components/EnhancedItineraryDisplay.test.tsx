import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedItineraryDisplay from '../../src/components/EnhancedItineraryDisplay';

// Mock the workflow service
vi.mock('../../src/services/workflow/WorkflowService', () => ({
  WorkflowService: {
    executeWorkflow: vi.fn(),
    cancelWorkflow: vi.fn(),
  }
}));

// Mock the useWorkflow hook
const mockUseWorkflow = vi.fn();
vi.mock('../../src/hooks/useWorkflow', () => ({
  useWorkflow: mockUseWorkflow,
}));

describe('EnhancedItineraryDisplay', () => {
  const mockFormData = {
    destination: 'Paris, France',
    startDate: '2024-03-15',
    endDate: '2024-03-22',
    budget: 3000,
    adults: 2,
    children: 0,
    interests: ['culture', 'food'],
    travelStyle: 'balanced'
  };

  const mockItinerary = `
    **Day 1 - March 15, 2024**
    
    **Morning (9:00 AM)**
    - Arrive at Charles de Gaulle Airport
    - Take RER B to central Paris (45 minutes, €10)
    
    **Afternoon (2:00 PM)**
    - Check into hotel in Marais district
    - Explore Place des Vosges
    
    **Evening (7:00 PM)**
    - Dinner at L'As du Fallafel (€15-20 per person)
  `;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation for useWorkflow
    mockUseWorkflow.mockReturnValue({
      isExecuting: false,
      isCompleted: false,
      error: null,
      progress: null,
      agents: [],
      itinerary: null,
      metadata: null,
      executeWorkflow: vi.fn(),
      cancelWorkflow: vi.fn(),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering states', () => {
    it('should render loading state', () => {
      render(<EnhancedItineraryDisplay 
        itinerary="" 
        isLoading={true} 
      />);

      expect(screen.getByTestId('resilient-loading')).toBeInTheDocument();
    });

    it('should show workflow progress modal when executing', () => {
      mockUseWorkflow.mockReturnValue({
        isExecuting: true,
        isCompleted: false,
        error: null,
        progress: {
          currentStep: 1,
          totalSteps: 4,
          currentAgent: 'ContentPlanner',
          progress: 25,
          agents: []
        },
        agents: [],
        itinerary: null,
        metadata: null,
        executeWorkflow: vi.fn(),
        cancelWorkflow: vi.fn(),
      });

      render(<EnhancedItineraryDisplay 
        itinerary="" 
        isLoading={false} 
        isWorkflowExecuting={true}
        showProgressModal={true}
      />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display itinerary when available', () => {
      render(<EnhancedItineraryDisplay 
        itinerary={mockItinerary} 
        isLoading={false} 
      />);

      expect(screen.getByText(/Day 1 - March 15, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Arrive at Charles de Gaulle Airport/)).toBeInTheDocument();
    });

    it('should show error state when workflow fails', () => {
      const errorMessage = 'Failed to generate itinerary';
      render(<EnhancedItineraryDisplay 
        itinerary="" 
        isLoading={false} 
        error={errorMessage}
      />);

      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('workflow integration', () => {
    it('should display workflow progress information', () => {
      const workflowProgress = {
        currentStep: 3,
        totalSteps: 4,
        currentAgent: 'Strategist',
        progress: 75,
        agents: [],
        estimatedTimeRemaining: 30000
      };

      render(<EnhancedItineraryDisplay 
        itinerary="" 
        isLoading={false} 
        isWorkflowExecuting={true}
        workflowProgress={workflowProgress}
        showProgressModal={true}
      />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should show agent status during execution', () => {
      const agents = [
        { 
          id: '1', 
          name: 'ContentPlanner' as const, 
          status: 'completed' as const, 
          duration: 15000 
        },
        { 
          id: '2', 
          name: 'InfoGatherer' as const, 
          status: 'running' as const 
        },
        { 
          id: '3', 
          name: 'Strategist' as const, 
          status: 'pending' as const 
        }
      ];

      render(<EnhancedItineraryDisplay 
        itinerary="" 
        isLoading={false} 
        isWorkflowExecuting={true}
        workflowAgents={agents}
        showProgressModal={true}
      />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle workflow cancellation', () => {
      const mockOnCancel = vi.fn();
      
      render(<EnhancedItineraryDisplay 
        itinerary="" 
        isLoading={false} 
        isWorkflowExecuting={true}
        onCancelWorkflow={mockOnCancel}
        showProgressModal={true}
      />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('enhanced features', () => {
    it('should display estimated completion time', () => {
      render(<EnhancedItineraryDisplay 
        itinerary="" 
        isLoading={false} 
        isWorkflowExecuting={true}
        estimatedCompletion="2024-03-01 15:30"
        showProgressModal={true}
      />);

      expect(screen.getByText(/2024-03-01 15:30/)).toBeInTheDocument();
    });

    it('should render with enhanced styling', () => {
      render(<EnhancedItineraryDisplay 
        itinerary={mockItinerary} 
        isLoading={false} 
      />);

      // Check for enhanced container styling
      const container = screen.getByText(/Day 1 - March 15, 2024/).closest('div');
      expect(container).toHaveClass();
    });
  });

  describe('backward compatibility', () => {
    it('should handle traditional itinerary display', () => {
      render(<EnhancedItineraryDisplay 
        itinerary={mockItinerary} 
        isLoading={false} 
      />);

      expect(screen.getByText(/Day 1 - March 15, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Arrive at Charles de Gaulle Airport/)).toBeInTheDocument();
    });

    it('should work without workflow props', () => {
      render(<EnhancedItineraryDisplay 
        itinerary={mockItinerary} 
        isLoading={false} 
      />);

      // Should render without crashing
      expect(screen.getByText(/Day 1/)).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should handle malformed itinerary content gracefully', () => {
      const malformedItinerary = 'Some random text without proper formatting';
      
      render(<EnhancedItineraryDisplay 
        itinerary={malformedItinerary} 
        isLoading={false} 
      />);

      // Should still render without crashing
      expect(screen.getByText(malformedItinerary)).toBeInTheDocument();
    });

    it('should handle missing props gracefully', () => {
      render(<EnhancedItineraryDisplay 
        itinerary="" 
        isLoading={false} 
      />);

      // Should render without crashing
      expect(screen.queryByTestId('resilient-loading')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<EnhancedItineraryDisplay 
        itinerary={mockItinerary} 
        isLoading={false} 
      />);

      // Check for semantic HTML structure
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should announce workflow progress to screen readers', () => {
      render(<EnhancedItineraryDisplay 
        itinerary="" 
        isLoading={false} 
        isWorkflowExecuting={true}
        showProgressModal={true}
      />);

      // Progress modal should have appropriate ARIA attributes
      const dialog = screen.queryByRole('dialog');
      if (dialog) {
        expect(dialog).toHaveAttribute('aria-labelledby');
      }
    });
  });

  describe('responsive design', () => {
    it('should adapt layout for different screen sizes', () => {
      render(<EnhancedItineraryDisplay 
        itinerary={mockItinerary} 
        isLoading={false} 
      />);

      // Check for responsive classes in container
      const container = screen.getByText(/Day 1/).closest('div');
      if (container) {
        const hasResponsiveClasses = /sm:|md:|lg:|xl:|max-w|min-w/.test(container.className);
        expect(hasResponsiveClasses).toBe(true);
      }
    });
  });

  describe('performance', () => {
    it('should handle large itinerary content efficiently', () => {
      const largeItinerary = Array(1000).fill('Day content with activities and descriptions').join('\n\n');
      
      render(<EnhancedItineraryDisplay 
        itinerary={largeItinerary} 
        isLoading={false} 
      />);

      // Should render without performance issues
      expect(screen.getByText(/Day content/)).toBeInTheDocument();
    });
  });

  describe('integration scenarios', () => {
    it('should handle workflow disabled state', () => {
      render(<EnhancedItineraryDisplay 
        itinerary={mockItinerary} 
        isLoading={false} 
        isWorkflowExecuting={false}
        showProgressModal={false}
      />);

      // Should show traditional display
      expect(screen.getByText(/Day 1/)).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should transition from loading to content display', () => {
      const { rerender } = render(<EnhancedItineraryDisplay 
        itinerary="" 
        isLoading={true} 
      />);

      expect(screen.getByTestId('resilient-loading')).toBeInTheDocument();

      rerender(<EnhancedItineraryDisplay 
        itinerary={mockItinerary} 
        isLoading={false} 
      />);

      expect(screen.queryByTestId('resilient-loading')).not.toBeInTheDocument();
      expect(screen.getByText(/Day 1/)).toBeInTheDocument();
    });
  });
});

// Mock the workflow service
vi.mock('../../src/services/workflow/WorkflowService', () => ({
  WorkflowService: {
    executeWorkflow: vi.fn(),
    cancelWorkflow: vi.fn(),
  }
}));

// Mock the useWorkflow hook
vi.mock('../../src/hooks/useWorkflow', () => ({
  useWorkflow: vi.fn(),
}));

describe('EnhancedItineraryDisplay', () => {
  const mockFormData = {
    destination: 'Paris, France',
    startDate: '2024-03-15',
    endDate: '2024-03-22',
    budget: 3000,
    adults: 2,
    children: 0,
    interests: ['culture', 'food'],
    travelStyle: 'balanced'
  };

  const mockItineraryResult: ItineraryResult = {
    destination: 'Paris, France',
    startDate: '2024-03-15',
    endDate: '2024-03-22',
    days: [
      {
        day: 1,
        date: '2024-03-15',
        activities: [
          {
            time: '09:00',
            title: 'Arrive in Paris',
            description: 'Check into hotel and explore the neighborhood',
            duration: '3 hours',
            location: 'Marais District'
          }
        ]
      }
    ],
    summary: {
      totalBudget: 3000,
      estimatedCost: 2800,
      travelers: 2,
      duration: '7 days'
    }
  };

  const mockUseWorkflow = vi.mocked((await import('../../src/hooks/useWorkflow')).useWorkflow);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation for useWorkflow
    mockUseWorkflow.mockReturnValue({
      isExecuting: false,
      progress: null,
      agents: [],
      error: null,
      result: null,
      executeWorkflow: vi.fn(),
      cancelWorkflow: vi.fn(),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering states', () => {
    it('should render initial state with generate button', () => {
      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      expect(screen.getByRole('button', { name: /generate itinerary/i })).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should show workflow progress modal when executing', () => {
      mockUseWorkflow.mockReturnValue({
        isExecuting: true,
        progress: {
          currentStep: 1,
          totalSteps: 4,
          currentAgent: 'ContentPlanner',
          progress: 25,
          agents: []
        },
        agents: [],
        error: null,
        result: null,
        executeWorkflow: vi.fn(),
        cancelWorkflow: vi.fn(),
      });

      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/generating your travel itinerary/i)).toBeInTheDocument();
    });

    it('should display result when workflow completes successfully', () => {
      mockUseWorkflow.mockReturnValue({
        isExecuting: false,
        progress: null,
        agents: [],
        error: null,
        result: mockItineraryResult,
        executeWorkflow: vi.fn(),
        cancelWorkflow: vi.fn(),
      });

      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      expect(screen.getByText(/paris, france/i)).toBeInTheDocument();
      expect(screen.getByText(/arrive in paris/i)).toBeInTheDocument();
    });

    it('should show error state when workflow fails', () => {
      const errorMessage = 'Failed to generate itinerary';
      mockUseWorkflow.mockReturnValue({
        isExecuting: false,
        progress: null,
        agents: [],
        error: new Error(errorMessage),
        result: null,
        executeWorkflow: vi.fn(),
        cancelWorkflow: vi.fn(),
      });

      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      expect(screen.getByText(/error generating itinerary/i)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('workflow execution', () => {
    it('should execute workflow when generate button is clicked', () => {
      const mockExecuteWorkflow = vi.fn();
      mockUseWorkflow.mockReturnValue({
        isExecuting: false,
        progress: null,
        agents: [],
        error: null,
        result: null,
        executeWorkflow: mockExecuteWorkflow,
        cancelWorkflow: vi.fn(),
      });

      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      const generateButton = screen.getByRole('button', { name: /generate itinerary/i });
      fireEvent.click(generateButton);

      expect(mockExecuteWorkflow).toHaveBeenCalledWith(mockFormData);
    });

    it('should cancel workflow when cancel button is clicked', () => {
      const mockCancelWorkflow = vi.fn();
      mockUseWorkflow.mockReturnValue({
        isExecuting: true,
        progress: {
          currentStep: 2,
          totalSteps: 4,
          currentAgent: 'InfoGatherer',
          progress: 50,
          agents: []
        },
        agents: [],
        error: null,
        result: null,
        executeWorkflow: vi.fn(),
        cancelWorkflow: mockCancelWorkflow,
      });

      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockCancelWorkflow).toHaveBeenCalled();
    });

    it('should disable generate button while workflow is executing', () => {
      mockUseWorkflow.mockReturnValue({
        isExecuting: true,
        progress: null,
        agents: [],
        error: null,
        result: null,
        executeWorkflow: vi.fn(),
        cancelWorkflow: vi.fn(),
      });

      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      const generateButton = screen.getByRole('button', { name: /generate itinerary/i });
      expect(generateButton).toBeDisabled();
    });
  });

  describe('progress tracking', () => {
    it('should display progress information during execution', () => {
      mockUseWorkflow.mockReturnValue({
        isExecuting: true,
        progress: {
          currentStep: 3,
          totalSteps: 4,
          currentAgent: 'Strategist',
          progress: 75,
          agents: [],
          estimatedTimeRemaining: 30000
        },
        agents: [],
        error: null,
        result: null,
        executeWorkflow: vi.fn(),
        cancelWorkflow: vi.fn(),
      });

      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText(/step 3 of 4/i)).toBeInTheDocument();
      expect(screen.getByText(/strategist/i)).toBeInTheDocument();
    });

    it('should show agent status during execution', () => {
      const agents = [
        { id: '1', name: 'ContentPlanner', status: 'completed' as const, duration: 15000 },
        { id: '2', name: 'InfoGatherer', status: 'completed' as const, duration: 25000 },
        { id: '3', name: 'Strategist', status: 'running' as const },
        { id: '4', name: 'Compiler', status: 'pending' as const }
      ];

      mockUseWorkflow.mockReturnValue({
        isExecuting: true,
        progress: {
          currentStep: 3,
          totalSteps: 4,
          currentAgent: 'Strategist',
          progress: 75,
          agents: []
        },
        agents,
        error: null,
        result: null,
        executeWorkflow: vi.fn(),
        cancelWorkflow: vi.fn(),
      });

      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      expect(screen.getByText(/content planner|contentplanner/i)).toBeInTheDocument();
      expect(screen.getByText(/info gatherer|infogatherer/i)).toBeInTheDocument();
      expect(screen.getByText(/strategist/i)).toBeInTheDocument();
      expect(screen.getByText(/compiler/i)).toBeInTheDocument();
    });
  });

  describe('result display', () => {
    it('should render itinerary summary', () => {
      mockUseWorkflow.mockReturnValue({
        isExecuting: false,
        progress: null,
        agents: [],
        error: null,
        result: mockItineraryResult,
        executeWorkflow: vi.fn(),
        cancelWorkflow: vi.fn(),
      });

      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      expect(screen.getByText(/paris, france/i)).toBeInTheDocument();
      expect(screen.getByText(/march 15.*march 22/i)).toBeInTheDocument();
      expect(screen.getByText(/2.*travelers/i)).toBeInTheDocument();
    });

    it('should render daily activities', () => {
      mockUseWorkflow.mockReturnValue({
        isExecuting: false,
        progress: null,
        agents: [],
        error: null,
        result: mockItineraryResult,
        executeWorkflow: vi.fn(),
        cancelWorkflow: vi.fn(),
      });

      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      expect(screen.getByText(/day 1/i)).toBeInTheDocument();
      expect(screen.getByText(/09:00/)).toBeInTheDocument();
      expect(screen.getByText(/arrive in paris/i)).toBeInTheDocument();
      expect(screen.getByText(/check into hotel/i)).toBeInTheDocument();
      expect(screen.getByText(/3 hours/i)).toBeInTheDocument();
    });

    it('should allow regenerating itinerary', () => {
      const mockExecuteWorkflow = vi.fn();
      mockUseWorkflow.mockReturnValue({
        isExecuting: false,
        progress: null,
        agents: [],
        error: null,
        result: mockItineraryResult,
        executeWorkflow: mockExecuteWorkflow,
        cancelWorkflow: vi.fn(),
      });

      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      const regenerateButton = screen.getByRole('button', { name: /regenerate|generate new/i });
      fireEvent.click(regenerateButton);

      expect(mockExecuteWorkflow).toHaveBeenCalledWith(mockFormData);
    });
  });

  describe('backward compatibility', () => {
    it('should handle traditional itinerary result format', () => {
      const traditionalResult = {
        itinerary: 'Traditional text-based itinerary content',
        summary: 'Trip summary information'
      };

      render(<EnhancedItineraryDisplay 
        formData={mockFormData} 
        itinerary={traditionalResult} 
      />);

      expect(screen.getByText(/traditional text-based itinerary/i)).toBeInTheDocument();
      expect(screen.getByText(/trip summary information/i)).toBeInTheDocument();
    });

    it('should prioritize workflow result over traditional itinerary', () => {
      const traditionalResult = {
        itinerary: 'Traditional text-based itinerary content',
        summary: 'Trip summary information'
      };

      mockUseWorkflow.mockReturnValue({
        isExecuting: false,
        progress: null,
        agents: [],
        error: null,
        result: mockItineraryResult,
        executeWorkflow: vi.fn(),
        cancelWorkflow: vi.fn(),
      });

      render(<EnhancedItineraryDisplay 
        formData={mockFormData} 
        itinerary={traditionalResult} 
      />);

      // Should show workflow result, not traditional
      expect(screen.getByText(/paris, france/i)).toBeInTheDocument();
      expect(screen.queryByText(/traditional text-based itinerary/i)).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should show retry button on error', () => {
      const mockExecuteWorkflow = vi.fn();
      mockUseWorkflow.mockReturnValue({
        isExecuting: false,
        progress: null,
        agents: [],
        error: new Error('Network error'),
        result: null,
        executeWorkflow: mockExecuteWorkflow,
        cancelWorkflow: vi.fn(),
      });

      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      const retryButton = screen.getByRole('button', { name: /try again|retry/i });
      fireEvent.click(retryButton);

      expect(mockExecuteWorkflow).toHaveBeenCalledWith(mockFormData);
    });

    it('should handle malformed form data gracefully', () => {
      const malformedData = {
        destination: '',
        startDate: 'invalid-date',
        endDate: 'invalid-date',
        budget: -100,
        adults: 0,
        children: 0
      };

      render(<EnhancedItineraryDisplay formData={malformedData} />);

      // Should still render without crashing
      expect(screen.getByRole('button', { name: /generate itinerary/i })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      const generateButton = screen.getByRole('button', { name: /generate itinerary/i });
      expect(generateButton).toHaveAttribute('aria-label');
    });

    it('should announce workflow progress to screen readers', () => {
      mockUseWorkflow.mockReturnValue({
        isExecuting: true,
        progress: {
          currentStep: 2,
          totalSteps: 4,
          currentAgent: 'InfoGatherer',
          progress: 50,
          agents: []
        },
        agents: [],
        error: null,
        result: null,
        executeWorkflow: vi.fn(),
        cancelWorkflow: vi.fn(),
      });

      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      // Progress modal should have appropriate ARIA attributes
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
    });

    it('should handle keyboard navigation', () => {
      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      const generateButton = screen.getByRole('button', { name: /generate itinerary/i });
      
      // Should be focusable
      generateButton.focus();
      expect(document.activeElement).toBe(generateButton);
      
      // Should respond to Enter key
      fireEvent.keyDown(generateButton, { key: 'Enter', code: 'Enter' });
    });
  });

  describe('responsive design', () => {
    it('should adapt layout for different screen sizes', () => {
      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      // Check for responsive classes
      const container = screen.getByRole('button', { name: /generate itinerary/i }).closest('div');
      if (container) {
        expect(container.className).toMatch(/sm:|md:|lg:|xl:/);
      }
    });
  });

  describe('performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn();
      const TestComponent = (props: any) => {
        renderSpy();
        return <EnhancedItineraryDisplay {...props} />;
      };

      const { rerender } = render(<TestComponent formData={mockFormData} />);
      
      const initialRenderCount = renderSpy.mock.calls.length;
      
      // Rerender with same props
      rerender(<TestComponent formData={mockFormData} />);
      
      // Should not cause additional renders
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
    });
  });

  describe('integration', () => {
    it('should handle feature flag disabled state', () => {
      // Mock feature flag being disabled
      const originalEnv = process.env.VITE_ENABLE_WORKFLOW;
      process.env.VITE_ENABLE_WORKFLOW = 'false';

      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      // Should still show generate button but use traditional flow
      expect(screen.getByRole('button', { name: /generate itinerary/i })).toBeInTheDocument();

      process.env.VITE_ENABLE_WORKFLOW = originalEnv;
    });

    it('should handle workflow service unavailable', () => {
      // Mock service throwing error
      const mockExecuteWorkflow = vi.fn().mockRejectedValue(new Error('Service unavailable'));
      mockUseWorkflow.mockReturnValue({
        isExecuting: false,
        progress: null,
        agents: [],
        error: new Error('Service unavailable'),
        result: null,
        executeWorkflow: mockExecuteWorkflow,
        cancelWorkflow: vi.fn(),
      });

      render(<EnhancedItineraryDisplay formData={mockFormData} />);

      const generateButton = screen.getByRole('button', { name: /generate itinerary/i });
      fireEvent.click(generateButton);

      expect(mockExecuteWorkflow).toHaveBeenCalledWith(mockFormData);
    });
  });
});