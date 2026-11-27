import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security Headers raccomandati da OWASP
const securityHeaders = [
  // Blocca Clickjacking: il sito non può essere incorporato in iframe esterni
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Impedisce al browser di interpretare file con MIME-type errato o manipolato
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Invia il referrer solo per richieste same-origin e rimuove percorsi sensibili su cross-origin
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Disabilita funzionalità hardware non necessarie nel browser (camera, microfono, sensori)
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  // Forza HTTPS e precarica HSTS nei browser moderni
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Protezione XSS legacy per browser più vecchi
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};

export default nextConfig;
