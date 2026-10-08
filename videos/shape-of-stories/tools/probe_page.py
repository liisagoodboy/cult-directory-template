# 打开片子页面，打印 VS.late / VS.timeline / 报错（不渲染）
import sys, http.server, socketserver, functools, threading, json
from playwright.sync_api import sync_playwright
root, film = sys.argv[1], sys.argv[2]
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=root)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1920, 'height': 1080})
    pg.on('console', lambda m: print('[page]', m.type, m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: print('[pageerror]', e))
    pg.goto(f'http://127.0.0.1:{port}/index.html?render=1&film={film}')
    pg.wait_for_function('window.__ready === true || !!window.__bootFailed', timeout=120000)
    if len(sys.argv) > 3:
        open(sys.argv[3], 'w').write(pg.evaluate("JSON.stringify(VS.board.S.filter(s => s.kind !== 'fill').map(s => ({k: s.kind, t0: s.t0, t1: s.t1, n: s.str ? [...s.str].length : 0, len: s.len || 0})))"))
    print(pg.evaluate('JSON.stringify({fail: window.__bootFailed||null, late: VS.late, tl: VS.timeline, mv: VS.MV, total: window.__total})'))
    b.close()
srv.shutdown()
