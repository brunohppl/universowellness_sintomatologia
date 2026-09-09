/**
 * Aviso de registro duplicado.
 * A verificação abrange TODOS os formulários, não apenas o atual.
 *
 * Dois cenários:
 *  - mesmoLocal: já existe envio hoje nesta mesma filial → pode atualizar
 *  - outro local: o envio foi noutra unidade → só permite novo registro,
 *    porque atualizar um registro de outra filial seria confuso e arriscado
 */
export default function DuplicateWarningModal({
  nome,
  filialNome,
  totalAqui,
  outraUnidade,
  ultimoEnvio,
  ocupado,
  onCorrigir,
  onAtualizar,
  onEnviarMesmoAssim
}) {
  const mesmoLocal = (totalAqui ?? 0) > 0

  const hora = ultimoEnvio
    ? new Date(ultimoEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center px-4">
      <div className="bg-white rounded-3xl shadow-card w-full max-w-md p-6 animate-popIn">
        <div className="w-12 h-12 rounded-full bg-amber-100 grid place-items-center text-amber-600 mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <h2 className="font-display font-extrabold text-xl text-ink text-center mb-2">
          Já existe um registro hoje
        </h2>

        <p className="text-sm text-muted text-center mb-6">
          {mesmoLocal ? (
            <>
              O nome <span className="font-semibold text-ink">{nome}</span> já foi registrado hoje
              {filialNome ? <> em <span className="font-semibold text-ink">{filialNome}</span></> : null}
              {hora ? <> às <span className="font-semibold text-ink">{hora}</span></> : null}.
            </>
          ) : (
            <>
              O nome <span className="font-semibold text-ink">{nome}</span> já foi registrado hoje
              {outraUnidade
                ? <> em <span className="font-semibold text-ink">{outraUnidade}</span></>
                : <> em outra unidade</>}
              {hora ? <>, às <span className="font-semibold text-ink">{hora}</span></> : null}.
              {' '}Confirme se está preenchendo o formulário correto.
            </>
          )}
          <br />O que deseja fazer?
        </p>

        <div className="space-y-2">
          {mesmoLocal && (
            <>
              <button
                onClick={onAtualizar}
                disabled={ocupado}
                className="w-full bg-teal-700 hover:bg-teal-600 disabled:opacity-60 text-white font-display font-semibold py-3 rounded-2xl transition-colors"
              >
                Atualizar o registro de hoje
              </button>
              <p className="text-xs text-muted text-center pb-1">
                Substitui as respostas do registro anterior pelas que você acabou de preencher.
              </p>
            </>
          )}

          <button
            onClick={onEnviarMesmoAssim}
            disabled={ocupado}
            className={`w-full font-display font-semibold py-3 rounded-2xl transition-colors disabled:opacity-60 ${
              mesmoLocal
                ? 'border-2 border-teal-100 hover:bg-teal-50 text-teal-700'
                : 'bg-teal-700 hover:bg-teal-600 text-white'
            }`}
          >
            Enviar como um novo registro
          </button>
          <p className="text-xs text-muted text-center pb-1">
            {mesmoLocal
              ? 'Use se for outra pessoa com o mesmo nome, ou um segundo registro no dia.'
              : 'Use se você realmente trabalha nesta unidade, ou se for outra pessoa com o mesmo nome.'}
          </p>

          <button
            onClick={onCorrigir}
            disabled={ocupado}
            className="w-full text-muted hover:text-ink disabled:opacity-60 font-medium py-2.5 text-sm transition-colors"
          >
            Voltar e corrigir os dados
          </button>
        </div>
      </div>
    </div>
  )
}
