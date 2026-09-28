import { INestApplication, ValidationPipe } from '@nestjs/common';

export function configurarAplicacao(aplicacao: INestApplication) {
  const origemFrontend = process.env.FRONTEND_ORIGIN;

  if (!origemFrontend || !URL.canParse(origemFrontend)) {
    throw new Error(
      'FRONTEND_ORIGIN deve ser uma origem HTTP ou HTTPS valida.',
    );
  }

  const urlOrigem = new URL(origemFrontend);

  if (
    !['http:', 'https:'].includes(urlOrigem.protocol) ||
    urlOrigem.origin !== origemFrontend
  ) {
    throw new Error(
      'FRONTEND_ORIGIN deve ser uma origem HTTP ou HTTPS valida.',
    );
  }

  aplicacao.enableCors({ origin: origemFrontend });
  aplicacao.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
