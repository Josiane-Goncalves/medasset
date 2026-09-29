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
});
