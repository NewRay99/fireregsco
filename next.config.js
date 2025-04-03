/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Disable caching in development
    workerThreads: false,
    cpus: 1
  }
}

module.exports = nextConfig 