import { excluirEquipamento } from './excluir-equipamento';
import { FormularioEdicaoEquipamento } from './FormularioEdicaoEquipamento';
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
  aoAtualizar,
  aoExcluir,
}: {
  urlApi: string | undefined;
  id: string;
  aoFechar: () => void;
  aoExcluir: (id: string) => void;
  aoAtualizar?: (equipamento: EquipamentoDetalhado) => void;
}) {
  const [estado, definirEstado] = useState<EstadoDetalhes>({
    tipo: 'carregando',
  });
  const [editando, definirEditando] = useState(false);
  const [atualizado, definirAtualizado] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const [confirmandoExclusao, definirConfirmandoExclusao] = useState(false);
  const [excluindo, definirExcluindo] = useState(false);
  const [erroExclusao, definirErroExclusao] = useState<string | null>(null);
  const exclusaoEmAndamento = useRef(false);
  const perguntaExclusao = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (confirmandoExclusao) perguntaExclusao.current?.focus();
  }, [confirmandoExclusao]);

  async function confirmarExclusao() {
    if (exclusaoEmAndamento.current) return;
    exclusaoEmAndamento.current = true;
    definirExcluindo(true);
    definirErroExclusao(null);

    const resultado = await excluirEquipamento(urlApi, id);
    exclusaoEmAndamento.current = false;
    definirExcluindo(false);
    if (resultado.sucesso) {
      aoExcluir(id);
    } else {
      definirErroExclusao(resultado.mensagem);
    }
  }

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
        <button
          type="button"
          className="botao-secundario"
          onClick={aoFechar}
          disabled={excluindo}
        >
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
      {estado.tipo === 'sucesso' && editando && (
        <FormularioEdicaoEquipamento
          urlApi={urlApi}
          equipamento={estado.equipamento}
          aoCancelar={() => {
            definirEditando(false);
            titulo.current?.focus();
          }}
          aoSalvar={(equipamento) => {
            definirEstado({ tipo: 'sucesso', equipamento });
            definirEditando(false);
            definirAtualizado(true);
            aoAtualizar?.(equipamento);
            titulo.current?.focus();
          }}
        />
      )}
      {estado.tipo === 'sucesso' && !editando && (
        <>
          {!confirmandoExclusao && (
            <div className="acoes-edicao">
              <button
                type="button"
                className="botao-secundario"
                onClick={() => {
                  definirAtualizado(false);
                  definirEditando(true);
                }}
              >
                Editar
              </button>{' '}
              <button
                type="button"
                className="botao-secundario"
                onClick={() => {
                  definirAtualizado(false);
                  definirErroExclusao(null);
                  definirConfirmandoExclusao(true);
                }}
              >
                Excluir
              </button>
            </div>
          )}
          {confirmandoExclusao && (
            <div
              role="group"
              aria-labelledby="pergunta-exclusao"
              aria-describedby="aviso-exclusao"
              aria-busy={excluindo}
            >
              <p id="pergunta-exclusao" ref={perguntaExclusao} tabIndex={-1}>
                Tem certeza que deseja excluir este equipamento?
              </p>
              <p id="aviso-exclusao">Esta ação não pode ser desfeita.</p>
              {erroExclusao && (
                <p className="mensagem mensagem-erro" role="alert">
                  {erroExclusao}
                </p>
              )}
              {excluindo && (
                <p role="status">Excluindo equipamento. Aguarde…</p>
              )}
              <div className="acoes">
                <button
                  type="button"
                  className="botao-secundario"
                  disabled={excluindo}
                  onClick={() => {
                    definirConfirmandoExclusao(false);
                    definirErroExclusao(null);
                    titulo.current?.focus();
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={excluindo}
                  onClick={confirmarExclusao}
                >
                  {excluindo ? 'Excluindo…' : 'Confirmar exclusão'}
                </button>
              </div>
            </div>
          )}
          {atualizado && (
            <p className="mensagem mensagem-sucesso" role="status">
              Equipamento atualizado com sucesso.
            </p>
          )}
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
        </>
      )}
    </section>
  );
}
