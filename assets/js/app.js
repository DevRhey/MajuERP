// Main Application File

class App {
  constructor() {
    this.currentPage = "dashboard";
    this.modules = {
      clientes: null,
      itens: null,
      eventos: null,
      calendario: null,
      dashboard: null,
      orcamentos: null,
      financeiro: null,
    };
    this.initializeApp();
  }

  initializeApp() {
    // Initialize navigation
    this.initializeNavigation();

    // Initialize modules
    this.initializeModules();

    // Load initial page
    this.loadPage(this.currentPage);
  }

  initializeNavigation() {
    // Delegação garante captura mesmo se elementos mudarem ou ícones forem clicados
    document.addEventListener("click", (e) => {
      const link = e.target.closest(".nav-link[data-page]");
      if (!link) return;
      e.preventDefault();
      const page = link.dataset.page;
      this.loadPage(page);
    });
  }

  loadPage(page) {
    if (!page) {
      console.warn("Página não informada", page);
      UI.showAlert("Página inválida.", "warning");
      return;
    }
    this.currentPage = page;

    // Limpar intervalos do dashboard anterior
    if (this.modules.dashboard && this.modules.dashboard.relogioInterval) {
      clearInterval(this.modules.dashboard.relogioInterval);
    }
    if (this.modules.dashboard && this.modules.dashboard.autoRefreshInterval) {
      clearInterval(this.modules.dashboard.autoRefreshInterval);
    }
    if (this.modules.dashboard && this.modules.dashboard.removerStorageListener) {
      this.modules.dashboard.removerStorageListener();
    }

    // Update active nav link
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
      if (link.dataset.page === page) {
        link.classList.add("active");
      }
    });

    // Load page content
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.innerHTML = "";
    }

    try {
      switch (page) {
        case "dashboard":
          this.loadDashboard();
          break;
        case "clientes":
          this.loadClientes();
          break;
        case "itens":
          this.loadItens();
          break;
        case "eventos":
          this.loadEventos();
          break;
        case "calendario":
          this.loadCalendario();
          break;
        case "orcamentos":
          this.loadOrcamentos();
          break;
        case "financeiro":
          this.loadFinanceiro();
          break;
        default:
          console.warn("Página desconhecida", page);
          UI.showAlert("Página não encontrada.", "danger");
          return;
      }
    } catch (err) {
      console.error("Erro ao carregar página", page, err);
      UI.showAlert("Erro ao abrir a página. Verifique o console.", "danger");
    }
  }

  loadDashboard() {
    if (!this.modules.dashboard) {
      this.modules.dashboard = new Dashboard();
    }
    this.modules.dashboard.render();
  }

  loadClientes() {
    if (!this.modules.clientes) {
      this.modules.clientes = new Clientes();
    }
    this.modules.clientes.render();
  }

  loadItens() {
    if (!this.modules.itens) {
      this.modules.itens = new Itens();
    }
    this.modules.itens.render();
  }

  loadEventos() {
    if (typeof Eventos === "undefined") {
      UI.showAlert("Módulo Eventos não carregou.", "danger");
      console.error("Eventos não carregado");
      return;
    }
    if (!this.modules.eventos) {
      this.modules.eventos = new Eventos();
    }
    this.modules.eventos.render();
  }

  loadCalendario() {
    if (!this.modules.calendario) {
      this.modules.calendario = new Calendario();
    }
    this.modules.calendario.render();
  }

  loadOrcamentos() {
    if (typeof Orcamentos === "undefined") {
      UI.showAlert("Módulo Orçamentos não carregou.", "danger");
      return;
    }
    if (!this.modules.orcamentos) {
      this.modules.orcamentos = new Orcamentos();
    }
    this.modules.orcamentos.render();
  }

  loadFinanceiro() {
    if (typeof Financeiro === "undefined") {
      UI.showAlert("Módulo Financeiro não carregou.", "danger");
      return;
    }
    if (!this.modules.financeiro) {
      this.modules.financeiro = new Financeiro();
    }
    this.modules.financeiro.render();
  }

  initializeModules() {
    // Initialize data if not exists
    if (!Storage.get("clientes")) {
      Storage.save("clientes", []);
    }
    if (!Storage.get("itens")) {
      Storage.save("itens", []);
    }
    if (!Storage.get("eventos")) {
      Storage.save("eventos", []);
    }
    if (!Storage.get("orcamentos")) {
      Storage.save("orcamentos", []);
    }
    if (!Storage.get("financeiroTransacoes")) {
      Storage.save("financeiroTransacoes", []);
    }
    if (!Storage.get("formasPagamento")) {
      Storage.save("formasPagamento", [
        { id: "pix", nome: "PIX" },
        { id: "debito", nome: "Débito" },
        { id: "credito", nome: "Crédito" },
        { id: "dinheiro", nome: "Dinheiro" },
      ]);
    }

    // Initialize module instances
    this.modules.dashboard = new Dashboard();
    this.modules.clientes = new Clientes();
    this.modules.itens = new Itens();
    this.modules.eventos = new Eventos();
    this.modules.calendario = new Calendario();
    this.modules.orcamentos = new Orcamentos();
    this.modules.financeiro = new Financeiro();
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
