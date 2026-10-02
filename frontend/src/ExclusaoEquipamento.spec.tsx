import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ListaEquipamentos } from './ListaEquipamentos';

const equipamento = {
  id: '00000000-0000-4000-8000-000000000001',
  equipamento: 'Monitor',
  marca: 'Philips',
  modelo: 'MP20',
  numeroSerie: 'SN001',
  patrimonio: 'PAT001',
  criadoEm: '2026-09-28T12:00:00.000Z',
  atualizadoEm: '2026-09-28T12:00:00.000Z',
};
const outroEquipamento = {
  ...equipamento,
  id: '00000000-0000-4000-8000-000000000002',
  equipamento: 'Ventilador',
  numeroSerie: 'SN002',
};
const requisicao = jest.fn() as jest.MockedFunction<typeof fetch>;
const exclusao = jest.fn() as jest.MockedFunction<typeof fetch>;
const fetchOriginal = globalThis.fetch;

beforeAll(() => {
  globalThis.fetch = requisicao;
});

beforeEach(() => {
  requisicao.mockReset();
  exclusao.mockReset();
  exclusao.mockResolvedValue({ status: 204 } as Response);
  requisicao.mockImplementation(async (url, opcoes) => {
    if (opcoes?.method === 'DELETE') return exclusao(url, opcoes);
    return {
      status: 200,
      json: async () =>
        url === 'http://localhost:3000/equipamentos'
          ? [equipamento, outroEquipamento]
          : equipamento,
    } as Response;
  });
});

afterAll(() => {
  globalThis.fetch = fetchOriginal;
});

async function abrirConfirmacao() {
  render(<ListaEquipamentos urlApi="http://localhost:3000/" />);
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Ver detalhes de Monitor (SN001)',
    }),
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }));
  return screen.getByRole('group', {
    name: 'Tem certeza que deseja excluir este equipamento?',
  });
}

it('mostra confirmação inline com aviso e foco antes de enviar DELETE', async () => {
  const confirmacao = await abrirConfirmacao();

  expect(confirmacao).toHaveAccessibleDescription(
    'Esta ação não pode ser desfeita.',
  );
  expect(
    within(confirmacao).getByText(
      'Tem certeza que deseja excluir este equipamento?',
    ),
  ).toHaveFocus();
  expect(
    within(confirmacao).getByRole('button', { name: 'Cancelar' }),
  ).toBeVisible();
  expect(
    within(confirmacao).getByRole('button', { name: 'Confirmar exclusão' }),
  ).toBeVisible();
  expect(
    within(
      screen.getByRole('region', { name: 'Detalhes do equipamento' }),
    ).getByText('Monitor'),
  ).toBeVisible();
  expect(exclusao).not.toHaveBeenCalled();
});

it('cancelar retorna aos detalhes com Editar e Excluir sem enviar DELETE', async () => {
  const confirmacao = await abrirConfirmacao();
  fireEvent.click(
    within(confirmacao).getByRole('button', { name: 'Cancelar' }),
  );

  expect(screen.queryByRole('group')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Editar' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Excluir' })).toBeVisible();
  expect(
    screen.getByRole('heading', { name: 'Detalhes do equipamento' }),
  ).toHaveFocus();
  expect(exclusao).not.toHaveBeenCalled();
});

it('confirma um único DELETE e no sucesso remove a linha, fecha detalhes e foca a listagem sem novo GET', async () => {
  let concluir!: (resposta: Response) => void;
  exclusao.mockReturnValue(
    new Promise((resolver) => {
      concluir = resolver;
    }),
  );
  const confirmacao = await abrirConfirmacao();
  fireEvent.click(
    within(confirmacao).getByRole('button', { name: 'Confirmar exclusão' }),
  );

  const botao = within(confirmacao).getByRole('button', { name: 'Excluindo…' });
  expect(botao).toBeDisabled();
  expect(
    within(confirmacao).getByRole('button', { name: 'Cancelar' }),
  ).toBeDisabled();
  expect(within(confirmacao).getByRole('status')).toHaveTextContent(
    'Excluindo equipamento. Aguarde…',
  );
  fireEvent.click(botao);
  expect(exclusao).toHaveBeenCalledTimes(1);
  expect(exclusao).toHaveBeenCalledWith(
    'http://localhost:3000/equipamentos/' + equipamento.id,
    { method: 'DELETE' },
  );

  await act(async () => {
    concluir({ status: 204 } as Response);
  });

  expect(
    screen.queryByRole('region', { name: 'Detalhes do equipamento' }),
  ).not.toBeInTheDocument();
  const tabela = screen.getByRole('table');
  expect(
    within(tabela).queryByRole('cell', { name: 'SN001' }),
  ).not.toBeInTheDocument();
  expect(within(tabela).getByRole('cell', { name: 'SN002' })).toBeVisible();
  expect(
    screen.getByRole('heading', { name: 'Inventário de equipamentos' }),
  ).toHaveFocus();
  expect(requisicao).toHaveBeenCalledTimes(3);
});

it.each([
  { status: 404, mensagem: 'Equipamento não encontrado.' },
  {
    status: 500,
    mensagem: 'Não foi possível excluir o equipamento. Tente novamente.',
  },
])(
  'mantém o equipamento e mostra mensagem amigável para $status',
  async ({ status, mensagem }) => {
    exclusao.mockResolvedValue({
      status,
      json: async () => ({ message: 'Detalhe técnico do servidor.' }),
    } as Response);
    const confirmacao = await abrirConfirmacao();
    fireEvent.click(
      within(confirmacao).getByRole('button', { name: 'Confirmar exclusão' }),
    );

    expect(await within(confirmacao).findByRole('alert')).toHaveTextContent(
      mensagem,
    );
    expect(
      screen.getByRole('region', { name: 'Detalhes do equipamento' }),
    ).toBeVisible();
    expect(
      within(screen.getByRole('table')).getByRole('cell', { name: 'SN001' }),
    ).toBeVisible();
    expect(
      within(confirmacao).getByRole('button', { name: 'Confirmar exclusão' }),
    ).toBeEnabled();
    expect(screen.queryByText(/Detalhe técnico/)).not.toBeInTheDocument();
  },
);
