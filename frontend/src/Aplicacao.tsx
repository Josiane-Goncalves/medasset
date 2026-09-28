import { useState, type FormEvent } from 'react';
import {
  cadastrarEquipamento,
  type DadosCadastroEquipamento,
} from './cadastrar-equipamento';

type DadosFormulario = Required<DadosCadastroEquipamento>;
type ErrosFormulario = Partial<Record<keyof DadosFormulario, string>>;

const formularioVazio: DadosFormulario = {
  equipamento: '',
  marca: '',
  modelo: '',
  numeroSerie: '',
  patrimonio: '',
};

const campos: {
  nome: keyof DadosFormulario;
  rotulo: string;
  obrigatorio: boolean;
  exemplo: string;
}[] = [
  {
    nome: 'equipamento',
    rotulo: 'Equipamento',
    obrigatorio: true,
    exemplo: 'Ex.: Monitor cardíaco',
  },
  {
    nome: 'marca',
    rotulo: 'Marca',
    obrigatorio: true,
    exemplo: 'Ex.: Philips',
  },
  {
    nome: 'modelo',
    rotulo: 'Modelo',
    obrigatorio: true,
    exemplo: 'Ex.: IntelliVue MX',
  },
  {
    nome: 'numeroSerie',
    rotulo: 'Número de série',
    obrigatorio: true,
    exemplo: 'Ex.: SN-2026-001',
  },
  {
    nome: 'patrimonio',
    rotulo: 'Patrimônio',
    obrigatorio: false,
    exemplo: 'Ex.: PAT-001',
  },
];

function validarFormulario(dados: DadosFormulario): ErrosFormulario {
  const erros: ErrosFormulario = {};

  for (const campo of campos) {
    const valor = dados[campo.nome];
    const tamanho = Array.from(valor).length;

    if (campo.obrigatorio && tamanho === 0) {
      erros[campo.nome] = 'Preencha este campo.';
    } else if (tamanho > 0 && (tamanho < 2 || tamanho > 20)) {
      erros[campo.nome] = 'Use de 2 a 20 caracteres.';
    }
  }

  return erros;
}

export function Aplicacao({ urlApi }: { urlApi: string | undefined }) {
  const [dados, definirDados] = useState(formularioVazio);
  const [erros, definirErros] = useState<ErrosFormulario>({});
  const [enviando, definirEnviando] = useState(false);
  const [retorno, definirRetorno] = useState<{
    tipo: 'sucesso' | 'erro';
    mensagem: string;
  } | null>(null);

  async function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;

    const formulario = evento.currentTarget;
    const errosEncontrados = validarFormulario(dados);
    definirErros(errosEncontrados);
    definirRetorno(null);

    const primeiroCampoInvalido = campos.find(
      (campo) => errosEncontrados[campo.nome],
    );

    if (primeiroCampoInvalido) {
      const entrada = formulario.elements.namedItem(primeiroCampoInvalido.nome);
      if (entrada instanceof HTMLInputElement) entrada.focus();
      return;
    }

    definirEnviando(true);
    const resultado = await cadastrarEquipamento(urlApi, {
      equipamento: dados.equipamento,
      marca: dados.marca,
      modelo: dados.modelo,
      numeroSerie: dados.numeroSerie,
      ...(dados.patrimonio !== '' ? { patrimonio: dados.patrimonio } : {}),
    });
    definirEnviando(false);

    if (resultado.sucesso) {
      definirDados(formularioVazio);
      definirRetorno({
        tipo: 'sucesso',
        mensagem: 'Equipamento cadastrado com sucesso.',
      });
    } else {
      definirRetorno({ tipo: 'erro', mensagem: resultado.mensagem });
    }
  }

  return (
    <>
      <header className="cabecalho">
        <div className="marca">
          <span className="simbolo-marca" aria-hidden="true">
            +
          </span>
          <span>MedAsset</span>
        </div>
        <span className="descricao-marca">Gestão de equipamentos</span>
      </header>

      <main>
        <div className="introducao">
          <p className="identificador">CADASTRO</p>
          <h1>Cadastro de equipamento</h1>
          <p>
            Registre os dados de identificação do equipamento médico-hospitalar.
          </p>
        </div>

        <form noValidate onSubmit={enviarFormulario} aria-busy={enviando}>
          <fieldset disabled={enviando}>
            <legend>Identificação do equipamento</legend>
            <p className="orientacao">
              Campos com <span aria-hidden="true">*</span> são obrigatórios.
              Informe de 2 a 20 caracteres por campo.
            </p>

            <div className="campos">
              {campos.map((campo) => (
                <div className={`campo campo-${campo.nome}`} key={campo.nome}>
                  <label htmlFor={campo.nome}>
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
                    id={campo.nome}
                    name={campo.nome}
                    type="text"
                    required={campo.obrigatorio}
                    autoComplete="off"
                    placeholder={campo.exemplo}
                    value={dados[campo.nome]}
                    aria-invalid={Boolean(erros[campo.nome])}
                    aria-describedby={
                      erros[campo.nome] ? `${campo.nome}-erro` : undefined
                    }
                    onChange={(evento) => {
                      definirDados({
                        ...dados,
                        [campo.nome]: evento.target.value,
                      });
                      definirErros({ ...erros, [campo.nome]: undefined });
                      definirRetorno(null);
                    }}
                  />
                  {erros[campo.nome] && (
                    <p className="erro-campo" id={`${campo.nome}-erro`}>
                      {erros[campo.nome]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </fieldset>

          {retorno && (
            <div
              className={`mensagem mensagem-${retorno.tipo}`}
              role={retorno.tipo === 'erro' ? 'alert' : 'status'}
            >
              {retorno.mensagem}
            </div>
          )}

          <div className="acoes">
            <span className="aviso-envio" role="status">
              {enviando
                ? 'Enviando os dados. Aguarde…'
                : 'Confira os dados antes de cadastrar.'}
            </span>
            <button type="submit" disabled={enviando}>
              {enviando ? 'Cadastrando…' : 'Cadastrar equipamento'}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
