#!/bin/sh
set -e

python -c "
import threading, http.server, os

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'ok')
    def log_message(self, *args):
        pass

def serve():
    port = int(os.environ.get('PORT', 8080))
    http.server.HTTPServer(('0.0.0.0', port), Handler).serve_forever()

threading.Thread(target=serve, daemon=True).start()
" &

echo "Starting Celery worker..."
exec celery -A app.celery_app.celery_app worker --loglevel=info