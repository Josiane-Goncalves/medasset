import { render, screen, within } from '@testing-library/react';
import { ListaEquipamentos } from './ListaEquipamentos';

const urlApi = 'http://localhost:3000/';
const equipamentos = [
  {
    id: 'equipamento-2',
    equipamento: 'Ventilador',
    marca: 'Dräger',
    modelo: 'Savina',
    numeroSerie: 'SN002',
    patrimonio: 'PAT002',
  },
  {
    id: 'equipamento-1',
    equipamento: 'Monitor',
    marca: 'Philips',
    modelo: 'MP20',
    numeroSerie: 'SN001',
    patrimonio: null,
  },
];
const requisicao = jest.fn() as jest.MockedFunction<typeof fetch>;
const fetchOriginal = globalThis.fetch;

beforeAll(() => {
  globalThis.fetch = requisicao;
});

beforeEach(() => {
  requisicao.mockReset();
});

afterAll(() => {
  globalThis.fetch = fetchOriginal;
});

it('mostra carregamento enquanto aguarda a API', () => {
  requisicao.mockReturnValue(new Promise(() => {}));
  render(<ListaEquipamentos urlApi={urlApi} />);

  expect(screen.getByRole('status')).toHaveTextContent(
    'Carregando equipamentos…',
  );
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

it('exibe os cinco campos na ordem recebida e usa travessão para patrimônio ausente', async () => {
  requisicao.mockResolvedValue({
    status: 200,
    json: async () => equipamentos,
  } as Response);
  render(<ListaEquipamentos urlApi={urlApi} />);

  const tabela = await screen.findByRole('table', {
    name: 'Equipamentos cadastrados',
  });
  const linhas = within(tabela).getAllByRole('row').slice(1);

  expect(
    linhas.map((linha) =>
      within(linha)
        .getAllByRole('cell')
        .map((celula) => celula.textContent),
    ),
  ).toEqual([
    ['Ventilador', 'Dräger', 'Savina', 'SN002', 'PAT002'],
    ['Monitor', 'Philips', 'MP20', 'SN001', '—'],
  ]);
  expect(requisicao).toHaveBeenCalledWith(
    'http://localhost:3000/equipamentos',
    expect.objectContaining({ method: 'GET' }),
  );
  expect(
    screen.queryByText('Carregando equipamentos…'),
  ).not.toBeInTheDocument();
});

it('mostra mensagem clara quando a lista está vazia', async () => {
  requisicao.mockResolvedValue({
    status: 200,
    json: async () => [],
  } as Response);
  render(<ListaEquipamentos urlApi={urlApi} />);

  expect(
    await screen.findByText('Nenhum equipamento cadastrado.'),
  ).toHaveAttribute('role', 'status');
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

it.each(['erro HTTP', 'falha de rede', 'resposta inválida'])(
  'mostra mensagem amigável para %s sem detalhes internos',
  async (cenario) => {
    if (cenario === 'falha de rede') {
      requisicao.mockRejectedValue(new Error('Detalhe interno da conexão.'));
    } else {
      requisicao.mockResolvedValue({
        status: cenario === 'erro HTTP' ? 500 : 200,
        json: async () => ({ message: 'Detalhe interno do servidor.' }),
      } as Response);
    }
    render(<ListaEquipamentos urlApi={urlApi} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os equipamentos. Tente novamente.',
    );
    expect(screen.queryByText(/Detalhe interno/)).not.toBeInTheDocument();
    expect(
      screen.queryByText('Nenhum equipamento cadastrado.'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Carregando equipamentos…'),
    ).not.toBeInTheDocument();
  },
);
