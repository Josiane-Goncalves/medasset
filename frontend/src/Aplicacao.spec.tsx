import { fireEvent, render, screen, within } from '@testing-library/react';
import { Aplicacao } from './Aplicacao';

it('mantém cadastro e listagem na mesma tela e atualiza a lista após cadastrar', async () => {
  const fetchOriginal = globalThis.fetch;
  let cadastrado = false;
  const equipamento = {
    id: 'equipamento-1',
    equipamento: 'Monitor',
    marca: 'Philips',
    modelo: 'MP20',
    numeroSerie: 'SN001',
    patrimonio: null,
  };
  globalThis.fetch = jest
    .fn()
    .mockImplementation(async (_url, opcoes: RequestInit) => {
      if (opcoes.method === 'POST') {
        cadastrado = true;
        return { status: 201 };
      }
      return {
        status: 200,
        json: async () => (cadastrado ? [equipamento] : []),
      };
    });

  try {
    render(<Aplicacao urlApi="http://localhost:3000" />);
    expect(
      screen.getByRole('heading', { name: 'Novo equipamento' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Inventário de equipamentos' }),
    ).toBeVisible();
    await screen.findByText('Nenhum equipamento cadastrado.');

    for (const [rotulo, valor] of [
      ['Equipamento', equipamento.equipamento],
      ['Marca', equipamento.marca],
      ['Modelo', equipamento.modelo],
      ['Número de série', equipamento.numeroSerie],
    ]) {
      fireEvent.change(screen.getByRole('textbox', { name: rotulo }), {
        target: { value: valor },
      });
    }
    fireEvent.click(
      screen.getByRole('button', { name: 'Cadastrar equipamento' }),
    );

    expect(
      await screen.findByText('Equipamento cadastrado com sucesso.'),
    ).toBeVisible();
    const tabela = await screen.findByRole('table', {
      name: 'Inventário de equipamentos',
    });
    expect(within(tabela).getByRole('cell', { name: 'SN001' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Equipamento' })).toHaveValue(
      '',
    );
    expect(
      screen.queryByText('Nenhum equipamento cadastrado.'),
    ).not.toBeInTheDocument();
  } finally {
    globalThis.fetch = fetchOriginal;
  }
});
