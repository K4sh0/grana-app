const Contas = (() => {
  let editandoId = null;
  let statusSelecionado = 'pendente';

  const CATS_LABEL = {
    cartao: 'cartão de crédito', moradia: 'moradia', educacao: 'educação',
    saude: 'saúde / academia', transporte: 'transporte', alimentacao: 'alimentação',
    assinatura: 'assinatura / internet', parcelado: 'parcelado', outro: 'outro'
  };

  const CATS_COLOR = {
    cartao: '#5b8dee', moradia: '#1D9E75', educacao: '#9b72e8',
    saude: '#5DCAA5', transporte: '#d4944a', alimentacao: '#e05252',
    assinatura: '#D85A30', parcelado: '#888780', outro: '#7a7880'
  };

  function getCatColor(cat) { return CATS_COLOR[cat] || '#7a7880'; }
  function getCatLabel(cat) { return CATS_LABEL[cat] || cat; }

  function abrirModal(id) {
    editandoId = id || null;
    document.getElementById('modalContaTitulo').textContent = id ? 'editar conta' : 'nova conta';
    if (id) {
      const dados = DB.lerMes(Dashboard.mesAtual());
      const conta = dados.contas.find(c => c.id === id);
      if (conta) {
        document.getElementById('contaNome').value = conta.nome;
        document.getElementById('contaValor').value = conta.valor;
        document.getElementById('contaCategoria').value = conta.categoria;
        setStatus(conta.status || 'pendente');
      }
    } else {
      document.getElementById('contaNome').value = '';
      document.getElementById('contaValor').value = '';
      document.getElementById('contaCategoria').value = 'cartao';
      setStatus('pendente');
    }
    document.getElementById('modalConta').style.display = 'flex';
    setTimeout(() => document.getElementById('contaNome').focus(), 100);
  }

  function fecharModal() {
    document.getElementById('modalConta').style.display = 'none';
    editandoId = null;
  }

  function setStatus(s) {
    statusSelecionado = s;
    document.getElementById('btnPendente').classList.toggle('active', s === 'pendente');
    document.getElementById('btnPago').classList.toggle('active', s === 'pago');
  }

  function salvar() {
    const nome = document.getElementById('contaNome').value.trim();
    const valor = parseFloat(document.getElementById('contaValor').value) || 0;
    const categoria = document.getElementById('contaCategoria').value;
    if (!nome || valor <= 0) { alert('preencha nome e valor'); return; }

    const dados = DB.lerMes(Dashboard.mesAtual());
    if (editandoId) {
      const idx = dados.contas.findIndex(c => c.id === editandoId);
      if (idx >= 0) dados.contas[idx] = { ...dados.contas[idx], nome, valor, categoria, status: statusSelecionado };
    } else {
      dados.contas.push({ id: Date.now().toString(), nome, valor, categoria, status: statusSelecionado });
    }
    DB.salvarMes(Dashboard.mesAtual(), dados);
    fecharModal();
    renderLista();
    Dashboard.renderResumo();
  }

  function remover(id) {
    if (!confirm('remover esta conta?')) return;
    const dados = DB.lerMes(Dashboard.mesAtual());
    dados.contas = dados.contas.filter(c => c.id !== id);
    DB.salvarMes(Dashboard.mesAtual(), dados);
    renderLista();
    Dashboard.renderResumo();
  }

  function toggleStatus(id) {
    const dados = DB.lerMes(Dashboard.mesAtual());
    const idx = dados.contas.findIndex(c => c.id === id);
    if (idx >= 0) {
      dados.contas[idx].status = dados.contas[idx].status === 'pago' ? 'pendente' : 'pago';
      DB.salvarMes(Dashboard.mesAtual(), dados);
      renderLista();
      Dashboard.renderResumo();
    }
  }

  function salvarSalario(val) {
    const dados = DB.lerMes(Dashboard.mesAtual());
    dados.salario = parseFloat(val) || 0;
    DB.salvarMes(Dashboard.mesAtual(), dados);
    Dashboard.renderResumo();
  }

  function renderLista() {
    const mes = Dashboard.mesAtual();
    const dados = DB.lerMes(mes);
    document.getElementById('contasMesLabel').textContent = Dashboard.mesFormatado(mes);
    document.getElementById('salarioInput').value = dados.salario || '';

    const lista = document.getElementById('contasList');
    if (!dados.contas.length) {
      lista.innerHTML = '<div class="empty-state">nenhuma conta cadastrada neste mês</div>';
      return;
    }

    const total = dados.contas.reduce((a, c) => a + c.valor, 0);
    const pagas = dados.contas.filter(c => c.status === 'pago').reduce((a, c) => a + c.valor, 0);

    lista.innerHTML = `
      <div class="contas-summary">
        <span class="cs-item"><span class="cs-label">total</span><span class="cs-val">${fmt(total)}</span></span>
        <span class="cs-item"><span class="cs-label">pago</span><span class="cs-val ok">${fmt(pagas)}</span></span>
        <span class="cs-item"><span class="cs-label">pendente</span><span class="cs-val warn">${fmt(total - pagas)}</span></span>
      </div>
      ${dados.contas.map(c => `
        <div class="conta-item ${c.status === 'pago' ? 'pago' : ''}">
          <div class="conta-left">
            <span class="cat-dot" style="background:${getCatColor(c.categoria)}"></span>
            <div>
              <div class="conta-nome">${c.nome}</div>
              <div class="conta-cat">${getCatLabel(c.categoria)}</div>
            </div>
          </div>
          <div class="conta-right">
            <span class="conta-valor">${fmt(c.valor)}</span>
            <button class="status-btn ${c.status === 'pago' ? 'pago' : ''}" onclick="Contas.toggleStatus('${c.id}')">${c.status === 'pago' ? 'pago' : 'pendente'}</button>
            <button class="icon-btn" onclick="Contas.abrirModal('${c.id}')">&#9998;</button>
            <button class="icon-btn danger" onclick="Contas.remover('${c.id}')">&#10005;</button>
          </div>
        </div>
      `).join('')}
    `;
  }

  return { abrirModal, fecharModal, setStatus, salvar, remover, toggleStatus, salvarSalario, renderLista, getCatColor, getCatLabel };
})();

const Devedores = (() => {
  function abrirModal() {
    document.getElementById('devedorNome').value = '';
    document.getElementById('devedorValor').value = '';
    document.getElementById('devedorDesc').value = '';
    document.getElementById('modalDevedor').style.display = 'flex';
    setTimeout(() => document.getElementById('devedorNome').focus(), 100);
  }

  function fecharModal() {
    document.getElementById('modalDevedor').style.display = 'none';
  }

  function salvar() {
    const nome = document.getElementById('devedorNome').value.trim();
    const valor = parseFloat(document.getElementById('devedorValor').value) || 0;
    const desc = document.getElementById('devedorDesc').value.trim();
    if (!nome || valor <= 0) { alert('preencha nome e valor'); return; }
    const lista = DB.lerDevedores();
    lista.push({ id: Date.now().toString(), nome, valor, desc, pago: false });
    DB.salvarDevedores(lista);
    fecharModal();
    renderLista();
  }

  function togglePago(id) {
    const lista = DB.lerDevedores();
    const idx = lista.findIndex(d => d.id === id);
    if (idx >= 0) { lista[idx].pago = !lista[idx].pago; DB.salvarDevedores(lista); renderLista(); }
  }

  function remover(id) {
    if (!confirm('remover este devedor?')) return;
    DB.salvarDevedores(DB.lerDevedores().filter(d => d.id !== id));
    renderLista();
  }

  function renderLista() {
    const lista = DB.lerDevedores();
    const el = document.getElementById('devedoresList');
    if (!lista.length) { el.innerHTML = '<div class="empty-state">nenhum devedor cadastrado</div>'; return; }
    const total = lista.filter(d => !d.pago).reduce((a, d) => a + d.valor, 0);
    el.innerHTML = `
      <div class="devedores-total">total a receber: <strong>${fmt(total)}</strong></div>
      ${lista.map(d => `
        <div class="devedor-item ${d.pago ? 'pago' : ''}">
          <div class="devedor-left">
            <div class="devedor-nome">${d.nome}</div>
            ${d.desc ? `<div class="devedor-desc">${d.desc}</div>` : ''}
          </div>
          <div class="conta-right">
            <span class="conta-valor">${fmt(d.valor)}</span>
            <button class="status-btn ${d.pago ? 'pago' : ''}" onclick="Devedores.togglePago('${d.id}')">${d.pago ? 'recebido' : 'pendente'}</button>
            <button class="icon-btn danger" onclick="Devedores.remover('${d.id}')">&#10005;</button>
          </div>
        </div>
      `).join('')}
    `;
  }

  return { abrirModal, fecharModal, salvar, togglePago, remover, renderLista };
})();

function fmt(v) { return 'R$' + Math.round(v * 100) / 100 + ''.toLocaleString('pt-BR'); }
fmt.full = v => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Fecha modal ao clicar fora
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
  }
});
