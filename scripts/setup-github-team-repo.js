const { execSync } = require('child_process')
const https = require('https')

function fillCredential() {
  const out = execSync('git credential fill', {
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const map = {}
  out.split('\n').forEach((line) => {
    const i = line.indexOf('=')
    if (i > 0) map[line.slice(0, i)] = line.slice(i + 1)
  })
  return map
}

function ghRequest(method, path, token, body) {
  const data = body ? JSON.stringify(body) : null
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.github.com',
        path,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'rak-control-setup',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let buf = ''
        res.on('data', (c) => (buf += c))
        res.on('end', () => {
          let json = null
          try {
            json = JSON.parse(buf)
          } catch {
            json = { raw: buf }
          }
          resolve({ status: res.statusCode, json })
        })
      }
    )
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

async function main() {
  let cred
  try {
    cred = fillCredential()
  } catch (e) {
    console.log('credential fill failed:', e.message)
    process.exit(1)
  }
  const user = cred.username || ''
  const token = cred.password || ''
  console.log(`cred user=${user} tokenLen=${token.length}`)
  if (!token) {
    console.log('empty token')
    process.exit(1)
  }

  const org = await ghRequest('GET', '/orgs/VANexus', token)
  console.log('org status', org.status, org.json?.login || org.json?.message)

  const existing = await ghRequest('GET', '/repos/VANexus/rak-control', token)
  console.log('repo get', existing.status, existing.json?.full_name || existing.json?.message)

  if (existing.status === 404) {
    const created = await ghRequest('POST', '/orgs/VANexus/repos', token, {
      name: 'rak-control',
      description: 'Rak WeChat miniprogram — flowmind task pool ROI',
      private: false,
      auto_init: false,
    })
    console.log('create', created.status, created.json?.full_name || created.json?.message || JSON.stringify(created.json).slice(0, 300))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
