import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmployeeForm } from '../shared/employee-form';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the API module
jest.mock('../../../lib/api/schedule-api', () => ({
  getDepartamentos: jest.fn().mockResolvedValue([
    { clave: '1', nombre: 'Departamento 1' },
    { clave: '2', nombre: 'Departamento 2' },
  ]),
}));

describe('EmployeeForm', () => {
  const mockOnChange = jest.fn();
  const mockOnSelectChange = jest.fn();
  const mockOnSwitchChange = jest.fn();

  const defaultFormData = {
    primerNombre: 'Juan',
    segundoNombre: 'Carlos',
    primerApellido: 'Pérez',
    segundoApellido: 'García',
    rfc: 'PEGJ800101ABC',
    curp: 'PEGJ800101HDFRRN01',
    tarjeta: 12345,
    nombramiento: 'DOCENTE',
    departamento: '1',
    academia: '2',
    tipoNombramientoSecundario: 'BASE',
    permiteChecarConPin: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders PIN permission toggle', async () => {
    render(
      <EmployeeForm
        formData={defaultFormData}
        onChange={mockOnChange}
        onSelectChange={mockOnSelectChange}
        onSwitchChange={mockOnSwitchChange}
      />
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Permitir Check-in con PIN')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'Permite al empleado usar su número de tarjeta para registrar entrada/salida'
      )
    ).toBeInTheDocument();

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).not.toBeChecked();
  });

  it('shows PIN permission toggle as checked when permiteChecarConPin is true', async () => {
    const formDataWithPin = {
      ...defaultFormData,
      permiteChecarConPin: true,
    };

    render(
      <EmployeeForm
        formData={formDataWithPin}
        onChange={mockOnChange}
        onSelectChange={mockOnSelectChange}
        onSwitchChange={mockOnSwitchChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Permitir Check-in con PIN')).toBeInTheDocument();
    });

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeChecked();
  });

  it('calls onSwitchChange when PIN permission toggle is clicked', async () => {
    render(
      <EmployeeForm
        formData={defaultFormData}
        onChange={mockOnChange}
        onSelectChange={mockOnSelectChange}
        onSwitchChange={mockOnSwitchChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Permitir Check-in con PIN')).toBeInTheDocument();
    });

    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);

    expect(mockOnSwitchChange).toHaveBeenCalledWith(
      'permiteChecarConPin',
      true
    );
  });

  it('disables PIN permission toggle when form is submitting', async () => {
    render(
      <EmployeeForm
        formData={defaultFormData}
        onChange={mockOnChange}
        onSelectChange={mockOnSelectChange}
        onSwitchChange={mockOnSwitchChange}
        isSubmitting={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Permitir Check-in con PIN')).toBeInTheDocument();
    });

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeDisabled();
  });

  it('handles missing onSwitchChange prop gracefully', async () => {
    render(
      <EmployeeForm
        formData={defaultFormData}
        onChange={mockOnChange}
        onSelectChange={mockOnSelectChange}
        // onSwitchChange is not provided
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Permitir Check-in con PIN')).toBeInTheDocument();
    });

    const switchElement = screen.getByRole('switch');

    // This should not throw an error
    expect(() => fireEvent.click(switchElement)).not.toThrow();
  });
});
