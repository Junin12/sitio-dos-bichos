// Cliente do backend (Supabase) do Sítio dos Bichos.
//
// Uso:
//   import { createClient } from '@supabase/supabase-js';
//   import { criarApi } from './api.js';
//   const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
//   const api = criarApi(sb);
//   await api.entrar('Joana');            // login anônimo + perfil
//   await api.guilda.contribuir(8, 'ovo');
//
// Toda chamada devolve { ok: true, ... } ou { ok: false, erro: 'codigo', mensagem: 'texto em português' }.
// Nunca lança exceção: falha de rede vira { ok: false, erro: 'rede' }.

// Tetos de pontos por chamada. Devem ser iguais aos do servidor (jogo_contribuir).
export const TETOS = { ovo: 10, coleta: 60, missao: 30, safra: 5 };

export const MENSAGENS = {
  rede: 'Sem conexão com o servidor. Tente de novo em instantes.',
  nao_autenticado: 'Sua sessão expirou. Entre de novo.',
  nome_invalido: 'Nome inválido.',
  lema_invalido: 'Lema muito longo (máximo 60 letras).',
  sem_perfil: 'Perfil não encontrado.',
  nivel_baixo: 'Chegue ao nível 5 para usar guildas.',
  nivel_invalido: 'Nível inválido.',
  salto_de_nivel: 'Nível subiu rápido demais.',
  poder_invalido: 'Poder inválido.',
  limite_hora: 'Muitas ações seguidas. Espere um pouco.',
  limite_diario: 'Limite diário atingido.',
  dados_invalidos: 'Dados de save inválidos.',
  grande_demais: 'O save ficou grande demais.',
  conflito: 'O save na nuvem é mais novo que o seu.',
  ja_em_guilda: 'Você já está em uma guilda.',
  nome_em_uso: 'Já existe uma guilda com esse nome.',
  guilda_inexistente: 'Guilda não encontrada.',
  guilda_cheia: 'Essa guilda está cheia.',
  sem_guilda: 'Você não está em uma guilda.',
  motivo_invalido: 'Motivo de pontos inválido.',
  pontos_invalidos: 'Quantidade de pontos inválida.',
  valor_invalido: 'Valor inválido.',
  alvo_invalido: 'Esse jogador não pode receber ajuda.',
  ja_ajudou_hoje: 'Você já ajudou esse colega hoje.',
  indice_invalido: 'Baú inválido.',
  ja_resgatado: 'Baú já resgatado.',
  pontos_minimos: 'Faça ao menos 30 pontos na semana para abrir baús.',
  meta_nao_atingida: 'A guilda ainda não chegou nessa marca da Grande Colheita.',
  tipo_invalido: 'Tipo de aviso inválido.',
  params_invalidos: 'Dados do aviso inválidos.',
  repetido: 'Esse aviso já foi publicado.',
  mural_inexistente: 'Aviso não encontrado.',
  proprio_evento: 'Você não pode parabenizar a si mesmo.',
  ja_parabenizou: 'Você já parabenizou esse aviso.',
  prestigio_invalido: 'Prestígio não permitido agora.',
  convite_ja_usado: 'Você já usou um convite.',
  convite_tarde: 'Convites só valem para quem está começando.',
  convite_invalido: 'Código de convite não encontrado.',
  convite_proprio: 'Você não pode usar o próprio convite.',
  nada_a_resgatar: 'Nada para resgatar por enquanto.',
  ja_curtiu: 'Você já curtiu esse sítio hoje.',
  sem_premio: 'Sua guilda não ficou no pódio.',
};

const falha = (erro, extra = {}) => ({ ok: false, erro, mensagem: MENSAGENS[erro] || 'Algo deu errado.', ...extra });

export function criarApi(sb) {
  // Chama uma função do servidor e normaliza o resultado.
  async function chamar(nome, args = {}) {
    let r;
    try {
      r = await sb.rpc(nome, args);
    } catch (e) {
      return falha('rede');
    }
    if (r.error) {
      const m = String(r.error.message || '');
      if (/nao_autenticado/.test(m) || r.error.code === '28000') return falha('nao_autenticado');
      return falha(/fetch|network|Failed/i.test(m) ? 'rede' : 'servidor', { detalhe: m });
    }
    const d = r.data;
    if (!d || d.ok !== true) return falha(d?.erro || 'servidor', d && d.versao !== undefined ? { versao: d.versao } : {});
    return d;
  }

  const inteiro = (n, min, max) => Math.min(max, Math.max(min, Math.floor(Number(n) || 0)));

  return {
    // Garante uma sessão (login anônimo) e cria/lê o perfil.
    async entrar(nome) {
      try {
        const { data } = await sb.auth.getSession();
        if (!data?.session) {
          const { error } = await sb.auth.signInAnonymously();
          if (error) return falha('rede', { detalhe: error.message });
        }
      } catch (e) { return falha('rede'); }
      return chamar('jogo_iniciar', { p_nome: String(nome || '').trim() });
    },
    perfilAtualizar: ({ nome = null, nivel, poder, prestigio = 0 }) =>
      chamar('jogo_perfil_atualizar', { p_nome: nome, p_nivel: inteiro(nivel, 1, 30), p_poder: inteiro(poder, 0, Number.MAX_SAFE_INTEGER), p_prestigio: inteiro(prestigio, 0, 50) }),
    convite: {
      codigo: () => chamar('jogo_convite_codigo'),
      usar: codigo => chamar('jogo_convite_usar', { p_codigo: String(codigo || '').trim().slice(0, 12) }),
      resgatar: () => chamar('jogo_convites_resgatar'),
    },
    visitar: alvo => chamar('jogo_visitar', { p_alvo: alvo }),
    curtir: alvo => chamar('jogo_curtir', { p_alvo: alvo }),
    conta: { apagar: () => chamar('jogo_conta_apagar') },
    // Métricas anônimas: só nomes de uma lista fixa.
    evento: nome => chamar('jogo_evento', { p_nome: nome }),
    save: {
      carregar: () => chamar('jogo_save_carregar'),
      // versao = a que veio do último carregar/salvar (0 se ainda não existe save).
      salvar: (dados, versao) => chamar('jogo_save_salvar', { p_dados: dados, p_versao: inteiro(versao, 0, 2147483647) }),
    },
    guilda: {
      listar: () => chamar('jogo_guildas_listar'),
      criar: (nome, lema = '') => chamar('jogo_guilda_criar', { p_nome: String(nome || '').trim(), p_lema: String(lema || '').trim() }),
      entrar: id => chamar('jogo_guilda_entrar', { p_guilda: id }),
      sair: () => chamar('jogo_guilda_sair'),
      estado: () => chamar('jogo_guilda_estado'),
      // Corta o valor no teto do motivo, como o servidor faz, para não gastar chamada à toa.
      contribuir(pontos, motivo) {
        const teto = TETOS[motivo];
        if (!teto) return Promise.resolve(falha('motivo_invalido'));
        const p = inteiro(pontos, 0, teto);
        if (p < 1) return Promise.resolve(falha('pontos_invalidos'));
        return chamar('jogo_contribuir', { p_pontos: p, p_motivo: motivo });
      },
      doar: valor => chamar('jogo_guilda_doar', { p_valor: inteiro(valor, 0, 1e12) }),
      ajudar: alvo => chamar('jogo_guilda_ajudar', { p_alvo: alvo }),
      resgatarBau: indice => chamar('jogo_bau_resgatar', { p_indice: indice }),
    },
    mural: {
      postar: (tipo, params) => chamar('jogo_mural_postar', { p_tipo: tipo, p_params: params }),
      parabenizar: id => chamar('jogo_mural_parabenizar', { p_mural: id }),
      reagir: reacao => chamar('jogo_mural_reagir', { p_reacao: reacao }),
    },
    guildas: {
      ranking: (limite = 20) => chamar('jogo_ranking_guildas', { p_limite: inteiro(limite, 1, 50) }),
      premio: () => chamar('jogo_premio_guilda_resgatar'),
    },
    ranking: (limite = 50) => chamar('jogo_ranking', { p_limite: inteiro(limite, 1, 100) }),
  };
}
