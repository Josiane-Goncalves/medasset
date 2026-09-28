import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AplicacaoModule } from './aplicacao.module';
import { configurarAplicacao } from './configurar-aplicacao';

async function iniciarAplicacao() {
  const porta = Number(process.env.PORT ?? 3000);

  if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
    throw new Error('PORT deve ser um numero inteiro entre 1 e 65535.');
  }

  const aplicacao = await NestFactory.create(AplicacaoModule);
  configurarAplicacao(aplicacao);
  aplicacao.enableShutdownHooks();
  await aplicacao.listen(porta);
}

iniciarAplicacao().catch((erro: unknown) => {
  console.error(
    erro instanceof Error ? erro.message : 'Falha ao iniciar a API.',
  );
  process.exit(1);
});
