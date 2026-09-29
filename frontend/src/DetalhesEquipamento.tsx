import { useEffect, useRef, useState } from 'react';
import {
  buscarEquipamentoPorId,
  type EquipamentoDetalhado,
} from './buscar-equipamento';

type EstadoDetalhes =
  | { tipo: 'carregando' }
  | { tipo: 'sucesso'; equipamento: EquipamentoDetalhado }
  | { tipo: 'nao-encontrado' }
  | { tipo: 'erro' };

const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function DetalhesEquipamento({
  urlApi,
  id,
  aoFechar,
}: {
  urlApi: string | undefined;
  id: string;
  aoFechar: () => void;
}) {
  const [estado, definirEstado] = useState<EstadoDetalhes>({
    tipo: 'carregando',
  });
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titulo.current?.focus();
    const controlador = new AbortController();

    buscarEquipamentoPorId(urlApi, id, controlador.signal)
      .then((equipamento) => {
        if (!controlador.signal.aborted) {
          definirEstado(
            equipamento === null
              ? { tipo: 'nao-encontrado' }
              : { tipo: 'sucesso', equipamento },
          );
        }
      })
      .catch(() => {
        if (!controlador.signal.aborted) definirEstado({ tipo: 'erro' });
      });

    return () => controlador.abort();
  }, [urlApi, id]);

  return (
    <section
      className="painel-detalhes"
      id="detalhes-equipamento"
      aria-labelledby="titulo-detalhes"
    >
      <div className="cabecalho-detalhes">
        <h3 id="titulo-detalhes" ref={titulo} tabIndex={-1}>
          Detalhes do equipamento
        </h3>
        <button type="button" className="botao-secundario" onClick={aoFechar}>
          Fechar detalhes
        </button>
      </div>

      {estado.tipo === 'carregando' && (
        <p role="status">Carregando detalhes do equipamento…</p>
      )}
      {estado.tipo === 'nao-encontrado' && (
        <p role="alert">Equipamento não encontrado.</p>
      )}
      {estado.tipo === 'erro' && (
        <p className="mensagem mensagem-erro" role="alert">
          Não foi possível carregar os detalhes do equipamento. Tente novamente.
        </p>
      )}
      {estado.tipo === 'sucesso' && (
        <dl className="dados-detalhes">
          <div>
            <dt>Equipamento</dt>
            <dd>{estado.equipamento.equipamento}</dd>
          </div>
          <div>
            <dt>Marca</dt>
            <dd>{estado.equipamento.marca}</dd>
          </div>
          <div>
            <dt>Modelo</dt>
            <dd>{estado.equipamento.modelo}</dd>
          </div>
          <div>
            <dt>Número de série</dt>
            <dd>{estado.equipamento.numeroSerie}</dd>
          </div>
          <div>
            <dt>Patrimônio</dt>
            <dd>{estado.equipamento.patrimonio ?? '—'}</dd>
          </div>
          <div>
            <dt>Data de cadastro</dt>
            <dd>
              <time dateTime={estado.equipamento.criadoEm}>
                {formatadorData.format(new Date(estado.equipamento.criadoEm))}
              </time>
            </dd>
          </div>
          <div>
            <dt>Última atualização</dt>
            <dd>
              <time dateTime={estado.equipamento.atualizadoEm}>
                {formatadorData.format(
                  new Date(estado.equipamento.atualizadoEm),
                )}
              </time>
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
