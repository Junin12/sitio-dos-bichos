// Ajudantes dos testes: criam um banco temporário em um Postgres local (15 ou mais),
// aplicam as migrações reais e simulam o cliente do Supabase (rpc) com psql.
//
// Usa as variáveis padrão do Postgres: PGHOST, PGPORT e PGUSER.
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const env = {
  ...process.env,
  PGHOST: process.env.PGHOST || '/tmp',
  PGPORT: process.env.PGPORT || '5432',
  PGUSER: process.env.PGUSER || 'postgres',
};
const migracoes = new URL('../supabase/migrations/', import.meta.url);

function psql(banco, sql) {
  const r = spawnSync('psql', ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-d', banco, '-f', '-'], {
    input: sql, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024,
  });
  return { ok: r.status === 0, saida: (r.stdout || '').trim(), erro: (r.stderr || '').trim() };
}

export function criarBanco() {
  const nome = 'sitio_test_' + randomBytes(5).toString('hex');
  const c = spawnSync('createdb', [nome], { encoding: 'utf8', env });
  if (c.status !== 0) throw new Error('Não consegui criar o banco de teste. Postgres rodando? ' + c.stderr);
  const arquivos = [new URL('./prelude.sql', import.meta.url), ...readdirSync(migracoes).sort().map(f => new URL(f, migracoes))];
  for (const a of arquivos) {
    const r = psql(nome, readFileSync(a, 'utf8'));
    if (!r.ok) throw new Error('Falha em ' + a.pathname + ': ' + r.erro);
  }
  return nome;
}

export function removerBanco(nome) {
  spawnSync('dropdb', ['--if-exists', '--force', nome], { env });
}

// Força o valor a ir como JSON (ex.: um texto ou número solto em um parâmetro jsonb).
export const json = v => ({ __json: v });
const lit = v => {
  if (v && v.__json !== undefined) return `'${JSON.stringify(v.__json).replace(/'/g, "''")}'::jsonb`;
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
  return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
};
const msg = e => (e.match(/ERROR:\s+(.*)/) || [, e])[1];

// Imita supabase.rpc(nome, args). uid null = sem login. papel: authenticated ou anon.
export function cliente(banco, uid, papel = 'authenticated') {
  return {
    uid,
    async rpc(nome, args = {}) {
      const lista = Object.keys(args).map(k => `${k} => ${lit(args[k])}`).join(', ');
      const sql = `reset role; set "request.jwt.claim.sub" = '${uid || ''}'; set role ${papel}; select public.${nome}(${lista});`;
      const r = psql(banco, sql);
      if (!r.ok) return { data: null, error: { message: msg(r.erro) } };
      return { data: JSON.parse(r.saida), error: null };
    },
  };
}

// Roda SQL solto como um usuário (para provar o que as permissões bloqueiam).
export function comoUsuario(banco, uid, sql, papel = 'authenticated') {
  return psql(banco, `reset role; set "request.jwt.claim.sub" = '${uid || ''}'; set role ${papel}; ${sql}`);
}

// Roda SQL como administrador e devolve as linhas em JSON.
export function consulta(banco, sql) {
  const r = psql(banco, `select coalesce(json_agg(t), '[]'::json) from (${sql}) t;`);
  if (!r.ok) throw new Error(r.erro);
  return JSON.parse(r.saida);
}
export function admin(banco, sql) {
  const r = psql(banco, sql);
  if (!r.ok) throw new Error(r.erro);
  return r.saida;
}

export function novoUsuario(banco) {
  return consulta(banco, 'insert into auth.users default values returning id')[0]?.id
    ?? admin(banco, 'insert into auth.users default values returning id');
}

// Cria um jogador já com perfil e nível. Nível 5 ou mais pode usar guilda.
export async function jogador(banco, nome, nivel = 1) {
  const id = admin(banco, 'insert into auth.users default values returning id;');
  const c = cliente(banco, id);
  const a = await c.rpc('jogo_iniciar', { p_nome: nome });
  if (!a.data?.ok) throw new Error('iniciar falhou: ' + JSON.stringify(a));
  // O servidor limita o salto de nível (+5 por vez), então subimos aos poucos.
  for (let atual = 1; atual < nivel;) {
    atual = Math.min(nivel, atual + 5);
    const b = await c.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: atual, p_poder: 0 });
    if (!b.data?.ok) throw new Error('atualizar falhou: ' + JSON.stringify(b));
  }
  return c;
}
