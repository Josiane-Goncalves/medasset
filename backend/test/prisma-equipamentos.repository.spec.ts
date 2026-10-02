import { Test } from '@nestjs/testing';
import { Prisma } from '../src/gerado/prisma/client';
import { ErroUnicidadePersistencia } from '../src/equipamentos/equipamentos.repository';
import { PrismaEquipamentosRepository } from '../src/equipamentos/prisma-equipamentos.repository';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Repository Prisma de equipamentos', () => {
  let repositorio: PrismaEquipamentosRepository;
  const criar = jest.fn();
  const atualizar = jest.fn();
  const excluir = jest.fn();
  const listar = jest.fn();
  const buscar = jest.fn();
  const dados = {
    equipamento: 'Monitor',
    marca: 'Marca',
    modelo: 'Modelo',
    numeroSerie: 'SERIE-01',
  };

  beforeEach(async () => {
    criar.mockReset();
    atualizar.mockReset();
    excluir.mockReset();
    listar.mockReset();
    buscar.mockReset();
    const modulo = await Test.createTestingModule({
      providers: [
        PrismaEquipamentosRepository,
        {
          provide: PrismaService,
          useValue: {
            equipamento: {
              create: criar,
              update: atualizar,
              delete: excluir,
              findMany: listar,
              findUnique: buscar,
            },
          },
        },
      ],
    }).compile();

    repositorio = modulo.get(PrismaEquipamentosRepository);
  });

  it('exclui pelo ID usando delete do Prisma', async () => {
    const id = '00000000-0000-4000-8000-000000000001';
    excluir.mockResolvedValue({ ...dados, id });

    await repositorio.excluir(id);

    expect(excluir).toHaveBeenCalledWith({ where: { id } });
    expect(excluir).toHaveBeenCalledTimes(1);
  });

  it('consulta todos os equipamentos por criadoEm decrescente e retorna os registros', async () => {
    const equipamentos = [
      {
        ...dados,
        id: '00000000-0000-4000-8000-000000000001',
        patrimonio: null,
        criadoEm: new Date('2026-09-28T12:00:00Z'),
        atualizadoEm: new Date('2026-09-28T12:00:00Z'),
      },
    ];
    listar.mockResolvedValue(equipamentos);

    await expect(repositorio.listar()).resolves.toEqual(equipamentos);
    expect(listar).toHaveBeenCalledWith({ orderBy: { criadoEm: 'desc' } });
  });

  it('consulta pelo ID informado e retorna o equipamento encontrado', async () => {
    const equipamento = {
      ...dados,
      id: '00000000-0000-4000-8000-000000000001',
      patrimonio: null,
      criadoEm: new Date('2026-09-28T12:00:00Z'),
      atualizadoEm: new Date('2026-09-28T12:00:00Z'),
    };
    buscar.mockResolvedValue(equipamento);

    await expect(repositorio.buscarPorId(equipamento.id)).resolves.toEqual(
      equipamento,
    );
    expect(buscar).toHaveBeenCalledWith({ where: { id: equipamento.id } });
  });

  it.each([
    { patrimonio: 'PAT-02', patrimonioPersistido: 'PAT-02' },
    { patrimonio: undefined, patrimonioPersistido: null },
  ])(
    'atualiza patrimonio $patrimonio enviando $patrimonioPersistido ao Prisma e retornando esse valor',
    async ({ patrimonio, patrimonioPersistido }) => {
      const novosDados = {
        equipamento: 'Ventilador',
        marca: 'Outra marca',
        modelo: 'Outro modelo',
        numeroSerie: 'SERIE-02',
        patrimonio,
      };
      const equipamentoAtualizado = {
        ...novosDados,
        id: '00000000-0000-4000-8000-000000000001',
        patrimonio: patrimonioPersistido,
        criadoEm: new Date('2026-09-28T12:00:00Z'),
        atualizadoEm: new Date('2026-09-30T12:00:00Z'),
      };
      atualizar.mockResolvedValue(equipamentoAtualizado);

      await expect(
        repositorio.atualizar(equipamentoAtualizado.id, novosDados),
      ).resolves.toEqual(equipamentoAtualizado);
      expect(atualizar).toHaveBeenCalledWith({
        where: { id: equipamentoAtualizado.id },
        data: { ...novosDados, patrimonio: patrimonioPersistido },
      });
    },
  );

  it.each(['criar', 'atualizar'])(
    'traduz P2002 ao %s sem decidir a mensagem de negocio',
    async (operacao) => {
      const erro = new Prisma.PrismaClientKnownRequestError('Duplicidade.', {
        code: 'P2002',
        clientVersion: '7.10.0',
        meta: { target: ['numeroSerie'] },
      });
      const gravar = operacao === 'criar' ? criar : atualizar;
      gravar.mockRejectedValue(erro);

      const criacao =
        operacao === 'criar'
          ? repositorio.criar(dados)
          : repositorio.atualizar(
              '00000000-0000-4000-8000-000000000001',
              dados,
            );

      await expect(criacao).rejects.toBeInstanceOf(ErroUnicidadePersistencia);
      await expect(criacao).rejects.toHaveProperty('cause', erro);
    },
  );

  it('preserva outros erros conhecidos do Prisma', async () => {
    const erro = new Prisma.PrismaClientKnownRequestError(
      'Falha de persistencia.',
      {
        code: 'P2025',
        clientVersion: '7.10.0',
      },
    );
    criar.mockRejectedValue(erro);

    await expect(repositorio.criar(dados)).rejects.toBe(erro);
  });

  it('preserva erros inesperados', async () => {
    const erro = new Error('Banco indisponivel.');
    criar.mockRejectedValue(erro);

    await expect(repositorio.criar(dados)).rejects.toBe(erro);
  });
});
