import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  atualizarEquipamento,
  type DadosAtualizacaoEquipamento,
} from './atualizar-equipamento';
import type { EquipamentoDetalhado } from './buscar-equipamento';

type DadosFormulario = Required<DadosAtualizacaoEquipamento>;
type ErrosFormulario = Partial<Record<keyof DadosFormulario, string>>;

const campos: {
  nome: keyof DadosFormulario;
  rotulo: string;
  obrigatorio: boolean;
}[] = [
  { nome: 'equipamento', rotulo: 'Equipamento', obrigatorio: true },
  { nome: 'marca', rotulo: 'Marca', obrigatorio: true },
  { nome: 'modelo', rotulo: 'Modelo', obrigatorio: true },
  { nome: 'numeroSerie', rotulo: 'Número de série', obrigatorio: true },
  { nome: 'patrimonio', rotulo: 'Patrimônio', obrigatorio: false },
];

function validarFormulario(dados: DadosFormulario): ErrosFormulario {
  const erros: ErrosFormulario = {};
  for (const campo of campos) {
    const tamanho = Array.from(dados[campo.nome]).length;
    if (campo.obrigatorio && tamanho === 0) {
      erros[campo.nome] = 'Preencha este campo.';
    } else if (tamanho > 0 && (tamanho < 2 || tamanho > 20)) {
      erros[campo.nome] = 'Use de 2 a 20 caracteres.';
    }
  }
  return erros;
}

export function FormularioEdicaoEquipamento({
  urlApi,
  equipamento,
  aoSalvar,
  aoCancelar,
}: {
  urlApi: string | undefined;
  equipamento: EquipamentoDetalhado;
  aoSalvar: (equipamento: EquipamentoDetalhado) => void;
  aoCancelar: () => void;
}) {
  const [dados, definirDados] = useState<DadosFormulario>({
    equipamento: equipamento.equipamento,
    marca: equipamento.marca,
    modelo: equipamento.modelo,
    numeroSerie: equipamento.numeroSerie,
    patrimonio: equipamento.patrimonio ?? '',
  });
  const [erros, definirErros] = useState<ErrosFormulario>({});
  const [salvando, definirSalvando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState<string | null>(null);
  const envioEmAndamento = useRef(false);
  const primeiroCampo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    primeiroCampo.current?.focus();
  }, []);

  async function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (envioEmAndamento.current) return;

    const errosEncontrados = validarFormulario(dados);
    definirErros(errosEncontrados);
    definirMensagemErro(null);
    const primeiroCampoInvalido = campos.find(
      (campo) => errosEncontrados[campo.nome],
    );
    if (primeiroCampoInvalido) {
      const entrada = evento.currentTarget.elements.namedItem(
        primeiroCampoInvalido.nome,
      );
      if (entrada instanceof HTMLInputElement) entrada.focus();
      return;
    }

    envioEmAndamento.current = true;
    definirSalvando(true);
    const resultado = await atualizarEquipamento(urlApi, equipamento.id, {
      equipamento: dados.equipamento,
      marca: dados.marca,
      modelo: dados.modelo,
      numeroSerie: dados.numeroSerie,
      ...(dados.patrimonio !== '' ? { patrimonio: dados.patrimonio } : {}),
    });
    envioEmAndamento.current = false;
    definirSalvando(false);
    if (resultado.sucesso) {
      aoSalvar(resultado.equipamento);
    } else {
      definirMensagemErro(resultado.mensagem);
    }
  }

  return (
    <form
      className="formulario-edicao"
      aria-label="Edição de equipamento"
      noValidate
      onSubmit={enviarFormulario}
      aria-busy={salvando}
    >
      <fieldset disabled={salvando}>
        <legend>Editar equipamento</legend>
        <p className="orientacao">
          Campos com <span aria-hidden="true">*</span> são obrigatórios. Informe
          de 2 a 20 caracteres por campo.
        </p>
        <div className="campos">
          {campos.map((campo) => (
            <div className={`campo campo-${campo.nome}`} key={campo.nome}>
              <label htmlFor={`edicao-${campo.nome}`}>
                {campo.rotulo}{' '}
                {campo.obrigatorio ? (
                  <span className="obrigatorio" aria-hidden="true">
                    *
                  </span>
                ) : (
                  <span className="opcional">(opcional)</span>
                )}
              </label>
              <input
                ref={campo.nome === 'equipamento' ? primeiroCampo : undefined}
                id={`edicao-${campo.nome}`}
                name={campo.nome}
                type="text"
                required={campo.obrigatorio}
                autoComplete="off"
                value={dados[campo.nome]}
                aria-invalid={Boolean(erros[campo.nome])}
                aria-describedby={
                  erros[campo.nome] ? `edicao-${campo.nome}-erro` : undefined
                }
                onChange={(evento) => {
                  definirDados({ ...dados, [campo.nome]: evento.target.value });
                  definirErros({ ...erros, [campo.nome]: undefined });
                  definirMensagemErro(null);
                }}
              />
              {erros[campo.nome] && (
                <p className="erro-campo" id={`edicao-${campo.nome}-erro`}>
                  {erros[campo.nome]}
                </p>
              )}
            </div>
          ))}
        </div>
      </fieldset>
      {mensagemErro && (
        <p className="mensagem mensagem-erro" role="alert">
          {mensagemErro}
        </p>
      )}
      <div className="acoes">
        <span className="aviso-envio" role="status">
          {salvando
            ? 'Salvando alterações. Aguarde…'
            : 'Confira os dados antes de salvar.'}
        </span>
        <button
          type="button"
          className="botao-secundario"
          disabled={salvando}
          onClick={aoCancelar}
        >
          Cancelar
        </button>
        <button type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
