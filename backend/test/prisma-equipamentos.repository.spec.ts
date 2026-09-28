import { Test } from '@nestjs/testing';
import { Prisma } from '../src/gerado/prisma/client';
import { ErroUnicidadePersistencia } from '../src/equipamentos/equipamentos.repository';
import { PrismaEquipamentosRepository } from '../src/equipamentos/prisma-equipamentos.repository';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Erros de persistencia do repository Prisma', () => {
  let repositorio: PrismaEquipamentosRepository;
  const criar = jest.fn();
  const dados = {
    equipamento: 'Monitor',
    marca: 'Marca',
    modelo: 'Modelo',
    numeroSerie: 'SERIE-01',
  };

  beforeEach(async () => {
    criar.mockReset();
    const modulo = await Test.createTestingModule({
      providers: [
        PrismaEquipamentosRepository,
        {
          provide: PrismaService,
          useValue: { equipamento: { create: criar } },
        },
      ],
    }).compile();

    repositorio = modulo.get(PrismaEquipamentosRepository);
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
