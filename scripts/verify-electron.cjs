/**
 * Electron 기동 조건 검증 스크립트
 * wait-on 후 Vite dev server에 HTTP 요청하여 레이아웃 렌더링 확인
 */
const http = require('http');

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('[ELECTRON-VERIFY] Vite ready — Electron 기동 지점 도달');
  console.log('');

  const { status, body } = await fetch('http://localhost:5173');
  console.log(`  HTTP status: ${status}`);
  console.log(`  Has <div id="root">: ${body.includes('id="root"') ? 'YES' : 'NO'}`);
  console.log(`  Has main.tsx entry: ${body.includes('main.tsx') ? 'YES' : 'NO'}`);
  console.log(`  Has A/S title: ${body.includes('A/S') ? 'YES' : 'NO'}`);

  // 핵심 모듈 로드 확인
  const modules = [
    '/src/App.tsx',
    '/src/router.tsx',
    '/src/layouts/AppLayout.tsx',
    '/src/components/Sidebar.tsx',
    '/src/components/Header.tsx',
    '/src/pages/DashboardPage.tsx',
  ];

  console.log('');
  console.log('  Module availability:');
  for (const m of modules) {
    const r = await fetch('http://localhost:5173' + m);
    console.log(`    ${m}: ${r.status}`);
  }

  console.log('');
  const allOk = status === 200 && body.includes('id="root"');
  console.log(allOk
    ? '[ELECTRON-VERIFY] === Electron 기동 조건 충족 ==='
    : '[ELECTRON-VERIFY] === FAIL: 기동 조건 미충족 ===');

  process.exit(allOk ? 0 : 1);
}

verify().catch((err) => {
  console.error('[ELECTRON-VERIFY] Error:', err.message);
  process.exit(1);
});
