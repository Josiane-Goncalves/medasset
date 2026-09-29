import { ErroConflitoEquipamento } from '../src/equipamentos/erro-conflito-equipamento';
import { ErroEquipamentoNaoEncontrado } from '../src/equipamentos/erro-equipamento-nao-encontrado';
import type { Equipamento } from '../src/gerado/prisma/client';
import {
  DadosCadastroEquipamento,
  EquipamentosRepository,
  ErroUnicidadePersistencia,
} from '../src/equipamentos/equipamentos.repository';
import { EquipamentosService } from '../src/equipamentos/equipamentos.service';

describe('EquipamentosService', () => {
  let repositorio: jest.Mocked<EquipamentosRepository>;
  let servico: EquipamentosService;

  const dados: DadosCadastroEquipamento = {
    equipamento: 'Monitor',
    marca: 'Marca',
    modelo: 'Modelo',
    numeroSerie: 'SERIE-01',
    patrimonio: 'PAT-01',
  };
  const equipamento: Equipamento = {
    ...dados,
    id: '00000000-0000-4000-8000-000000000001',
    patrimonio: 'PAT-01',
    criadoEm: new Date('2026-09-28T12:00:00Z'),
    atualizadoEm: new Date('2026-09-28T12:00:00Z'),
  };

  beforeEach(() => {
    repositorio = {
      listar: jest.fn().mockResolvedValue([]),
      buscarPorId: jest.fn().mockResolvedValue(null),
      buscarPorNumeroSerie: jest.fn().mockResolvedValue(null),
      buscarPorPatrimonio: jest.fn().mockResolvedValue(null),
      criar: jest.fn().mockResolvedValue(equipamento),
    };
    servico = new EquipamentosService(repositorio);
  });

  describe('Listagem de equipamentos', () => {
    it('retorna todos os equipamentos recebidos do repository na mesma ordem', async () => {
      const equipamentos = [
        {
          ...equipamento,
          id: '00000000-0000-4000-8000-000000000002',
          numeroSerie: 'SERIE-02',
          patrimonio: null,
          criadoEm: new Date('2026-09-29T12:00:00Z'),
          atualizadoEm: new Date('2026-09-29T12:00:00Z'),
        },
        equipamento,
      ];
      repositorio.listar.mockResolvedValue(equipamentos);

      await expect(servico.listarEquipamentos()).resolves.toEqual(equipamentos);
    });

    it('retorna lista vazia quando nao existem equipamentos', async () => {
      repositorio.listar.mockResolvedValue([]);

      await expect(servico.listarEquipamentos()).resolves.toEqual([]);
    });
  });

  describe('Busca de equipamento por ID', () => {
    it('retorna o equipamento quando o ID existe', async () => {
      repositorio.buscarPorId.mockResolvedValue(equipamento);

      await expect(
        servico.buscarEquipamentoPorId(equipamento.id),
      ).resolves.toEqual(equipamento);
      expect(repositorio.buscarPorId).toHaveBeenCalledWith(equipamento.id);
    });

    it('lanca erro de equipamento nao encontrado quando o ID nao existe', async () => {
      repositorio.buscarPorId.mockResolvedValue(null);

      const busca = servico.buscarEquipamentoPorId(
        '00000000-0000-4000-8000-000000000002',
      );

      await expect(busca).rejects.toBeInstanceOf(ErroEquipamentoNaoEncontrado);
      await expect(busca).rejects.toHaveProperty(
        'message',
        'Equipamento não encontrado.',
      );
    });
  });

  it('cadastra equipamento valido e retorna o registro persistido', async () => {
    await expect(servico.cadastrarEquipamento(dados)).resolves.toEqual(
      equipamento,
    );
    expect(repositorio.criar).toHaveBeenCalledWith(dados);
    expect(repositorio.criar).toHaveBeenCalledTimes(1);
  });

  it('cadastra equipamento sem patrimonio', async () => {
    const dadosSemPatrimonio: DadosCadastroEquipamento = {
      equipamento: dados.equipamento,
      marca: dados.marca,
      modelo: dados.modelo,
      numeroSerie: dados.numeroSerie,
    };
    const equipamentoSemPatrimonio = { ...equipamento, patrimonio: null };
    repositorio.criar.mockResolvedValue(equipamentoSemPatrimonio);

    await expect(
      servico.cadastrarEquipamento(dadosSemPatrimonio),
    ).resolves.toEqual(equipamentoSemPatrimonio);
    expect(repositorio.criar).toHaveBeenCalledWith(dadosSemPatrimonio);
    expect(repositorio.buscarPorPatrimonio).not.toHaveBeenCalled();
  });

  const cenariosDuplicidade = [
    {
      descricao: 'numero de serie',
      motivo: 'NUMERO_SERIE',
      numeroSerieDuplicado: true,
      patrimonioDuplicado: false,
      mensagem: 'Já existe um equipamento cadastrado com este número de série.',
    },
    {
      descricao: 'patrimonio',
      motivo: 'PATRIMONIO',
      numeroSerieDuplicado: false,
      patrimonioDuplicado: true,
      mensagem: 'Já existe um equipamento cadastrado com este patrimônio.',
    },
    {
      descricao: 'numero de serie e patrimonio',
      motivo: 'NUMERO_SERIE_E_PATRIMONIO',
      numeroSerieDuplicado: true,
      patrimonioDuplicado: true,
      mensagem:
        'Já existe equipamento cadastrado com o número de série e o patrimônio informados.',
    },
  ];

  it.each(cenariosDuplicidade)(
    'rejeita $descricao duplicado sem tentar persistir',
    async ({ numeroSerieDuplicado, patrimonioDuplicado, motivo, mensagem }) => {
      repositorio.buscarPorNumeroSerie.mockResolvedValue(
        numeroSerieDuplicado ? equipamento : null,
      );
      repositorio.buscarPorPatrimonio.mockResolvedValue(
        patrimonioDuplicado ? equipamento : null,
      );

      const cadastro = servico.cadastrarEquipamento(dados);

      await expect(cadastro).rejects.toBeInstanceOf(ErroConflitoEquipamento);
      await expect(cadastro).rejects.toMatchObject({
        motivo,
        message: mensagem,
      });
      expect(repositorio.criar).not.toHaveBeenCalled();
    },
  );

  it('rejeita ambos os identificadores mesmo quando pertencem a registros diferentes', async () => {
    repositorio.buscarPorNumeroSerie.mockResolvedValue({
      ...equipamento,
      patrimonio: 'PAT-02',
    });
    repositorio.buscarPorPatrimonio.mockResolvedValue({
      ...equipamento,
      id: '00000000-0000-4000-8000-000000000002',
      numeroSerie: 'SERIE-02',
    });

    const cadastro = servico.cadastrarEquipamento(dados);

    await expect(cadastro).rejects.toBeInstanceOf(ErroConflitoEquipamento);
    await expect(cadastro).rejects.toHaveProperty(
      'motivo',
      'NUMERO_SERIE_E_PATRIMONIO',
    );
    expect(repositorio.criar).not.toHaveBeenCalled();
  });

  it('rejeita serie duplicada mesmo quando o patrimonio nao foi informado', async () => {
    repositorio.buscarPorNumeroSerie.mockResolvedValue(equipamento);

    const cadastro = servico.cadastrarEquipamento({
      ...dados,
      patrimonio: undefined,
    });

    await expect(cadastro).rejects.toBeInstanceOf(ErroConflitoEquipamento);
    await expect(cadastro).rejects.toHaveProperty('motivo', 'NUMERO_SERIE');
    expect(repositorio.criar).not.toHaveBeenCalled();
    expect(repositorio.buscarPorPatrimonio).not.toHaveBeenCalled();
  });

  it.each(cenariosDuplicidade)(
    'identifica $descricao duplicado quando o conflito ocorre durante a gravacao',
    async ({ numeroSerieDuplicado, patrimonioDuplicado, motivo, mensagem }) => {
      repositorio.buscarPorNumeroSerie
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(numeroSerieDuplicado ? equipamento : null);
      repositorio.buscarPorPatrimonio
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(patrimonioDuplicado ? equipamento : null);
      repositorio.criar.mockRejectedValue(new ErroUnicidadePersistencia());

      const cadastro = servico.cadastrarEquipamento(dados);

      await expect(cadastro).rejects.toBeInstanceOf(ErroConflitoEquipamento);
      await expect(cadastro).rejects.toMatchObject({
        motivo,
        message: mensagem,
      });
      expect(repositorio.criar).toHaveBeenCalledTimes(1);
    },
  );

  it('preserva falhas de persistencia que nao sao duplicidade', async () => {
    const erro = new Error('Banco indisponivel.');
    repositorio.criar.mockRejectedValue(erro);

    await expect(servico.cadastrarEquipamento(dados)).rejects.toBe(erro);
  });

  it('preserva erro de unicidade quando a nova consulta nao identifica os campos duplicados', async () => {
    const erro = new ErroUnicidadePersistencia();
    repositorio.criar.mockRejectedValue(erro);

    await expect(servico.cadastrarEquipamento(dados)).rejects.toBe(erro);
    expect(repositorio.criar).toHaveBeenCalledTimes(1);
  });
});
