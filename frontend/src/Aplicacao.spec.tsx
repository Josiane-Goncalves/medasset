import { act, fireEvent, render, screen } from '@testing-library/react';
import { Aplicacao } from './Aplicacao';

const urlApi = 'http://localhost:3000/';
const dadosValidos = {
  equipamento: 'Monitor cardíaco',
  marca: 'Philips',
  modelo: 'IntelliVue MX',
  numeroSerie: 'SN-2026-001',
  patrimonio: 'PAT-001',
};
const rotulos = {
  equipamento: 'Equipamento',
  marca: 'Marca',
  modelo: 'Modelo',
  numeroSerie: 'Número de série',
  patrimonio: 'Patrimônio (opcional)',
};
const requisicao = jest.fn() as jest.MockedFunction<typeof fetch>;
const fetchOriginal = globalThis.fetch;

beforeAll(() => {
  globalThis.fetch = requisicao;
});

beforeEach(() => {
  requisicao.mockReset();
  requisicao.mockResolvedValue({ status: 201 } as Response);
});

afterAll(() => {
  globalThis.fetch = fetchOriginal;
});

function preencherFormulario(dados = dadosValidos) {
  for (const nome of Object.keys(rotulos) as (keyof typeof rotulos)[]) {
    fireEvent.change(screen.getByRole('textbox', { name: rotulos[nome] }), {
      target: { value: dados[nome] },
    });
  }
}

function enviarFormulario() {
  fireEvent.click(
    screen.getByRole('button', { name: 'Cadastrar equipamento' }),
  );
}

it('apresenta o título e os cinco campos com labels e obrigatoriedade', () => {
  render(<Aplicacao urlApi={urlApi} />);

  expect(
    screen.getByRole('heading', { name: 'Cadastro de equipamento' }),
  ).toBeVisible();
  expect(screen.getAllByRole('textbox')).toHaveLength(5);
  for (const nome of Object.keys(rotulos) as (keyof typeof rotulos)[]) {
    const campo = screen.getByRole('textbox', { name: rotulos[nome] });
    expect(campo).toBeVisible();
    if (nome === 'patrimonio') {
      expect(campo).not.toBeRequired();
    } else {
      expect(campo).toBeRequired();
    }
  }
});

it.each([
  ['obrigatório ausente', 'equipamento', '', 'Preencha este campo.'],
  ['abaixo do limite', 'equipamento', 'A', 'Use de 2 a 20 caracteres.'],
  [
    'acima do limite',
    'equipamento',
    'A'.repeat(21),
    'Use de 2 a 20 caracteres.',
  ],
  [
    'patrimônio preenchido inválido',
    'patrimonio',
    'A',
    'Use de 2 a 20 caracteres.',
  ],
] as const)(
  'impede envio com %s e indica o campo a corrigir',
  (_cenario, nome, valor, mensagem) => {
    render(<Aplicacao urlApi={urlApi} />);
    preencherFormulario({ ...dadosValidos, [nome]: valor });

    enviarFormulario();

    const campo = screen.getByRole('textbox', { name: rotulos[nome] });
    expect(campo).toHaveFocus();
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription(mensagem);
    expect(requisicao).not.toHaveBeenCalled();
  },
);

it('envia os dados por POST e, ao receber 201, limpa o formulário e confirma o cadastro', async () => {
  render(<Aplicacao urlApi={urlApi} />);
  preencherFormulario();

  enviarFormulario();

  expect(
    await screen.findByText('Equipamento cadastrado com sucesso.'),
  ).toHaveAttribute('role', 'status');
  expect(requisicao).toHaveBeenCalledTimes(1);
  expect(requisicao).toHaveBeenCalledWith(
    'http://localhost:3000/equipamentos',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosValidos),
    },
  );
  for (const campo of screen.getAllByRole('textbox')) {
    expect(campo).toHaveValue('');
  }
});

it('omite o patrimônio vazio do envio e permite cadastrar sem ele', async () => {
  render(<Aplicacao urlApi={urlApi} />);
  preencherFormulario({ ...dadosValidos, patrimonio: '' });

  enviarFormulario();

  expect(
    await screen.findByText('Equipamento cadastrado com sucesso.'),
  ).toBeVisible();
  const corpo = JSON.parse(
    requisicao.mock.calls[0][1]?.body as string,
  ) as object;
  expect(corpo).toEqual({
    equipamento: dadosValidos.equipamento,
    marca: dadosValidos.marca,
    modelo: dadosValidos.modelo,
    numeroSerie: dadosValidos.numeroSerie,
  });
});

it('aceita valores nos limites mínimo e máximo sem alterar os dados', async () => {
  render(<Aplicacao urlApi={urlApi} />);
  const dados = { ...dadosValidos, equipamento: 'AB', modelo: 'M'.repeat(20) };
  preencherFormulario(dados);

  enviarFormulario();

  expect(
    await screen.findByText('Equipamento cadastrado com sucesso.'),
  ).toBeVisible();
  expect(requisicao.mock.calls[0][1]?.body).toBe(JSON.stringify(dados));
});

it('apresenta mensagem amigável para 400 e preserva os dados para correção', async () => {
  requisicao.mockResolvedValue({
    status: 400,
    json: async () => ({ message: ['numeroSerie must be a string'] }),
  } as Response);
  render(<Aplicacao urlApi={urlApi} />);
  preencherFormulario();

  enviarFormulario();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Os dados informados são inválidos. Revise os campos e tente novamente.',
  );
  expect(screen.queryByText(/must be a string/)).not.toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Número de série' })).toHaveValue(
    dadosValidos.numeroSerie,
  );
});

it.each([
  'Já existe um equipamento cadastrado com este número de série.',
  'Já existe um equipamento cadastrado com este patrimônio.',
  'Já existe equipamento cadastrado com o número de série e o patrimônio informados.',
])('mostra o conflito 409: %s', async (mensagem) => {
  requisicao.mockResolvedValue({
    status: 409,
    json: async () => ({
      message: mensagem,
      error: 'Conflict',
      statusCode: 409,
    }),
  } as Response);
  render(<Aplicacao urlApi={urlApi} />);
  preencherFormulario();

  enviarFormulario();

  expect(await screen.findByRole('alert')).toHaveTextContent(mensagem);
  expect(screen.getByRole('textbox', { name: 'Número de série' })).toHaveValue(
    dadosValidos.numeroSerie,
  );
  expect(
    screen.getByRole('textbox', { name: 'Patrimônio (opcional)' }),
  ).toHaveValue(dadosValidos.patrimonio);
});

it.each(['resposta 500', 'falha de rede'])(
  'mostra erro genérico em %s sem expor detalhes e permite tentar novamente',
  async (cenario) => {
    if (cenario === 'resposta 500') {
      requisicao.mockResolvedValue({
        status: 500,
        json: async () => ({ message: 'detalhe interno: conexão PostgreSQL' }),
      } as Response);
    } else {
      requisicao.mockRejectedValue(
        new Error('detalhe interno: conexão recusada'),
      );
    }
    render(<Aplicacao urlApi={urlApi} />);
    preencherFormulario();

    enviarFormulario();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível cadastrar o equipamento. Tente novamente.',
    );
    expect(screen.queryByText(/detalhe interno/)).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Equipamento' })).toHaveValue(
      dadosValidos.equipamento,
    );
    expect(
      screen.getByRole('button', { name: 'Cadastrar equipamento' }),
    ).toBeEnabled();
  },
);

it('desabilita o botão durante o envio e informa o carregamento', async () => {
  let concluir!: (resposta: Response) => void;
  requisicao.mockReturnValue(
    new Promise((resolver) => {
      concluir = resolver;
    }),
  );
  render(<Aplicacao urlApi={urlApi} />);
  preencherFormulario();

  enviarFormulario();

  const botao = screen.getByRole('button', { name: 'Cadastrando…' });
  expect(botao).toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Enviando os dados. Aguarde…',
  );
  fireEvent.click(botao);
  expect(requisicao).toHaveBeenCalledTimes(1);

  await act(async () => {
    concluir({ status: 201 } as Response);
  });

  expect(
    screen.getByRole('button', { name: 'Cadastrar equipamento' }),
  ).toBeEnabled();
});
