// ===== Estado da Aplicação =====
let tarefas = carregarTarefas();
let filtroAtual = 'todas';
let dataCalendarioAtual = new Date();
let dataSelecionadaFiltro = null;

// ===== Elementos DOM =====
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskDateInput = document.getElementById('taskDateInput');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');

const statTotal = document.getElementById('statTotal');
const statPendentes = document.getElementById('statPendentes');
const statConcluidas = document.getElementById('statConcluidas');
const statProgresso = document.getElementById('statProgresso');

const clearCompletedBtn = document.getElementById('clearCompleted');
const filtersNav = document.getElementById('filters');
const dataAtualEl = document.getElementById('dataAtual');

const calendarDaysEl = document.getElementById('calendarDays');
const calendarMonthYearEl = document.getElementById('calendarMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

// ===== Persistência =====
function carregarTarefas() {
  const dados = localStorage.getItem('tarefas_v2');
  return dados ? JSON.parse(dados) : [];
}

function salvarTarefas() {
  localStorage.setItem('tarefas_v2', JSON.stringify(tarefas));
}

// ===== Renderização Principal =====
function renderizar() {
  renderizarTarefas();
  atualizarEstatisticas();
  renderizarCalendario();
}

function renderizarTarefas() {
  taskList.innerHTML = '';

  const tarefasFiltradas = tarefas.filter((t) => {
    // Filtro por status
    if (filtroAtual === 'pendentes' && t.concluida) return false;
    if (filtroAtual === 'concluidas' && !t.concluida) return false;

    // Filtro por data do calendário (se selecionada)
    if (dataSelecionadaFiltro && t.data) {
      return t.data === dataSelecionadaFiltro;
    }

    return true;
  });

  tarefasFiltradas.forEach((tarefa) => {
    const item = document.createElement('li');
    item.className = `task-card ${tarefa.concluida ? 'is-done' : ''}`;

    const dataFormatada = tarefa.data
      ? new Date(tarefa.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      : 'Sem data';

    item.innerHTML = `
      <div class="task-card__left">
        <input type="checkbox" class="custom-checkbox" ${tarefa.concluida ? 'checked' : ''}>
        <span class="task-card__text">${escaparHTML(tarefa.texto)}</span>
      </div>
      <div class="task-card__meta">
        <span class="date-badge">📅 ${dataFormatada}</span>
        <button class="delete-btn" aria-label="Excluir tarefa">✕</button>
      </div>
    `;

    item.querySelector('.custom-checkbox').addEventListener('change', () => {
      alternarConclusao(tarefa.id);
    });

    item.querySelector('.delete-btn').addEventListener('click', () => {
      excluirTarefa(tarefa.id);
    });

    taskList.appendChild(item);
  });

  emptyState.classList.toggle('is-visible', tarefasFiltradas.length === 0);
}

function atualizarEstatisticas() {
  const total = tarefas.length;
  const concluidas = tarefas.filter((t) => t.concluida).length;
  const pendentes = total - concluidas;
  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  statTotal.textContent = total;
  statPendentes.textContent = pendentes;
  statConcluidas.textContent = concluidas;
  statProgresso.textContent = `${progresso}%`;
}

// ===== Calendário =====
function renderizarCalendario() {
  const ano = dataCalendarioAtual.getFullYear();
  const mes = dataCalendarioAtual.getMonth();

  calendarMonthYearEl.textContent = dataCalendarioAtual.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  calendarDaysEl.innerHTML = '';

  const primeiroDiaMes = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
  const hoje = new Date();

  // Preencher espaços vazios antes do primeiro dia
  for (let i = 0; i < primeiroDiaMes; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'calendar-day empty';
    calendarDaysEl.appendChild(emptyDiv);
  }

  // Preencher os dias do mês
  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.textContent = dia;

    const dataString = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    // Marcar hoje
    if (
      hoje.getDate() === dia &&
      hoje.getMonth() === mes &&
      hoje.getFullYear() === ano
    ) {
      dayDiv.classList.add('today');
    }

    // Marcar selecionado
    if (dataSelecionadaFiltro === dataString) {
      dayDiv.classList.add('selected');
    }

    dayDiv.addEventListener('click', () => {
      if (dataSelecionadaFiltro === dataString) {
        dataSelecionadaFiltro = null; // Desseleciona se clicar no mesmo
      } else {
        dataSelecionadaFiltro = dataString;
      }
      renderizar();
    });

    calendarDaysEl.appendChild(dayDiv);
  }
}

// ===== Ações =====
function adicionarTarefa(texto, data) {
  const novaTarefa = {
    id: Date.now(),
    texto: texto.trim(),
    data: data || null,
    concluida: false,
  };

  tarefas.unshift(novaTarefa);
  salvarTarefas();
  renderizar();
}

function alternarConclusao(id) {
  tarefas = tarefas.map((t) => (t.id === id ? { ...t, concluida: !t.concluida } : t));
  salvarTarefas();
  renderizar();
}

function excluirTarefa(id) {
  tarefas = tarefas.filter((t) => t.id !== id);
  salvarTarefas();
  renderizar();
}

function limparConcluidas() {
  tarefas = tarefas.filter((t) => !t.concluida);
  salvarTarefas();
  renderizar();
}

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// ===== Eventos =====
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const texto = taskInput.value.trim();
  const data = taskDateInput.value;

  if (!texto) return;

  adicionarTarefa(texto, data);
  taskInput.value = '';
  taskDateInput.value = '';
  taskInput.focus();
});

clearCompletedBtn.addEventListener('click', limparConcluidas);

filtersNav.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;

  filtroAtual = btn.dataset.filter;
  document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');

  renderizarTarefas();
});

prevMonthBtn.addEventListener('click', () => {
  dataCalendarioAtual.setMonth(dataCalendarioAtual.getMonth() - 1);
  renderizarCalendario();
});

nextMonthBtn.addEventListener('click', () => {
  dataCalendarioAtual.setMonth(dataCalendarioAtual.getMonth() + 1);
  renderizarCalendario();
});

// ===== Inicialização =====
(function init() {
  const hoje = new Date();
  dataAtualEl.textContent = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  renderizar();
})();