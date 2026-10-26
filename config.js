/*
  CONFIGURAÇÃO DO SITE
  1) Cole o Project URL e a Publishable key do Supabase.
  2) Defina START_AT com a data/hora exata do marco inicial, incluindo fuso.
     Exemplo de formato: "2026-10-25T21:00:00-03:00"
  Não use a service_role/secret key no navegador.
*/
window.SITE_CONFIG = {
  SUPABASE_URL: "https://psdyqlkvyfwvbpzidxfw.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_W_FBCkcW-8t_sXfk5sK8xA_SWJB9J85",
  START_AT: "2026-10-25T21:00:00-03:00",
  START_LABEL: "Desde o anúncio oficial do resultado",
  // Deixe END_AT vazio para continuar contando. Para encerrar, informe data/hora ISO.
  END_AT: "",
  END_LABEL: ""
};
