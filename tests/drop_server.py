"""Tiny server that promises a large file, sends a few bytes, then drops the connection."""
import socket
import sys

port = int(sys.argv[1])
s = socket.socket()
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind(("127.0.0.1", port))
s.listen(5)
while True:
    conn, _ = s.accept()
    conn.recv(4096)
    conn.sendall(b"HTTP/1.1 200 OK\r\nContent-Type: application/pdf\r\nContent-Length: 1000000\r\n\r\n%PDF-1.4 partial")
    conn.close()
