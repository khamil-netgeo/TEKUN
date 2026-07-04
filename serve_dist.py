import http.server, socketserver, urllib.request, os, sys

DIST = '/home/ubuntu/sppt/frontend/dist'
API = 'http://127.0.0.1:8000'

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=DIST, **kw)

    def do_GET(self): self.route()
    def do_POST(self): self.route()
    def do_PUT(self): self.route()
    def do_PATCH(self): self.route()
    def do_DELETE(self): self.route()

    def route(self):
        if self.path.startswith('/api'):
            self.proxy()
        elif self.command == 'GET':
            # SPA fallback
            path = self.path.split('?')[0]
            fs_path = os.path.join(DIST, path.lstrip('/'))
            if path != '/' and not os.path.exists(fs_path):
                self.path = '/index.html'
            super().do_GET()
        else:
            self.send_error(405)

    def proxy(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length else None
        url = API + self.path
        req = urllib.request.Request(url, data=body, method=self.command)
        for k, v in self.headers.items():
            if k.lower() not in ('host', 'content-length', 'connection', 'accept-encoding'):
                req.add_header(k, v)
        req.add_header('Accept-Encoding', 'identity')
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
                self.send_response(resp.status)
                for k, v in resp.headers.items():
                    if k.lower() not in ('transfer-encoding', 'connection', 'content-encoding', 'content-length'):
                        self.send_header(k, v)
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            data = e.read()
            self.send_response(e.code)
            for k, v in e.headers.items():
                if k.lower() not in ('transfer-encoding', 'connection', 'content-encoding', 'content-length'):
                    self.send_header(k, v)
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self.send_error(502, str(e))

    def log_message(self, *a): pass

socketserver.ThreadingTCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(('0.0.0.0', 5174), Handler) as httpd:
    print('serving on 5174', flush=True)
    httpd.serve_forever()
