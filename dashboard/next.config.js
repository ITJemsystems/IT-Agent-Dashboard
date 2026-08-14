/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ==============================================================
  // CABECALHOS DE SEGURANCA
  // --------------------------------------------------------------
  // Camada extra de protecao no navegador - reduz superficie de
  // ataque contra XSS, clickjacking, MIME sniffing, e forca HTTPS.
  // O Vercel ja cuida de TLS/certificado automaticamente; isso
  // aqui e sobre COMO o navegador deve se comportar com o conteudo.
  // ==============================================================
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Impede que a dashboard seja carregada dentro de um <iframe>
          // em outro site - defesa contra clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Impede o navegador de "adivinhar" o tipo de um arquivo
          // diferente do Content-Type declarado
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Forca HTTPS por 2 anos, incluindo subdominios
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Restringe de onde a pagina pode carregar recursos -
          // ajuda a mitigar XSS mesmo se algum codigo malicioso
          // conseguir ser injetado
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' https://login.microsoftonline.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          // Nao envia a URL completa como referrer para outros sites
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Desabilita APIs de navegador que a dashboard nao usa
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

module.exports = nextConfig
