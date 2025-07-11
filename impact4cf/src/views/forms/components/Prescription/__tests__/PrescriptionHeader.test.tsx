import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
// @ts-ignore
import PrescriptionHeader, { PrescriptionHeaderProps } from '../PrescriptionHeader';

describe('<PrescriptionHeader />', () => {
  const mockOnLoad = jest.fn();
  const baseProps: PrescriptionHeaderProps = {
    onLoadPrescription: mockOnLoad,
    prescriptionHistory: [
      { uid: '1', name: 'First', updatedAt: '2023-01-01' },
      { uid: '2', name: 'Second', updatedAt: '2023-02-01' }
    ],
    currentPrescription: { uid: '2', name: 'Second', updatedAt: '2023-02-01' }
  };

  beforeEach(() => {
    mockOnLoad.mockClear();
  });

  it('initially shows the currentPrescription name', () => {
    render(<PrescriptionHeader {...baseProps} />);
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('renders fallback when history is empty', () => {
    render(
      <PrescriptionHeader
        onLoadPrescription={mockOnLoad}
        prescriptionHistory={[]}
        currentPrescription={undefined}
      />
    );
    expect(screen.getByText('Prescription History')).toBeInTheDocument();
  });

  it('calls onLoadPrescription when selecting a different entry', () => {
    render(<PrescriptionHeader {...baseProps} />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('First'));
    expect(mockOnLoad).toHaveBeenCalledWith(
      expect.objectContaining({ uid: '1', name: 'First' })
    );
  });
});
