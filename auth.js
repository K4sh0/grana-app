const Dashboard = (() => {
  let mesCorrente = new Date();
  let charts = {};

  function mesAtual() {
    const y = mesCorrente.getFullYear();
    const m = String(mesCorrente.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  function mesFormatado(chave) {
    if (!chave) chave = mesAtual();
    const [y, m] = chave.split('-');
    const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    return `${meses[parseInt(m) - 1]}/${y}`;
  }

  function mesAnterior() {
    mesCorrente.setMonth(mesCorrente.getMonth() - 1);
    atualizarLabel();
    renderResumo();
    const pag = document.querySelector('.nav-btn.active');
    if (pag) {
      const id = pag.getAttribute('onclick').match(/'([^']+)'/)[1];
      if (id === 'contas') Contas.renderLista();
      if (id === 'alertas') Alertas.render();
    }
  }

  function mesProximo() {
    mesCorrente.setMonth(mesCorrente.getMonth() + 1);
    atualizarLabel();
    renderResumo();
    const pag = document.querySelector('.nav-btn.active');
    if (pag) {
      const id = pag.getAttribute('onclick').match(/'([^']+)'/)[1];
      if (id === 'contas') Contas.renderLista();
      if (id === 'alertas') Alertas.render();
    }
  }

  function atualizarLabel() {
    document.getElementById('mesLabel').textContent = mesFormatado(mesAtual());
  }

  function renderResumo() {
    const mes = mesAtual();
    const dados = DB.lerMes(mes);
    const totalContas = dados.contas.reduce((a, c) => a + c.valor, 0);
    const pagas = dados.contas.filter(c => c.status === 'pago').reduce((a, c) => a + c.valor, 0);
    const pendente = totalContas - pagas;
    const sobra = dados.salario - totalContas;

    const grid = document.getElementById('metricsGrid');
    grid.innerHTML = `
      <div class="mcard"><div class="mcard-label">salário</div><div class="mcard-val b">${fmtR(dados.salario)}</div></div>
      <div class="mcard"><div class="mcard-label">total contas</div><div class="mcard-val a">${fmtR(totalContas)}</div></div>
      <div class="mcard"><div class="mcard-val ${sobra >= 0 ? 'g' : 'r'}">${fmtR(sobra)}</div><div class="mcard-label">sobra do mês</div></div>
      <div class="mcard"><div class="mcard-val warn">${fmtR(pendente)}</div><div class="mcard-label">a pagar</div></div>
    `;

    renderChartFluxo(dados.salario, pagas, pendente);
    renderChartCats(dados.contas);
  }

  function renderChartFluxo(salario, pago, pendente) {
    if (charts.fluxo) charts.fluxo.destroy();
    charts.fluxo = new Chart(document.getElementById('chartFluxo'), {
      type: 'bar',
      data: {
        labels: ['salário', 'pago', 'pendente', 'sobra'],
        datasets: [{
          data: [salario, pago, pendente, Math.max(0, salario - pago - pendente)],
          backgroundColor: ['#5b8dee99','#1D9E7599','#d4944a99','#9b72e899'],
          borderColor: ['#5b8dee','#1D9E75','#d4944a','#9b72e8'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmtR(ctx.raw) } } },
        scales: {
          x: { ticks: { color: '#7a7880', font: { size: 11 } }, grid: { color: '#2a2a32' } },
          y: { ticks: { color: '#7a7880', font: { size: 10 }, callback: v => 'R$' + v }, grid: { color: '#2a2a32' } }
        }
      }
    });
  }

  function renderChartCats(contas) {
    if (charts.cats) charts.cats.destroy();
    if (!contas.length) return;

    const agg = {};
    contas.forEach(c => { agg[c.categoria] = (agg[c.categoria] || 0) + c.valor; });
    const labels = Object.keys(agg).map(Contas.getCatLabel);
    const values = Object.values(agg);
    const colors = Object.keys(agg).map(Contas.getCatColor);

    charts.cats = new Chart(document.getElementById('chartCats'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderColor: '#0f0f11', borderWidth: 2 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'right', labels: { color: '#7a7880', font: { size: 11 }, boxWidth: 10, padding: 8 } },
          tooltip: { callbacks: { label: ctx => ctx.label + ': ' + fmtR(ctx.raw) } }
        }
      }
    });
  }

  function renderGraficos() {
    const meses = DB.listarMeses();
    if (!meses.length) {
      document.getElementById('chartHistorico').parentElement.innerHTML = '<div class="empty-state">sem dados históricos ainda</div>';
      return;
    }

    const labels = meses.map(mesFormatado);
    const salarios = meses.map(m => DB.lerMes(m).salario || 0);
    const gastos = meses.map(m => DB.lerMes(m).contas.reduce((a, c) => a + c.valor, 0));

    if (charts.historico) charts.historico.destroy();
    charts.historico = new Chart(document.getElementById('chartHistorico'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Salário', data: salarios, backgroundColor: '#5b8dee33', borderColor: '#5b8dee', borderWidth: 1 },
          { label: 'Gastos', data: gastos, backgroundColor: '#e0525233', borderColor: '#e05252', borderWidth: 1 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#7a7880', font: { size: 10 }, maxRotation: 45 }, grid: { color: '#2a2a32' } },
          y: { ticks: { color: '#7a7880', font: { size: 10 }, callback: v => 'R$' + v }, grid: { color: '#2a2a32' } }
        }
      }
    });

    // Evolução por categoria
    const todasCats = [...new Set(meses.flatMap(m => DB.lerMes(m).contas.map(c => c.categoria)))];
    const COLORS = ['#5b8dee','#d4944a','#e05252','#1D9E75','#9b72e8','#5DCAA5','#D85A30','#888780','#7a7880'];

    const leg = document.getElementById('legendCats'); leg.innerHTML = '';
    const datasets = todasCats.map((cat, i) => {
      const cor = COLORS[i % COLORS.length];
      const sp = document.createElement('span'); sp.className = 'leg-item';
      sp.innerHTML = `<span class="leg-dot" style="background:${cor}"></span>${Contas.getCatLabel(cat)}`;
      leg.appendChild(sp);
      return {
        label: Contas.getCatLabel(cat),
        data: meses.map(m => DB.lerMes(m).contas.filter(c => c.categoria === cat).reduce((a, c) => a + c.valor, 0)),
        borderColor: cor, backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 2, tension: 0.3
      };
    });

    if (charts.evolucao) charts.evolucao.destroy();
    charts.evolucao = new Chart(document.getElementById('chartEvolucao'), {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#7a7880', font: { size: 10 }, maxRotation: 45 }, grid: { color: '#2a2a32' } },
          y: { ticks: { color: '#7a7880', font: { size: 10 }, callback: v => 'R$' + v }, grid: { color: '#2a2a32' } }
        }
      }
    });
  }

  function init() {
    atualizarLabel();
    renderResumo();
  }

  function fmtR(v) {
    return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return { init, mesAtual, mesFormatado, mesAnterior, mesProximo, renderResumo, renderGraficos };
})();

const Alertas = (() => {
  let filtroAtual = 'mes';

  function filtrar(tipo, btn) {
    filtroAtual = tipo;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  }

  function render() {
    const lista = document.getElementById('alertasList');
    const alertas = [];
    const mes = Dashboard.mesAtual();

    if (filtroAtual === 'mes') {
      const dados = DB.lerMes(mes);
      const total = dados.contas.reduce((a, c) => a + c.valor, 0);
      const sobra = dados.salario - total;
      const pendentes = dados.contas.filter(c => c.status === 'pendente');

      if (dados.salario === 0) alertas.push({ t: 'warn', tag: 'salário não definido', msg: `Você não definiu o salário para ${Dashboard.mesFormatado(mes)}. Vá em "contas" para configurar.` });
      if (sobra < 0) alertas.push({ t: 'danger', tag: 'saldo negativo', msg: `Seus gastos (R$ ${total.toFixed(2)}) superam o salário (R$ ${dados.salario.toFixed(2)}) em R$ ${Math.abs(sobra).toFixed(2)} este mês.` });
      if (sobra >= 0 && sobra < dados.salario * 0.1 && dados.salario > 0) alertas.push({ t: 'warn', tag: 'margem apertada', msg: `A sobra do mês é de apenas R$ ${sobra.toFixed(2)} (${((sobra/dados.salario)*100).toFixed(0)}% do salário). Considere revisar os gastos.` });
      if (pendentes.length > 0) alertas.push({ t: 'warn', tag: `${pendentes.length} conta(s) pendente(s)`, msg: pendentes.map(c => `${c.nome}: R$ ${c.valor.toFixed(2)}`).join(' · ') });

      const devedores = DB.lerDevedores().filter(d => !d.pago);
      if (devedores.length) alertas.push({ t: 'ok', tag: 'a receber', msg: `Você tem R$ ${devedores.reduce((a,d)=>a+d.valor,0).toFixed(2)} a receber de ${devedores.length} pessoa(s): ${devedores.map(d=>d.nome).join(', ')}.` });

    } else {
      const meses = DB.listarMeses();
      meses.forEach(m => {
        const dados = DB.lerMes(m);
        const total = dados.contas.reduce((a, c) => a + c.valor, 0);
        const sobra = dados.salario - total;
        const label = Dashboard.mesFormatado(m);
        if (sobra < 0) alertas.push({ t: 'danger', tag: `saldo negativo — ${label}`, msg: `Gastos superaram o salário em R$ ${Math.abs(sobra).toFixed(2)}.` });
        if (sobra >= 0 && sobra < dados.salario * 0.1 && dados.salario > 0) alertas.push({ t: 'warn', tag: `margem apertada — ${label}`, msg: `Sobra de apenas R$ ${sobra.toFixed(2)} (${((sobra/dados.salario)*100).toFixed(0)}%).` });
      });

      const devedores = DB.lerDevedores().filter(d => !d.pago);
      if (devedores.length) alertas.push({ t: 'ok', tag: 'total a receber', msg: `R$ ${devedores.reduce((a,d)=>a+d.valor,0).toFixed(2)} pendente de ${devedores.length} devedor(es).` });
    }

    if (!alertas.length) {
      lista.innerHTML = '<div class="empty-state">nenhum alerta para este período</div>';
      return;
    }

    lista.innerHTML = alertas.map(a => `
      <div class="alert ${a.t}">
        <span class="alert-tag">${a.tag}</span>${a.msg}
      </div>
    `).join('');
  }

  return { filtrar, render };
})();
