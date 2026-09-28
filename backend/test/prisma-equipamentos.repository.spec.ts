import { Test } from '@nestjs/testing';
import { Prisma } from '../src/gerado/prisma/client';
import { ErroUnicidadePersistencia } from '../src/equipamentos/equipamentos.repository';
import { PrismaEquipamentosRepository } from '../src/equipamentos/prisma-equipamentos.repository';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Repository Prisma de equipamentos', () => {
  let repositorio: PrismaEquipamentosRepository;
  const criar = jest.fn();
  const listar = jest.fn();
  const dados = {
    equipamento: 'Monitor',
    marca: 'Marca',
    modelo: 'Modelo',
    numeroSerie: 'SERIE-01',
  };

  beforeEach(async () => {
    criar.mockReset();
    listar.mockReset();
    const modulo = await Test.createTestingModule({
      providers: [
        PrismaEquipamentosRepository,
        {
          provide: PrismaService,
          useValue: { equipamento: { create: criar, findMany: listar } },
        },
      ],
    }).compile();

    repositorio = modulo.get(PrismaEquipamentosRepository);
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

  it('sinaliza uma violacao de unicidade sem decidir a mensagem de negocio', async () => {
    const erro = new Prisma.PrismaClientKnownRequestError('Duplicidade.', {
      code: 'P2002',
      clientVersion: '7.10.0',
      meta: { target: ['numeroSerie'] },
    });
    criar.mockRejectedValue(erro);

    const criacao = repositorio.criar(dados);

    await expect(criacao).rejects.toBeInstanceOf(ErroUnicidadePersistencia);
    await expect(criacao).rejects.toHaveProperty('cause', erro);
  });

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
