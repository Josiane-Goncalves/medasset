import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AplicacaoModule } from '../src/aplicacao.module';
import { configurarAplicacao } from '../src/configurar-aplicacao';
import { EquipamentosRepository } from '../src/equipamentos/equipamentos.repository';
import { EquipamentosService } from '../src/equipamentos/equipamentos.service';
import { ErroEquipamentoNaoEncontrado } from '../src/equipamentos/erro-equipamento-nao-encontrado';
import type { Equipamento } from '../src/gerado/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

describe('/equipamentos', () => {
  let aplicacao: INestApplication<Server>;
  const origemOriginal = process.env.FRONTEND_ORIGIN;
  const equipamentos: Equipamento[] = [];
  const dadosValidos = {
    equipamento: 'Monitor',
    marca: 'Marca',
    modelo: 'Modelo',
    numeroSerie: 'SERIE-01',
    patrimonio: 'PAT-01',
  };
  const repositorio: EquipamentosRepository = {
    excluir: jest.fn(),
    async listar() {
      return equipamentos.toSorted(
        (primeiro, segundo) =>
          segundo.criadoEm.getTime() - primeiro.criadoEm.getTime(),
      );
    },
    async buscarPorId(id) {
      return equipamentos.find((equipamento) => equipamento.id === id) ?? null;
    },
    async buscarPorNumeroSerie(numeroSerie) {
      return (
        equipamentos.find(
          (equipamento) => equipamento.numeroSerie === numeroSerie,
        ) ?? null
      );
    },
    async buscarPorPatrimonio(patrimonio) {
      return (
        equipamentos.find(
          (equipamento) => equipamento.patrimonio === patrimonio,
        ) ?? null
      );
    },
    async atualizar(id, dados) {
      const equipamento = equipamentos.find((registro) => registro.id === id);
      if (!equipamento) throw new Error('Registro de teste inexistente.');

      Object.assign(equipamento, dados, {
        patrimonio: dados.patrimonio ?? null,
        atualizadoEm: new Date(),
      });
      return equipamento;
    },
    async criar(dados) {
      const equipamento: Equipamento = {
        ...dados,
        id: randomUUID(),
        patrimonio: dados.patrimonio ?? null,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };
      equipamentos.push(equipamento);
      return equipamento;
    },
  };

  beforeAll(async () => {
    process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
    const modulo = await Test.createTestingModule({
      imports: [AplicacaoModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(EquipamentosRepository)
      .useValue(repositorio)
      .compile();

    aplicacao = modulo.createNestApplication();
    aplicacao.useLogger(false);
    configurarAplicacao(aplicacao);
    await aplicacao.init();
  });

  beforeEach(() => {
    equipamentos.length = 0;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await aplicacao?.close();
    if (origemOriginal === undefined) {
      delete process.env.FRONTEND_ORIGIN;
    } else {
      process.env.FRONTEND_ORIGIN = origemOriginal;
    }
  });

  describe('GET /equipamentos', () => {
    it('retorna 200 com os equipamentos na ordem fornecida pelo service', async () => {
      const equipamentosListados: Equipamento[] = [
        {
          ...dadosValidos,
          id: '00000000-0000-4000-8000-000000000001',
          criadoEm: new Date('2026-09-28T12:00:00Z'),
          atualizadoEm: new Date('2026-09-28T12:00:00Z'),
        },
        {
          ...dadosValidos,
          id: '00000000-0000-4000-8000-000000000002',
          numeroSerie: 'SERIE-02',
          patrimonio: null,
          criadoEm: new Date('2026-09-29T12:00:00Z'),
          atualizadoEm: new Date('2026-09-29T12:00:00Z'),
        },
      ];
      jest
        .spyOn(aplicacao.get(EquipamentosService), 'listarEquipamentos')
        .mockResolvedValueOnce(equipamentosListados);

      const resposta = await request(aplicacao.getHttpServer())
        .get('/equipamentos')
        .expect(200);

      expect(resposta.body).toEqual(
        equipamentosListados.map((equipamento) => ({
          ...equipamento,
          criadoEm: equipamento.criadoEm.toISOString(),
          atualizadoEm: equipamento.atualizadoEm.toISOString(),
        })),
      );
    });

    it('retorna 200 com lista vazia quando nao existem equipamentos', async () => {
      jest
        .spyOn(aplicacao.get(EquipamentosService), 'listarEquipamentos')
        .mockResolvedValueOnce([]);

      await request(aplicacao.getHttpServer())
        .get('/equipamentos')
        .expect(200)
        .expect([]);
    });
  });

  describe('GET /equipamentos/:id', () => {
    it('retorna 200 com os dados fornecidos pelo service para o ID solicitado', async () => {
      const equipamento: Equipamento = {
        ...dadosValidos,
        id: '00000000-0000-4000-8000-000000000001',
        criadoEm: new Date('2026-09-28T12:00:00Z'),
        atualizadoEm: new Date('2026-09-28T12:00:00Z'),
      };
      const buscar = jest
        .spyOn(aplicacao.get(EquipamentosService), 'buscarEquipamentoPorId')
        .mockResolvedValueOnce(equipamento);

      await request(aplicacao.getHttpServer())
        .get('/equipamentos/' + equipamento.id)
        .expect(200)
        .expect({
          ...equipamento,
          criadoEm: equipamento.criadoEm.toISOString(),
          atualizadoEm: equipamento.atualizadoEm.toISOString(),
        });

      expect(buscar).toHaveBeenCalledWith(equipamento.id);
    });

    it('retorna 404 com a mensagem da aplicacao quando o equipamento nao existe', async () => {
      jest
        .spyOn(aplicacao.get(EquipamentosService), 'buscarEquipamentoPorId')
        .mockRejectedValueOnce(new ErroEquipamentoNaoEncontrado());

      await request(aplicacao.getHttpServer())
        .get('/equipamentos/00000000-0000-4000-8000-000000000002')
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'Equipamento não encontrado.',
          error: 'Not Found',
        });
    });

    it('retorna 400 para UUID invalido antes de chamar o service', async () => {
      const buscar = jest.spyOn(
        aplicacao.get(EquipamentosService),
        'buscarEquipamentoPorId',
      );

      const resposta = await request(aplicacao.getHttpServer())
        .get('/equipamentos/id-invalido')
        .expect(400);

      expect(resposta.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
      });
      expect(buscar).not.toHaveBeenCalled();
    });
  });

  it('retorna 201 e o equipamento criado', async () => {
    const resposta = await request(aplicacao.getHttpServer())
      .post('/equipamentos')
      .send(dadosValidos)
      .expect(201);

    expect(resposta.body).toEqual({
      ...dadosValidos,
      id: expect.any(String),
      criadoEm: expect.any(String),
      atualizadoEm: expect.any(String),
    });
  });

  it('retorna 201 quando patrimonio e omitido', async () => {
    const dadosSemPatrimonio = {
      equipamento: dadosValidos.equipamento,
      marca: dadosValidos.marca,
      modelo: dadosValidos.modelo,
      numeroSerie: dadosValidos.numeroSerie,
    };
    const resposta = await request(aplicacao.getHttpServer())
      .post('/equipamentos')
      .send(dadosSemPatrimonio)
      .expect(201);

    expect(resposta.body).toEqual({
      ...dadosSemPatrimonio,
      patrimonio: null,
      id: expect.any(String),
      criadoEm: expect.any(String),
      atualizadoEm: expect.any(String),
    });
  });

  it.each([2, 20])('aceita o limite de %i caracteres', async (comprimento) => {
    const valor = 'A'.repeat(comprimento);
    await request(aplicacao.getHttpServer())
      .post('/equipamentos')
      .send({
        equipamento: valor,
        marca: valor,
        modelo: valor,
        numeroSerie: valor,
        patrimonio: valor,
      })
      .expect(201);
  });

  const entradasInvalidas = [
    {
      campo: 'equipamento',
      descricao: 'campo obrigatorio ausente',
      valor: undefined,
    },
    { campo: 'marca', descricao: 'menos de 2 caracteres', valor: 'A' },
    {
      campo: 'modelo',
      descricao: 'mais de 20 caracteres',
      valor: 'A'.repeat(21),
    },
    { campo: 'numeroSerie', descricao: 'tipo invalido', valor: 123 },
    { campo: 'patrimonio', descricao: 'null', valor: null },
  ];

  it.each(entradasInvalidas)(
    'retorna 400 para $campo com $descricao',
    async ({ campo, valor }) => {
      const resposta = await request(aplicacao.getHttpServer())
        .post('/equipamentos')
        .send({ ...dadosValidos, [campo]: valor })
        .expect(400);

      expect(resposta.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
      });
      expect(resposta.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining(campo)]),
      );
    },
  );

  it('retorna 400 para propriedade desconhecida', async () => {
    await request(aplicacao.getHttpServer())
      .post('/equipamentos')
      .send({ ...dadosValidos, extra: true })
      .expect(400)
      .expect({
        statusCode: 400,
        error: 'Bad Request',
        message: ['property extra should not exist'],
      });
  });

  const conflitos = [
    {
      descricao: 'numero de serie',
      corpo: { ...dadosValidos, patrimonio: 'PAT-02' },
      mensagem: 'Já existe um equipamento cadastrado com este número de série.',
    },
    {
      descricao: 'patrimonio',
      corpo: { ...dadosValidos, numeroSerie: 'SERIE-02' },
      mensagem: 'Já existe um equipamento cadastrado com este patrimônio.',
    },
    {
      descricao: 'numero de serie e patrimonio',
      corpo: dadosValidos,
      mensagem:
        'Já existe equipamento cadastrado com o número de série e o patrimônio informados.',
    },
  ];

  it.each(conflitos)(
    'retorna 409 para $descricao duplicado',
    async ({ corpo, mensagem }) => {
      await request(aplicacao.getHttpServer())
        .post('/equipamentos')
        .send(dadosValidos)
        .expect(201);

      await request(aplicacao.getHttpServer())
        .post('/equipamentos')
        .send(corpo)
        .expect(409)
        .expect({ statusCode: 409, error: 'Conflict', message: mensagem });
    },
  );

  it('retorna 500 sem expor detalhes internos para falhas que nao sao conflito', async () => {
    jest
      .spyOn(repositorio, 'criar')
      .mockRejectedValueOnce(new Error('Detalhe interno do banco.'));

    await request(aplicacao.getHttpServer())
      .post('/equipamentos')
      .send(dadosValidos)
      .expect(500)
      .expect({ statusCode: 500, message: 'Internal server error' });
  });

  describe('PUT /equipamentos/:id', () => {
    const id = '00000000-0000-4000-8000-000000000001';
    const novosDados = {
      equipamento: 'Ventilador',
      marca: 'Outra marca',
      modelo: 'Outro modelo',
      numeroSerie: 'SERIE-02',
      patrimonio: 'PAT-02',
    };

    beforeEach(() => {
      equipamentos.push({
        ...dadosValidos,
        id,
        criadoEm: new Date('2026-09-28T12:00:00Z'),
        atualizadoEm: new Date('2026-09-28T12:00:00Z'),
      });
    });

    it('retorna 200 com o registro atualizado e delega os dados completos ao service', async () => {
      const atualizar = jest.spyOn(
        aplicacao.get(EquipamentosService),
        'atualizarEquipamento',
      );
      const resposta = await request(aplicacao.getHttpServer())
        .put('/equipamentos/' + id)
        .send(novosDados)
        .expect(200);

      expect(atualizar).toHaveBeenCalledWith(id, novosDados);
      expect(resposta.body).toEqual({
        ...novosDados,
        id,
        criadoEm: '2026-09-28T12:00:00.000Z',
        atualizadoEm: expect.any(String),
      });
      expect(equipamentos[0]).toMatchObject(novosDados);
    });

    it('retorna 400 para UUID invalido antes de chamar o service', async () => {
      const atualizar = jest.spyOn(
        aplicacao.get(EquipamentosService),
        'atualizarEquipamento',
      );

      await request(aplicacao.getHttpServer())
        .put('/equipamentos/id-invalido')
        .send(novosDados)
        .expect(400);

      expect(atualizar).not.toHaveBeenCalled();
    });

    it('retorna 404 quando o equipamento nao existe', async () => {
      await request(aplicacao.getHttpServer())
        .put('/equipamentos/00000000-0000-4000-8000-000000000002')
        .send(novosDados)
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'Equipamento não encontrado.',
          error: 'Not Found',
        });
    });

    it('retorna 400 para campo obrigatorio ausente antes de chamar o service', async () => {
      const atualizar = jest.spyOn(
        aplicacao.get(EquipamentosService),
        'atualizarEquipamento',
      );
      const resposta = await request(aplicacao.getHttpServer())
        .put('/equipamentos/' + id)
        .send({ ...novosDados, equipamento: undefined })
        .expect(400);

      expect(resposta.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('equipamento')]),
      );
      expect(atualizar).not.toHaveBeenCalled();
    });

    it('retorna 409 para numero de serie duplicado preservando a mensagem de negocio', async () => {
      const outroEquipamento = await repositorio.criar({
        ...novosDados,
        numeroSerie: 'SERIE-03',
        patrimonio: 'PAT-03',
      });

      await request(aplicacao.getHttpServer())
        .put('/equipamentos/' + outroEquipamento.id)
        .send({ ...novosDados, numeroSerie: dadosValidos.numeroSerie })
        .expect(409)
        .expect({
          statusCode: 409,
          error: 'Conflict',
          message:
            'Já existe um equipamento cadastrado com este número de série.',
        });
    });

    it('aceita patrimonio omitido e retorna o equipamento sem o patrimonio anterior', async () => {
      const dadosSemPatrimonio: Partial<typeof novosDados> = { ...novosDados };
      delete dadosSemPatrimonio.patrimonio;

      const resposta = await request(aplicacao.getHttpServer())
        .put('/equipamentos/' + id)
        .send(dadosSemPatrimonio)
        .expect(200);

      expect(resposta.body).toEqual({
        ...dadosSemPatrimonio,
        id,
        patrimonio: null,
        criadoEm: '2026-09-28T12:00:00.000Z',
        atualizadoEm: expect.any(String),
      });
      expect(equipamentos[0].patrimonio).toBeNull();
    });
  });
});
