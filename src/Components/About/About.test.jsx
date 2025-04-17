import React from 'react';
import { render, screen, within } from '@testing-library/react';
import About from './About';

describe('About', () => {
  beforeEach(() => {
    render(<About />);
  });

  it('renders main headings', () => {
    expect(screen.getByRole('heading', { name: /About Our Journal/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Editorial Board/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Mission Statement/i })).toBeInTheDocument();
  });

  it('renders administrators', () => {
    expect(screen.getByText(/Aayush Daftary/i)).toBeInTheDocument();
    expect(screen.getByText(/Lead Administrator/i)).toBeInTheDocument();
    expect(screen.getByText(/Aurora Cruci/i)).toBeInTheDocument();
    expect(screen.getByText(/System Administrator/i)).toBeInTheDocument();
  });

  it('renders editorial staff', () => {
    expect(screen.getByText(/Eli Edme/i)).toBeInTheDocument();
    expect(screen.getByText(/Ricky Zapata/i)).toBeInTheDocument();
  
    const editorialStaffSection = screen.getByText(/Editorial Staff/i).closest('.role-section');
    const editorTitles = within(editorialStaffSection).getAllByText('Editor');
    expect(editorTitles).toHaveLength(2);
  });   

  it('renders referees', () => {
    expect(screen.getByText(/Sam Huppert/i)).toBeInTheDocument();
    expect(screen.getByText(/Lead Referee/i)).toBeInTheDocument();
  });

  it('includes mission statement text', () => {
    expect(screen.getByText(/Our mission is to publish high-quality, peer-reviewed research/i)).toBeInTheDocument();
  });
});