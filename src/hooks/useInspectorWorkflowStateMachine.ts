/**
 * Inspector Workflow State Machine
 * Manages complex workflow state transitions with enterprise patterns
 */

import { useReducer, useCallback, useEffect } from 'react';
import { logger } from '../lib/utils/logger';

// Workflow state definitions
export type WorkflowState = 
  | 'idle'
  | 'property_creation'
  | 'property_creation_complete'
  | 'scraping_initiated'
  | 'scraping_in_progress'
  | 'scraping_complete'
  | 'scraping_failed'
  | 'property_selection'
  | 'property_selected'
  | 'inspection_creation'
  | 'inspection_ready'
  | 'inspection_started'
  | 'error_recovery';

export type WorkflowEvent = 
  | { type: 'START_PROPERTY_CREATION' }
  | { type: 'PROPERTY_CREATED'; payload: { propertyId: string } }
  | { type: 'START_SCRAPING'; payload: { url: string } }
  | { type: 'SCRAPING_PROGRESS'; payload: { progress: number } }
  | { type: 'SCRAPING_SUCCESS'; payload: { propertyData: Record<string, unknown> } }
  | { type: 'SCRAPING_FAILED'; payload: { error: string } }
  | { type: 'SELECT_PROPERTY'; payload: { propertyId: string } }
  | { type: 'CREATE_INSPECTION' }
  | { type: 'INSPECTION_CREATED'; payload: { inspectionId: string } }
  | { type: 'START_INSPECTION' }
  | { type: 'RETRY' }
  | { type: 'RESET' };

interface WorkflowContext {
  propertyId?: string;
  inspectionId?: string;
  scrapingProgress?: number;
  error?: string;
  retryCount: number;
  startTime: number;
}

interface WorkflowMachineState {
  state: WorkflowState;
  context: WorkflowContext;
  canTransition: (event: WorkflowEvent) => boolean;
  history: Array<{ state: WorkflowState; timestamp: number; event?: WorkflowEvent }>;
}

// State machine reducer
const workflowReducer = (
  current: WorkflowMachineState,
  event: WorkflowEvent
): WorkflowMachineState => {
  const timestamp = Date.now();
  
  // Log state transition
  logger.logInfo('Workflow state transition', {
    from: current.state,
    event: event.type,
    context: current.context
  });

  switch (current.state) {
    case 'idle':
      if (event.type === 'START_PROPERTY_CREATION') {
        return {
          ...current,
          state: 'property_creation',
          context: {
            ...current.context,
            startTime: timestamp,
            retryCount: 0
          },
          history: [...current.history, { state: 'property_creation', timestamp, event }]
        };
      }
      break;

    case 'property_creation':
      if (event.type === 'PROPERTY_CREATED') {
        return {
          ...current,
          state: 'property_creation_complete',
          context: {
            ...current.context,
            propertyId: event.payload.propertyId
          },
          history: [...current.history, { state: 'property_creation_complete', timestamp, event }]
        };
      }
      break;

    case 'property_creation_complete':
      if (event.type === 'START_SCRAPING') {
        return {
          ...current,
          state: 'scraping_initiated',
          context: {
            ...current.context,
            scrapingProgress: 0
          },
          history: [...current.history, { state: 'scraping_initiated', timestamp, event }]
        };
      }
      if (event.type === 'SELECT_PROPERTY') {
        return {
          ...current,
          state: 'property_selection',
          history: [...current.history, { state: 'property_selection', timestamp, event }]
        };
      }
      break;

    case 'scraping_initiated':
    case 'scraping_in_progress':
      if (event.type === 'SCRAPING_PROGRESS') {
        return {
          ...current,
          state: 'scraping_in_progress',
          context: {
            ...current.context,
            scrapingProgress: event.payload.progress
          },
          history: [...current.history, { state: 'scraping_in_progress', timestamp, event }]
        };
      }
      if (event.type === 'SCRAPING_SUCCESS') {
        return {
          ...current,
          state: 'scraping_complete',
          context: {
            ...current.context,
            scrapingProgress: 100
          },
          history: [...current.history, { state: 'scraping_complete', timestamp, event }]
        };
      }
      if (event.type === 'SCRAPING_FAILED') {
        return {
          ...current,
          state: 'scraping_failed',
          context: {
            ...current.context,
            error: event.payload.error,
            retryCount: current.context.retryCount + 1
          },
          history: [...current.history, { state: 'scraping_failed', timestamp, event }]
        };
      }
      break;

    case 'scraping_complete':
    case 'property_selection':
      if (event.type === 'SELECT_PROPERTY') {
        return {
          ...current,
          state: 'property_selected',
          context: {
            ...current.context,
            propertyId: event.payload.propertyId
          },
          history: [...current.history, { state: 'property_selected', timestamp, event }]
        };
      }
      break;

    case 'property_selected':
      if (event.type === 'CREATE_INSPECTION') {
        return {
          ...current,
          state: 'inspection_creation',
          history: [...current.history, { state: 'inspection_creation', timestamp, event }]
        };
      }
      break;

    case 'inspection_creation':
      if (event.type === 'INSPECTION_CREATED') {
        return {
          ...current,
          state: 'inspection_ready',
          context: {
            ...current.context,
            inspectionId: event.payload.inspectionId
          },
          history: [...current.history, { state: 'inspection_ready', timestamp, event }]
        };
      }
      break;

    case 'inspection_ready':
      if (event.type === 'START_INSPECTION') {
        return {
          ...current,
          state: 'inspection_started',
          history: [...current.history, { state: 'inspection_started', timestamp, event }]
        };
      }
      break;

    case 'scraping_failed':
    case 'error_recovery':
      if (event.type === 'RETRY' && current.context.retryCount < 3) {
        return {
          ...current,
          state: 'property_creation',
          context: {
            ...current.context,
            error: undefined
          },
          history: [...current.history, { state: 'property_creation', timestamp, event }]
        };
      }
      break;
  }

  // Reset event
  if (event.type === 'RESET') {
    return {
      state: 'idle',
      context: {
        retryCount: 0,
        startTime: timestamp
      },
      canTransition: () => true,
      history: [{ state: 'idle', timestamp }]
    };
  }

  // No valid transition found
  logger.logWarning('Invalid workflow transition attempted', {
    currentState: current.state,
    event: event.type,
    context: current.context
  });

  return current;
};

// Hook implementation
export const useInspectorWorkflowStateMachine = () => {
  const [machine, dispatch] = useReducer(workflowReducer, {
    state: 'idle',
    context: {
      retryCount: 0,
      startTime: Date.now()
    },
    canTransition: (event: WorkflowEvent) => {
      // Simplified transition validation
      return true;
    },
    history: [{ state: 'idle', timestamp: Date.now() }]
  });

  const transitionTo = useCallback((event: WorkflowEvent) => {
    if (machine.canTransition(event)) {
      dispatch(event);
    } else {
      logger.logError('Workflow transition blocked', {
        currentState: machine.state,
        blockedEvent: event.type
      });
    }
  }, [machine]);

  const isInState = useCallback((state: WorkflowState) => {
    return machine.state === state;
  }, [machine.state]);

  const canTransitionTo = useCallback((event: WorkflowEvent) => {
    return machine.canTransition(event);
  }, [machine]);

  const getWorkflowProgress = useCallback(() => {
    const stateProgress = {
      'idle': 0,
      'property_creation': 10,
      'property_creation_complete': 20,
      'scraping_initiated': 30,
      'scraping_in_progress': 40 + (machine.context.scrapingProgress || 0) * 0.3,
      'scraping_complete': 70,
      'property_selection': 75,
      'property_selected': 80,
      'inspection_creation': 90,
      'inspection_ready': 95,
      'inspection_started': 100,
      'scraping_failed': 35,
      'error_recovery': 35
    };

    return stateProgress[machine.state] || 0;
  }, [machine.state, machine.context.scrapingProgress]);

  // Auto-advance to property selection after successful scraping
  useEffect(() => {
    if (machine.state === 'scraping_complete') {
      const timer = setTimeout(() => {
        dispatch({ type: 'SELECT_PROPERTY', payload: { propertyId: machine.context.propertyId || '' } });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [machine.state, machine.context.propertyId]);

  return {
    state: machine.state,
    context: machine.context,
    history: machine.history,
    transitionTo,
    isInState,
    canTransitionTo,
    getWorkflowProgress,
    reset: () => dispatch({ type: 'RESET' })
  };
};
