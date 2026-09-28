import { render, screen } from '@testing-library/react';
import { Aplicacao } from './Aplicacao';

it('apresenta o nome e o objetivo do projeto', () => {
  render(<Aplicacao />);
  expect(
    screen.getByRole('heading', { name: 'MedAsset', level: 1 }),
  ).toBeVisible();
  expect(
    screen.getByText('Controle de equipamentos médico-hospitalares.'),
  ).toBeVisible();
});
