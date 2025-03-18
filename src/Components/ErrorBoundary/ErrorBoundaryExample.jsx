import React, { useState } from 'react';
import ErrorBoundary from './ErrorBoundary';

// A component that throws an error when a button is clicked
const BuggyCounter = () => {
  const [counter, setCounter] = useState(0);
  
  const handleClick = () => {
    setCounter(prevCounter => {
      // Throw an error when counter reaches 5
      if (prevCounter === 4) {
        throw new Error('Simulated error: Counter reached 5!');
      }
      return prevCounter + 1;
    });
  };

  return (
    <div>
      <p>Counter: {counter}</p>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
};

// Custom fallback component that allows resetting the error boundary
const ErrorFallback = ({ resetErrorBoundary }) => (
  <div>
    <p>Something went wrong with the counter.</p>
    {resetErrorBoundary && (
      <button onClick={resetErrorBoundary}>Reset</button>
    )}
  </div>
);

// Example usage of ErrorBoundary
const ErrorBoundaryExample = () => {
  const [key, setKey] = useState(0);

  const handleReset = () => {
    // Reset the error boundary by changing the key
    setKey(prevKey => prevKey + 1);
  };

  return (
    <div>
      <h1>Error Boundary Example</h1>
      <p>Click the button to increment the counter. At count 5, it will throw an error.</p>
      
      <ErrorBoundary key={key} fallback={<ErrorFallback resetErrorBoundary={handleReset} />}>
        <BuggyCounter />
      </ErrorBoundary>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Other content</h2>
        <p>This content will still be visible even when the counter crashes.</p>
      </div>
    </div>
  );
};

export default ErrorBoundaryExample; 