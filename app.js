(() => {
  "use strict";
  const cfg = window.SITE_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const validStart = cfg.START_AT && !Number.isNaN(Date.parse(cfg.START_AT));
  const validSupabase = cfg.SUPABASE_URL && cfg.SUPABASE_URL.startsWith("https://") && cfg.SUPABASE_PUBLISHABLE_KEY && !cfg.SUPABASE_PUBLISHABLE_KEY.startsWith("COLE_AQUI");
  const CHALLENGE_TARGET = 59826042;
  let client = null;

  const formatNumber = n => Math.round(Number(n) || 0).toLocaleString("pt-BR");

  function updateClock() {
    if (!validStart) { $("clock-note").textContent = "Falta configurar a data e hora do marco inicial no arquivo config.js."; return; }
    const start = new Date(cfg.START_AT).getTime();
    const end = cfg.END_AT && !Number.isNaN(Date.parse(cfg.END_AT)) ? new Date(cfg.END_AT).getTime() : Date.now();
    let sec = Math.floor(Math.max(0, end - start) / 1000);
    const days = Math.floor(sec / 86400); sec %= 86400;
    const hours = Math.floor(sec / 3600); sec %= 3600;
    const mins = Math.floor(sec / 60); sec %= 60;
    $("days").textContent = String(days).padStart(3, "0");
    $("hours").textContent = String(hours).padStart(2, "0");
    $("minutes").textContent = String(mins).padStart(2, "0");
    $("seconds").textContent = String(sec).padStart(2, "0");
    $("clock-label").textContent = cfg.END_AT ? "TEMPO ATÉ O ENCERRAMENTO REGISTRADO" : "TEMPO DECORRIDO";
    $("clock-note").textContent = cfg.END_AT ? `${cfg.START_LABEL || "Marco inicial"} · Encerrado: ${cfg.END_LABEL || cfg.END_AT}` : `${cfg.START_LABEL || "Marco inicial"} · Início: ${new Date(cfg.START_AT).toLocaleString("pt-BR")}`;
  }

  function updateChallenge(total) {
    const current = Math.max(0, Number(total) || 0);
    const remaining = Math.max(0, CHALLENGE_TARGET - current);
    const progress = Math.min(100, current / CHALLENGE_TARGET * 100);
    $("challenge-current").textContent = formatNumber(current);
    $("challenge-remaining").textContent = formatNumber(remaining);
    $("challenge-bar").style.width = `${progress}%`;
    const track = document.querySelector(".challenge-track");
    if (track) track.setAttribute("aria-valuenow", String(progress.toFixed(6)));
    $("challenge-progress").textContent = current >= CHALLENGE_TARGET
      ? `Meta simbólica superada! ${formatNumber(current - CHALLENGE_TARGET)} voto(s) acima da meta.`
      : `${progress.toLocaleString("pt-BR", { maximumFractionDigits: 6 })}% da meta alcançada`;
  }

  function localVoterKey() {
    const keyName = "relogio_publico_voter_id_v1";
    let id = localStorage.getItem(keyName);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(keyName, id);
    }
    return id;
  }

  function setMessage(message, isError = false) {
    $("vote-message").textContent = message;
    $("vote-message").style.color = isError ? "#ff9b9b" : "var(--green)";
  }

  async function loadResults() {
    if (!client) return;
    const { data, error } = await client.rpc("get_vote_totals");
    if (error) { setMessage("Não foi possível carregar os resultados. Confira a configuração do Supabase.", true); return; }
    const totals = data && data[0] ? data[0] : { prisao: 0, saida: 0, total: 0 };
    const prison = Number(totals.prisao || 0);
    const exit = Number(totals.saida || 0);
    const total = Number(totals.total || 0);
    updateChallenge(total);
    const p1 = total ? Math.round(prison / total * 100) : 0;
    const p2 = total ? 100 - p1 : 0;
    $("total-votes").textContent = `${formatNumber(total)} ${total === 1 ? "voto" : "votos"}`;
    $("prison-pct").textContent = `${p1}%`;
    $("exit-pct").textContent = `${p2}%`;
    $("prison-bar").style.width = `${p1}%`;
    $("exit-bar").style.width = `${p2}%`;
  }

  async function init() {
    updateClock();
    setInterval(updateClock, 1000);
    updateChallenge(0);
    if (!validSupabase || !window.supabase) {
      setMessage("Configure as credenciais do Supabase em config.js para ativar a votação.", true);
      return;
    }
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
    await loadResults();
    setInterval(loadResults, 15000);
    const priorVote = localStorage.getItem("relogio_publico_voted_v1");
    if (priorVote) {
      document.querySelectorAll('input[name="choice"]').forEach(el => { el.disabled = true; if (el.value === priorVote) el.checked = true; });
      $("vote-button").disabled = true;
      $("vote-button").textContent = "Voto já registrado neste navegador";
      setMessage("Este navegador já registrou um voto. A limitação local pode ser contornada usando outro navegador ou dispositivo.");
    }
    $("vote-form").addEventListener("submit", async event => {
      event.preventDefault();
      if (!client) return;
      if (localStorage.getItem("relogio_publico_voted_v1")) { setMessage("Este navegador já registrou um voto.", true); return; }
      const choice = new FormData($("vote-form")).get("choice");
      if (!choice) { setMessage("Escolha uma opção antes de votar.", true); return; }
      $("vote-button").disabled = true;
      $("vote-button").textContent = "Registrando...";
      const { data, error } = await client.rpc("cast_vote", { p_voter_key: localVoterKey(), p_choice: choice });
      if (error) {
        setMessage("Não foi possível registrar o voto. Verifique se o SQL foi executado no Supabase.", true);
        $("vote-button").disabled = false;
        $("vote-button").textContent = "Registrar meu voto";
        return;
      }
      const status = data && data[0] ? data[0].status : data;
      localStorage.setItem("relogio_publico_voted_v1", choice);
      setMessage(status === "already_voted" ? "Este identificador já tinha registrado um voto." : "Voto registrado. Obrigado por participar!");
      document.querySelectorAll('input[name="choice"]').forEach(el => { el.disabled = true; });
      $("vote-button").textContent = "Voto registrado";
      await loadResults();
    });
  }

  $("share-button").addEventListener("click", async () => {
    const data = { title: document.title, text: "Confira o relógio público e participe da enquete.", url: location.href };
    if (navigator.share) { try { await navigator.share(data); } catch (_) {} }
    else {
      try { await navigator.clipboard.writeText(location.href); setMessage("Link copiado para compartilhar!"); }
      catch (_) { setMessage("Copie o endereço do navegador para compartilhar.", true); }
    }
  });
  $("copy-button").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(location.href); setMessage("Link copiado!"); }
    catch (_) { setMessage("Não foi possível copiar automaticamente. Copie o endereço do navegador.", true); }
  });
  document.addEventListener("DOMContentLoaded", init);
})();
