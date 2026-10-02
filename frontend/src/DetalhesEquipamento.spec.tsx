import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ListaEquipamentos } from './ListaEquipamentos';

const urlApi = 'http://localhost:3000/';
const equipamentos = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    equipamento: 'Monitor',
    marca: 'Philips',
    modelo: 'MP20',
    numeroSerie: 'SN001',
    patrimonio: 'PAT001',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    equipamento: 'Ventilador',
    marca: 'Dräger',
    modelo: 'Savina',
    numeroSerie: 'SN002',
    patrimonio: null,
  },
];
const detalhes = {
  ...equipamentos[0],
  equipamento: 'Monitor atualizado',
  marca: 'GE',
  modelo: 'B125',
  numeroSerie: 'SN-ATUAL',
  patrimonio: null,
  criadoEm: '2026-09-28T12:00:00.000Z',
  atualizadoEm: '2026-09-29T15:30:00.000Z',
};
const requisicao = jest.fn() as jest.MockedFunction<typeof fetch>;
const buscaDetalhes = jest.fn() as jest.MockedFunction<typeof fetch>;
const fetchOriginal = globalThis.fetch;

beforeAll(() => {
  globalThis.fetch = requisicao;
});

beforeEach(() => {
  buscaDetalhes.mockReset();
  requisicao.mockReset();
  requisicao.mockImplementation(async (url, opcoes) => {
    if (url === 'http://localhost:3000/equipamentos') {
      return { status: 200, json: async () => equipamentos } as Response;
    }
    return buscaDetalhes(url, opcoes);
  });
});

afterAll(() => {
  globalThis.fetch = fetchOriginal;
});

async function abrirDetalhes() {
  render(<ListaEquipamentos urlApi={urlApi} />);
  const botao = await screen.findByRole('button', {
    name: 'Ver detalhes de Monitor (SN001)',
  });
  fireEvent.click(botao);
  return botao;
}

it('busca pelo ID, mostra carregamento e os dados completos da API, formata datas e permite fechar', async () => {
  let concluir!: (resposta: Response) => void;
  buscaDetalhes.mockReturnValue(
    new Promise((resolver) => {
      concluir = resolver;
    }),
  );

  const botao = await abrirDetalhes();
  const painel = screen.getByRole('region', {
    name: 'Detalhes do equipamento',
  });

  expect(buscaDetalhes).toHaveBeenCalledWith(
    'http://localhost:3000/equipamentos/' + equipamentos[0].id,
    expect.objectContaining({ method: 'GET' }),
  );
  expect(within(painel).getByRole('status')).toHaveTextContent(
    'Carregando detalhes do equipamento…',
  );
  expect(
    within(painel).getByRole('heading', { name: 'Detalhes do equipamento' }),
  ).toHaveFocus();

  await act(async () => {
    concluir({ status: 200, json: async () => detalhes } as Response);
  });

  for (const valor of ['Monitor atualizado', 'GE', 'B125', 'SN-ATUAL', '—']) {
    expect(within(painel).getByText(valor)).toBeVisible();
  }
  expect(within(painel).queryByText('MP20')).not.toBeInTheDocument();
  expect(within(painel).queryByRole('status')).not.toBeInTheDocument();

  const datas = painel.querySelectorAll('time');
  expect(datas).toHaveLength(2);
  expect(datas[0]).toHaveAttribute('datetime', detalhes.criadoEm);
  expect(datas[1]).toHaveAttribute('datetime', detalhes.atualizadoEm);
  for (const data of datas) {
    expect(data).toHaveTextContent(/\d{2}\/\d{2}\/\d{4}.*\d{2}:\d{2}/);
  }

  fireEvent.click(
    within(painel).getByRole('button', { name: 'Fechar detalhes' }),
  );

  expect(
    screen.queryByRole('region', { name: 'Detalhes do equipamento' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('table')).toBeVisible();
  expect(botao).toHaveFocus();
});

it('mostra mensagem amigável quando a API retorna 404', async () => {
  buscaDetalhes.mockResolvedValue({
    status: 404,
    json: async () => ({ message: 'Detalhe interno do servidor.' }),
  } as Response);

  await abrirDetalhes();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Equipamento não encontrado.',
  );
  expect(screen.queryByText(/Detalhe interno/)).not.toBeInTheDocument();
});

it.each(['erro HTTP', 'falha de rede', 'data inválida na resposta'])(
  'mostra mensagem genérica para %s sem detalhes técnicos',
  async (cenario) => {
    if (cenario === 'falha de rede') {
      buscaDetalhes.mockRejectedValue(new Error('Detalhe interno da conexão.'));
    } else {
      buscaDetalhes.mockResolvedValue({
        status: cenario === 'erro HTTP' ? 500 : 200,
        json: async () =>
          cenario === 'erro HTTP'
            ? { message: 'Detalhe interno do servidor.' }
            : { ...detalhes, criadoEm: 'data-invalida' },
      } as Response);
    }

    await abrirDetalhes();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os detalhes do equipamento. Tente novamente.',
    );
    expect(
      screen.queryByText(/Detalhe interno|data-invalida/),
    ).not.toBeInTheDocument();
  },
);

it('permite fechar durante o carregamento sem reabrir o painel com a resposta atrasada', async () => {
  let concluir!: (resposta: Response) => void;
  buscaDetalhes.mockReturnValue(
    new Promise((resolver) => {
      concluir = resolver;
    }),
  );
  await abrirDetalhes();

  fireEvent.click(screen.getByRole('button', { name: 'Fechar detalhes' }));
  expect(
    screen.queryByRole('region', { name: 'Detalhes do equipamento' }),
  ).not.toBeInTheDocument();

  await act(async () => {
    concluir({ status: 200, json: async () => detalhes } as Response);
  });

  expect(
    screen.queryByRole('region', { name: 'Detalhes do equipamento' }),
  ).not.toBeInTheDocument();
});

it('mantém os detalhes da seleção mais recente quando as respostas chegam fora de ordem', async () => {
  let concluirPrimeiraBusca!: (resposta: Response) => void;
  buscaDetalhes.mockReturnValueOnce(
    new Promise((resolver) => {
      concluirPrimeiraBusca = resolver;
    }),
  );
  buscaDetalhes.mockResolvedValue({
    status: 200,
    json: async () => ({
      ...equipamentos[1],
      criadoEm: detalhes.criadoEm,
      atualizadoEm: detalhes.atualizadoEm,
    }),
  } as Response);
  await abrirDetalhes();

  fireEvent.click(
    screen.getByRole('button', { name: 'Ver detalhes de Ventilador (SN002)' }),
  );
  const painel = screen.getByRole('region', {
    name: 'Detalhes do equipamento',
  });
  expect(await within(painel).findByText('Ventilador')).toBeVisible();

  await act(async () => {
    concluirPrimeiraBusca({
      status: 200,
      json: async () => detalhes,
    } as Response);
  });

  expect(within(painel).getByText('Ventilador')).toBeVisible();
  expect(
    within(painel).queryByText('Monitor atualizado'),
  ).not.toBeInTheDocument();
});
