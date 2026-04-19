const SENHA_HASH = '7d4e5b26cb7a0e71fd33d0887303a04dd0f40ba924c4768bb2f2dcc8622bc1bd';
const SESSAO_KEY = 'grana_sessao';
const SESSAO_HORAS = 24;

async function hashSenha(senha) {
  const encoder = new TextEncoder();
  const data = encoder.encode(senha);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function entrar() {
  const input = document.getElementById('senhaInput');
  const erro = document.getElementById('loginErro');
  const senha = input.value;
  if (!senha) return;

  const hash = await hashSenha(senha);
  if (hash === SENHA_HASH) {
    const expira = Date.now() + (SESSAO_HORAS * 60 * 60 * 1000);
    localStorage.setItem(SESSAO_KEY, JSON.stringify({ expira }));
    window.location.href = 'app.html';
  } else {
    erro.textContent = 'senha incorreta';
    input.value = '';
    input.focus();
    setTimeout(() => erro.textContent = '', 2500);
  }
}

function authVerificarSessao() {
  const raw = localStorage.getItem(SESSAO_KEY);
  if (!raw) return false;
  try {
    const { expira } = JSON.parse(raw);
    if (Date.now() > expira) { localStorage.removeItem(SESSAO_KEY); return false; }
    return true;
  } catch { return false; }
}

function authSair() {
  localStorage.removeItem(SESSAO_KEY);
  window.location.href = 'index.html';
}
