import os from 'node:os'

const ipv4Private = ip => /^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
export function shareAddresses(networks, port, protocol = 'http:', base = '/') {
  const candidates = []
  for (const [name, addresses] of Object.entries(networks)) {
    if (/(loopback|docker|wsl|vethernet|vmware|vbox|radmin|vpn|tailscale|zerotier)/i.test(name)) continue
    for (const item of addresses || []) {
      if (item.internal || !['IPv4', 4].includes(item.family) || !ipv4Private(item.address)) continue
      candidates.push({ label: name + ' · ' + item.address, url: protocol + '//' + item.address + ':' + port + base, wifi: /wi-?fi|wireless|wlan/i.test(name) })
    }
  }
  return candidates.sort((a, b) => Number(b.wifi) - Number(a.wifi)).map(({ label, url }) => ({ label, url }))
}

// Development-only endpoint: exposes local sharing URLs, never .env or credentials.
export default function auralisShareQr() {
  return {
    name: 'auralis-share-qr',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__auralis/share-info', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.setHeader('Allow', 'GET'); res.end(); return }
        const address = server.httpServer?.address()
        const port = address && typeof address === 'object' ? address.port : server.config.server.port
        const host = server.config.server.host
        const urls = port ? shareAddresses(os.networkInterfaces(), port, server.config.server.https ? 'https:' : 'http:', server.config.base) : []
        const lanEnabled = host === true || host === '0.0.0.0' || host === '::' || urls.some(item => new URL(item.url).hostname === host)
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify({ urls, lanEnabled }))
      })
    },
  }
}
