import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Aplicacao } from './Aplicacao';

const urlApi = 'http://localhost:3000/';
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
const dadosAtualizados = {
  equipamento: 'Ventilador',
  marca: 'Outra marca',
  modelo: 'Outro modelo',
  numeroSerie: 'SN002',
  patrimonio: 'PAT002',
};
const equipamentoAtualizado = {
  ...equipamento,
  ...dadosAtualizados,
  atualizadoEm: '2026-10-01T12:00:00.000Z',
};
const rotulos = {
  equipamento: 'Equipamento',
  marca: 'Marca',
  modelo: 'Modelo',
  numeroSerie: 'Número de série',
  patrimonio: 'Patrimônio (opcional)',
};
const requisicao = jest.fn() as jest.MockedFunction<typeof fetch>;
const atualizacao = jest.fn() as jest.MockedFunction<typeof fetch>;
const fetchOriginal = globalThis.fetch;

beforeAll(() => {
  globalThis.fetch = requisicao;
});

beforeEach(() => {
  requisicao.mockReset();
  atualizacao.mockReset();
  atualizacao.mockResolvedValue({
    status: 200,
    json: async () => equipamentoAtualizado,
  } as Response);
  requisicao.mockImplementation(async (url, opcoes) => {
    if (opcoes?.method === 'PUT') return atualizacao(url, opcoes);
    return {
      status: 200,
      json: async () =>
        url === 'http://localhost:3000/equipamentos'
          ? [equipamento]
          : equipamento,
    } as Response;
  });
});

afterAll(() => {
  globalThis.fetch = fetchOriginal;
});

async function abrirEdicao() {
  render(<Aplicacao urlApi={urlApi} />);
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Ver detalhes de Monitor (SN001)',
    }),
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
  return screen.getByRole('form', { name: 'Edição de equipamento' });
}

it('abre a edição com os dados atuais e permite cancelar sem PUT, restaurando o foco', async () => {
  const formulario = await abrirEdicao();
  for (const nome of Object.keys(rotulos) as (keyof typeof rotulos)[]) {
    expect(
      within(formulario).getByRole('textbox', { name: rotulos[nome] }),
    ).toHaveValue(equipamento[nome]);
  }
  const campo = within(formulario).getByRole('textbox', {
    name: 'Equipamento',
  });
  expect(campo).toHaveFocus();
  fireEvent.change(campo, { target: { value: 'Alteração descartada' } });
  fireEvent.click(within(formulario).getByRole('button', { name: 'Cancelar' }));

  expect(
    screen.queryByRole('form', { name: 'Edição de equipamento' }),
  ).not.toBeInTheDocument();
  const painel = screen.getByRole('region', {
    name: 'Detalhes do equipamento',
  });
  expect(within(painel).getByText('Monitor')).toBeVisible();
  expect(
    within(painel).getByRole('heading', { name: 'Detalhes do equipamento' }),
  ).toHaveFocus();
  expect(atualizacao).not.toHaveBeenCalled();
});

it('envia PUT com os dados alterados e atualiza detalhes e listagem com a resposta', async () => {
  const formulario = await abrirEdicao();
  for (const nome of Object.keys(rotulos) as (keyof typeof rotulos)[]) {
    fireEvent.change(
      within(formulario).getByRole('textbox', { name: rotulos[nome] }),
      {
        target: { value: dadosAtualizados[nome] },
      },
    );
  }
  fireEvent.click(
    within(formulario).getByRole('button', { name: 'Salvar alterações' }),
  );

  expect(
    await screen.findByText('Equipamento atualizado com sucesso.'),
  ).toHaveAttribute('role', 'status');
  expect(atualizacao).toHaveBeenCalledTimes(1);
  expect(atualizacao).toHaveBeenCalledWith(
    'http://localhost:3000/equipamentos/' + equipamento.id,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosAtualizados),
    },
  );
  const painel = screen.getByRole('region', {
    name: 'Detalhes do equipamento',
  });
  const tabela = screen.getByRole('table');
  for (const valor of Object.values(dadosAtualizados)) {
    expect(within(painel).getByText(valor)).toBeVisible();
    expect(within(tabela).getByRole('cell', { name: valor })).toBeVisible();
  }
  expect(painel.querySelectorAll('time')[1]).toHaveAttribute(
    'datetime',
    equipamentoAtualizado.atualizadoEm,
  );
  expect(
    within(painel).getByRole('heading', { name: 'Detalhes do equipamento' }),
  ).toHaveFocus();
  expect(
    screen.queryByRole('form', { name: 'Edição de equipamento' }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('region', { name: 'Novo equipamento' }),
  ).toBeVisible();
});

it('omite patrimônio apagado do payload e mostra sua remoção nos detalhes e na tabela', async () => {
  atualizacao.mockResolvedValue({
    status: 200,
    json: async () => ({ ...equipamento, patrimonio: null }),
  } as Response);
  const formulario = await abrirEdicao();
  fireEvent.change(
    within(formulario).getByRole('textbox', { name: 'Patrimônio (opcional)' }),
    {
      target: { value: '' },
    },
  );
  fireEvent.click(
    within(formulario).getByRole('button', { name: 'Salvar alterações' }),
  );

  await screen.findByText('Equipamento atualizado com sucesso.');
  expect(JSON.parse(atualizacao.mock.calls[0][1]?.body as string)).toEqual({
    equipamento: equipamento.equipamento,
    marca: equipamento.marca,
    modelo: equipamento.modelo,
    numeroSerie: equipamento.numeroSerie,
  });
  expect(
    within(screen.getByRole('table')).getByRole('cell', { name: '—' }),
  ).toBeVisible();
  expect(
    within(
      screen.getByRole('region', { name: 'Detalhes do equipamento' }),
    ).getByText('—'),
  ).toBeVisible();
});

it('impede envio inválido e direciona o foco ao campo para correção', async () => {
  const formulario = await abrirEdicao();
  const campo = within(formulario).getByRole('textbox', {
    name: 'Equipamento',
  });
  fireEvent.change(campo, { target: { value: '' } });
  fireEvent.click(
    within(formulario).getByRole('button', { name: 'Salvar alterações' }),
  );

  expect(campo).toHaveFocus();
  expect(campo).toHaveAttribute('aria-invalid', 'true');
  expect(campo).toHaveAccessibleDescription('Preencha este campo.');
  expect(atualizacao).not.toHaveBeenCalled();
});

it('informa salvamento e bloqueia envios duplicados enquanto aguarda o PUT', async () => {
  let concluir!: (resposta: Response) => void;
  atualizacao.mockReturnValue(
    new Promise((resolver) => {
      concluir = resolver;
    }),
  );
  const formulario = await abrirEdicao();
  fireEvent.click(
    within(formulario).getByRole('button', { name: 'Salvar alterações' }),
  );

  expect(formulario).toHaveAttribute('aria-busy', 'true');
  const botao = within(formulario).getByRole('button', { name: 'Salvando…' });
  expect(botao).toBeDisabled();
  expect(
    within(formulario).getByRole('button', { name: 'Cancelar' }),
  ).toBeDisabled();
  expect(within(formulario).getByRole('status')).toHaveTextContent(
    'Salvando alterações. Aguarde…',
  );
  fireEvent.click(botao);
  fireEvent.submit(formulario);
  expect(atualizacao).toHaveBeenCalledTimes(1);

  await act(async () => {
    concluir({
      status: 200,
      json: async () => equipamentoAtualizado,
    } as Response);
  });
  expect(screen.getByText('Equipamento atualizado com sucesso.')).toBeVisible();
});

it.each([
  {
    cenario: '400',
    status: 400,
    mensagem:
      'Os dados informados são inválidos. Revise os campos e tente novamente.',
  },
  { cenario: '404', status: 404, mensagem: 'Equipamento não encontrado.' },
  {
    cenario: '409',
    status: 409,
    mensagem: 'Já existe um equipamento cadastrado com este número de série.',
  },
  {
    cenario: '500',
    status: 500,
    mensagem: 'Não foi possível atualizar o equipamento. Tente novamente.',
  },
  {
    cenario: 'falha de rede',
    status: 0,
    mensagem: 'Não foi possível atualizar o equipamento. Tente novamente.',
  },
])(
  'mostra mensagem amigável para $cenario e preserva o formulário para correção',
  async ({ status, mensagem }) => {
    if (status === 0) {
      atualizacao.mockRejectedValue(new Error('Detalhe técnico da conexão.'));
    } else {
      atualizacao.mockResolvedValue({
        status,
        json: async () => ({
          message: status === 409 ? mensagem : 'Detalhe técnico do servidor.',
        }),
      } as Response);
    }
    const formulario = await abrirEdicao();
    fireEvent.change(
      within(formulario).getByRole('textbox', { name: 'Modelo' }),
      { target: { value: 'Novo modelo' } },
    );
    fireEvent.click(
      within(formulario).getByRole('button', { name: 'Salvar alterações' }),
    );

    expect(await within(formulario).findByRole('alert')).toHaveTextContent(
      mensagem,
    );
    expect(
      within(formulario).getByRole('textbox', { name: 'Modelo' }),
    ).toHaveValue('Novo modelo');
    expect(
      within(formulario).getByRole('button', { name: 'Salvar alterações' }),
    ).toBeEnabled();
    expect(screen.queryByText(/Detalhe técnico/)).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('table')).getByRole('cell', { name: 'MP20' }),
    ).toBeVisible();
  },
);
