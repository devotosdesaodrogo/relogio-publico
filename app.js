(() => {
  "use strict";
  const cfg = window.SITE_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const validSupabase = Boolean(
    cfg.SUPABASE_URL && cfg.SUPABASE_URL.startsWith("https://") &&
    cfg.SUPABASE_PUBLISHABLE_KEY &&
    !cfg.SUPABASE_PUBLISHABLE_KEY.startsWith("COLE_AQUI")
  );
  let client = null;

  const formatNumber = n => Math.round(Number(n) || 0).toLocaleString("pt-BR");

  function renderDuration(prefix, startValue, endValue, label, note, endedText, runningText) {
    const startMs = Date.parse(startValue || "");
    if (!Number.isFinite(startMs)) {
      $(`${prefix}-note`).textContent = "A data inicial ainda não foi configurada corretamente em config.js.";
      return;
    }
    const parsedEnd = endValue ? Date.parse(endValue) : NaN;
    const hasEnd = Number.isFinite(parsedEnd);
    const endMs = hasEnd ? parsedEnd : Date.now();
    let seconds = Math.floor(Math.max(0, endMs - startMs) / 1000);
    const days = Math.floor(seconds / 86400); seconds %= 86400;
    const hours = Math.floor(seconds / 3600); seconds %= 3600;
    const minutes = Math.floor(seconds / 60); seconds %= 60;

    $(`${prefix}-days`).textContent = formatNumber(days);
    $(`${prefix}-hours`).textContent = String(hours).padStart(2, "0");
    $(`${prefix}-minutes`).textContent = String(minutes).padStart(2, "0");
    $(`${prefix}-seconds`).textContent = String(seconds).padStart(2, "0");
    $(`${prefix}-clock-label`).textContent = hasEnd ? endedText : runningText;
    $(`${prefix}-note`).textContent = note;
  }

  function updateClocks() {
    const flightAt = cfg.FLIGHT_AT || "2026-10-27T06:22:00-03:00";
    const flightLabel = cfg.FLIGHT_LABEL || "27/10/2026, às 06h22, horário de Brasília";
    const startLabel = cfg.START_LABEL || "Marco inicial";
    const startDisplay = cfg.START_AT ? new Date(cfg.START_AT).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "";
    const flightDisplay = new Date(flightAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    renderDuration(
      "flight",
      cfg.START_AT,
      flightAt,
      "",
      `${startLabel} · Início: ${startDisplay}. Encerrado em ${flightLabel}.`,
      "CONTAGEM ENCERRADA NO MARCO REGISTRADO",
      "TEMPO DECORRIDO ATÉ O MARCO REGISTRADO"
    );
    renderDuration(
      "arrest",
      flightAt,
      cfg.ARREST_AT || "",
      "",
      cfg.ARREST_AT
        ? `Início: ${flightDisplay}. Encerrado: ${cfg.ARREST_LABEL || "Prisão confirmada"} · ${new Date(cfg.ARREST_AT).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`
        : `Início: ${flightLabel}. Contagem em andamento; será encerrada quando uma data e hora de prisão forem confirmadas e registradas.`,
      "TEMPO ATÉ O HORÁRIO DE PRISÃO REGISTRADO",
      "TEMPO DECORRIDO DESDE O MARCO INICIAL"
    );
  }

  async function loadOriginalPollResult() {
    if (!client) {
      $("exit-pct").textContent = "—%";
      $("vote-base").textContent = "Não foi possível conectar ao resultado original da enquete.";
      $("results-note").textContent = "Verifique a configuração de leitura do Supabase. Nenhuma votação é aceita nesta página.";
      return;
    }
    const { data, error } = await client.rpc("get_vote_totals");
    if (error) {
      $("exit-pct").textContent = "—%";
      $("vote-base").textContent = "Resultado original temporariamente indisponível.";
      $("results-note").textContent = "Os dados originais não foram alterados. Tente novamente mais tarde.";
      return;
    }
    const totals = data && data[0] ? data[0] : { prisao: 0, saida: 0, total: 0 };
    const exitVotes = Math.max(0, Number(totals.saida) || 0);
    const totalVotes = Math.max(0, Number(totals.total) || 0);
    const percentage = totalVotes ? Math.round(exitVotes / totalVotes * 100) : 0;
    $("exit-pct").textContent = `${percentage}%`;
    $("vote-base").textContent = `${formatNumber(exitVotes)} de ${formatNumber(totalVotes)} votos da enquete original`;
    $("results-note").textContent = "Percentual calculado a partir dos votos registrados na enquete original. A enquete expressa as opiniões de seus participantes e não representa necessariamente a população brasileira.";
  }

  async function init() {
    updateClocks();
    window.setInterval(updateClocks, 1000);

    if (!validSupabase || !window.supabase) {
      await loadOriginalPollResult();
      return;
    }
    try {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });
      await loadOriginalPollResult();
    } catch (_) {
      await loadOriginalPollResult();
    }
  }

  $("share-button").addEventListener("click", async () => {
    const data = {
      title: document.title,
      text: "Confira o relógio público, a contagem registrada e o resultado da enquete original.",
      url: location.href
    };
    if (navigator.share) {
      try { await navigator.share(data); } catch (_) {}
    } else {
      try {
        await navigator.clipboard.writeText(location.href);
        $("share-button").textContent = "Link copiado!";
      } catch (_) {
        $("share-button").textContent = "Copie o endereço do navegador para compartilhar.";
      }
    }
  });

  $("copy-button").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      $("copy-button").textContent = "Link copiado!";
    } catch (_) {
      $("copy-button").textContent = "Copie o endereço do navegador.";
    }
  });

  document.addEventListener("DOMContentLoaded", init);
})();

