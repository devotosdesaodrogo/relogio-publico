/*
  CONFIGURAÇÃO DO SITE
  Use somente a Publishable key no navegador. Nunca use service_role/secret key aqui.
*/
window.SITE_CONFIG = {
  SUPABASE_URL: "https://psdyqlkvyfwvbpzidxfw.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_W_FBCkcW-8t_sXfk5sK8xA_SWJB9J85",

  // Marco inicial do contador histórico (mantido do projeto original).
  START_AT: "2026-10-25T21:00:00-03:00",
  START_LABEL: "Desde o anúncio oficial do resultado",

  // Marco escolhido para encerrar a contagem até a fuga.
  FLIGHT_AT: "2026-10-27T06:22:00-03:00",
  FLIGHT_LABEL: "Decolagem informada às 06h22, horário de Brasília",

  // Deixe vazio até haver uma data e hora confirmadas para o evento.
  // Ao confirmar uma prisão, preencha no formato ISO com fuso, por exemplo:
  // ARREST_AT: "2026-11-01T14:30:00-03:00"
  ARREST_AT: "",
  ARREST_LABEL: "Prisão confirmada"
};

