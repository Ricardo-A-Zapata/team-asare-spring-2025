import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// A component that throws an error
const ProblemChild = () => {
  throw new Error('Error thrown from problem child');
  // eslint-disable-next-line no-unreachable
  return <div>Error</div>;
};

// A component that doesn't throw an error
const GoodChild = () => <div>Good Child</div>;

describe('ErrorBoundary', () => {
  // Prevent the console.error output in tests
  const originalConsoleError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Good Child')).toBeInTheDocument();
  });

  test('renders fallback UI when there is an error', () => {
    const { container } = render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );
    
    expect(container.querySelector('.error-boundary')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  test('renders custom fallback UI when provided', () => {
    const { container } = render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error Message</div>}>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(container.querySelector('.error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom Error Message')).toBeInTheDocument();
  });
});
