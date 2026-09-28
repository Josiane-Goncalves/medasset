import 'reflect-metadata';
import { Body, Controller, INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsString } from 'class-validator';
import request from 'supertest';
import type { Server } from 'node:http';
import { PrismaService } from '../src/prisma/prisma.service';
import { AplicacaoModule } from '../src/aplicacao.module';
import { configurarAplicacao } from '../src/configurar-aplicacao';

class MensagemTesteDto {
  @IsString()
  mensagem!: string;
}

@Controller('teste-configuracao')
class ConfiguracaoTesteController {
  @Post()
  receber(@Body() dados: MensagemTesteDto) {
    return {
      mensagem: dados.mensagem,
      transformado: dados instanceof MensagemTesteDto,
    };
  }
}

describe('Fundacao da API', () => {
  let aplicacao: INestApplication<Server>;
  const origemOriginal = process.env.FRONTEND_ORIGIN;
  const origemFrontend = 'http://localhost:5173';

  beforeAll(async () => {
    process.env.FRONTEND_ORIGIN = origemFrontend;
    const modulo = await Test.createTestingModule({
      imports: [AplicacaoModule],
      controllers: [ConfiguracaoTesteController],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    aplicacao = modulo.createNestApplication();
    configurarAplicacao(aplicacao);
    await aplicacao.init();
  });

  afterAll(async () => {
    await aplicacao?.close();
    if (origemOriginal === undefined) {
      delete process.env.FRONTEND_ORIGIN;
    } else {
      process.env.FRONTEND_ORIGIN = origemOriginal;
    }
  });

  it('inicia sem endpoint na raiz', async () => {
    await request(aplicacao.getHttpServer()).get('/').expect(404);
  });

  it('permite a origem configurada no preflight', async () => {
    await request(aplicacao.getHttpServer())
      .options('/')
      .set('Origin', origemFrontend)
      .set('Access-Control-Request-Method', 'POST')
      .expect(204)
      .expect('Access-Control-Allow-Origin', origemFrontend);
  });

  it('nao autoriza uma origem diferente', async () => {
    const origemExterna = 'https://externo.example';
    const resposta = await request(aplicacao.getHttpServer())
      .get('/')
      .set('Origin', origemExterna)
      .expect(404);

    expect(resposta.headers['access-control-allow-origin']).toBe(
      origemFrontend,
    );
    expect(resposta.headers['access-control-allow-origin']).not.toBe(
      origemExterna,
    );
  });

  it('valida e transforma o corpo em uma instancia do DTO', async () => {
    await request(aplicacao.getHttpServer())
      .post('/teste-configuracao')
      .send({ mensagem: 'Teste' })
      .expect(201)
      .expect({ mensagem: 'Teste', transformado: true });
  });

  it.each([{}, { mensagem: 42 }, { mensagem: null }])(
    'rejeita um corpo invalido: %j',
    async (corpo) => {
      await request(aplicacao.getHttpServer())
        .post('/teste-configuracao')
        .send(corpo)
        .expect(400);
    },
  );

  it('rejeita propriedades que nao pertencem ao DTO', async () => {
    await request(aplicacao.getHttpServer())
      .post('/teste-configuracao')
      .send({ mensagem: 'Teste', extra: true })
      .expect(400);
  });

  it.each([
    undefined,
    '',
    '*',
    'invalida',
    'ftp://localhost',
    'http://localhost/caminho',
  ])('recusa configuracao insegura ou invalida de CORS: %s', (origem) => {
    if (origem === undefined) {
      delete process.env.FRONTEND_ORIGIN;
    } else {
      process.env.FRONTEND_ORIGIN = origem;
    }

    try {
      expect(() => configurarAplicacao(aplicacao)).toThrow('FRONTEND_ORIGIN');
    } finally {
      process.env.FRONTEND_ORIGIN = origemFrontend;
    }
  });
});
