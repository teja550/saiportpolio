# ==============================================================================
# LOCAL DEVELOPMENT SERVER: http://localhost:3000
# Run with: python server.py
# ==============================================================================

import http.server
import socketserver
import json
import urllib.request
import urllib.error
import os
import re
import traceback

PORT = 3000

# Load .env variables if present
env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ[key.strip()] = val.strip().strip('"\'')
    print("[Server] Loaded local environment variables from .env")

class PortfolioHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for local testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/contact' or self.path.startswith('/api/contact'):
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
            except Exception:
                data = {}

            name = str(data.get('name', '')).strip()
            email = str(data.get('email', '')).strip()
            subject = str(data.get('subject', '')).strip()
            message = str(data.get('message', '')).strip()
            bot_check = str(data.get('bot_check', '')).strip()

            print(f"[Server POST /api/contact] Name: {name}, Email: {email}, Subject: {subject}")

            # 1. Honeypot check
            if bot_check:
                print("[Server] Bot check triggered.")
                self._send_json(200, {"success": True, "message": "Message sent successfully! I’ll get back to you soon."})
                return

            # 2. Validation
            if not name or not email or not subject or not message:
                self._send_json(400, {"success": False, "error": "All required fields must be filled."})
                return

            email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
            if not re.match(email_regex, email):
                self._send_json(400, {"success": False, "error": "Please enter a valid email address."})
                return

            # Read email service credentials
            recipient_email = os.environ.get('TO_EMAIL', 'nagaramsaiteja57@gmail.com')
            web3_key = os.environ.get('WEB3FORMS_ACCESS_KEY')
            resend_key = os.environ.get('RESEND_API_KEY')

            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }

            # Provider 1: Web3Forms
            if web3_key:
                print("[Server] Sending via Web3Forms API...")
                payload = json.dumps({
                    "access_key": web3_key,
                    "name": name,
                    "email": email,
                    "replyto": email,
                    "subject": f"Portfolio Contact: {subject}",
                    "message": message,
                    "from_name": f"{name} (Portfolio Form)"
                }).encode('utf-8')

                req = urllib.request.Request(
                    "https://api.web3forms.com/submit",
                    data=payload,
                    headers=headers
                )

                try:
                    with urllib.request.urlopen(req) as resp:
                        res_data = json.loads(resp.read().decode('utf-8'))
                        if res_data.get('success'):
                            print("[Server] Web3Forms success!")
                            self._send_json(200, {"success": True, "message": "Message sent successfully! I’ll get back to you soon."})
                            return
                except Exception as e:
                    print(f"[Web3Forms Error] {e}")

            # Provider 2: Resend
            if resend_key:
                print("[Server] Sending via Resend API...")
                resend_headers = dict(headers)
                resend_headers["Authorization"] = f"Bearer {resend_key}"
                payload = json.dumps({
                    "from": "Portfolio Contact Form <onboarding@resend.dev>",
                    "to": [recipient_email],
                    "reply_to": email,
                    "subject": f"Portfolio Contact: {subject}",
                    "html": f"<h2>New Message from {name}</h2><p><strong>Email:</strong> {email}</p><p><strong>Subject:</strong> {subject}</p><p><strong>Message:</strong><br>{message}</p>"
                }).encode('utf-8')

                req = urllib.request.Request(
                    "https://api.resend.com/emails",
                    data=payload,
                    headers=resend_headers
                )

                try:
                    with urllib.request.urlopen(req) as resp:
                        if resp.status in (200, 201):
                            print("[Server] Resend success!")
                            self._send_json(200, {"success": True, "message": "Message sent successfully! I’ll get back to you soon."})
                            return
                except Exception as e:
                    print(f"[Resend Error] {e}")

            # Provider 3: FormSubmit Direct Delivery (Default Zero-Config Fallback)
            print(f"[Server] Sending direct to FormSubmit ({recipient_email})...")
            payload = json.dumps({
                "name": name,
                "email": email,
                "_replyto": email,
                "_subject": f"New Portfolio Contact: {subject}",
                "message": f"New Portfolio Contact\n\nName: {name}\nEmail: {email}\nSubject: {subject}\n\nMessage:\n{message}"
            }).encode('utf-8')

            req = urllib.request.Request(
                f"https://formsubmit.co/ajax/{recipient_email}",
                data=payload,
                headers=headers
            )

            try:
                with urllib.request.urlopen(req) as resp:
                    resp_body = resp.read().decode('utf-8')
                    print(f"[Server FormSubmit Response Status] {resp.status}: {resp_body}")
                    if resp.status == 200:
                        self._send_json(200, {"success": True, "message": "Message sent successfully! I'll get back to you soon."})
                        return
            except urllib.error.HTTPError as e:
                err_body = e.read().decode('utf-8') if e.fp else ''
                print(f"[FormSubmit HTTPError {e.code}] {e.reason}: {err_body}")
            except Exception as e:
                print(f"[FormSubmit Error] {e}")
                traceback.print_exc()

            self._send_json(500, {
                "success": False,
                "error": "Failed to send message. Please try again."
            })
        else:
            self.send_error(404, "Endpoint Not Found")

    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), PortfolioHTTPRequestHandler) as httpd:
        print("\n==================================================")
        print(f"Portfolio Local Server running at: http://localhost:{PORT}")
        print(f"Testing Contact API at: http://localhost:{PORT}/api/contact")
        print("==================================================\n")
        httpd.serve_forever()
