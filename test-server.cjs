const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    console.log(`📡 Request: ${req.url}`);
    
    if (req.url === '/' || req.url === '/test.html') {
        fs.readFile(path.join(__dirname, 'test.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading file');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.url === '/react') {
        fs.readFile(path.join(__dirname, 'react-test.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading React test');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.url === '/classic') {
        fs.readFile(path.join(__dirname, 'o4s-classic.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading O4S Classic');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`🚀 Servidor de teste rodando em http://localhost:${PORT}`);
    console.log(`📝 Teste básico: http://localhost:${PORT}/test.html`);
    console.log(`⚛️ Teste React: http://localhost:${PORT}/react`);
    console.log(`🎯 O4S Clássico: http://localhost:${PORT}/classic`);
});

server.on('error', (err) => {
    console.error('❌ Erro no servidor:', err);
});