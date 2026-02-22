const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 1111;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    // API: Bookmarks
    const bookmarksPath = path.join(__dirname, 'data', 'bookmarks.json');
    const defaultBookmarksPath = path.join(__dirname, 'data', 'bookmarks.default.json');

    if (req.url === '/api/bookmarks' && req.method === 'GET') {
        fs.readFile(bookmarksPath, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // Start from default config for new repositories
                    fs.readFile(defaultBookmarksPath, 'utf8', (defaultErr, defaultData) => {
                        if (defaultErr) {
                            console.error('Error reading default bookmarks:', defaultErr);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to read default bookmarks' }));
                        } else {
                            // Copy default to personal bookmarks.json
                            fs.writeFile(bookmarksPath, defaultData, (writeErr) => {
                                if (writeErr) console.error("Failed to copy default bookmarks", writeErr);
                            });
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(defaultData);
                        }
                    });
                } else {
                    console.error('Error reading bookmarks:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to read bookmarks' }));
                }
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            }
        });
        return;
    }

    if (req.url === '/api/bookmarks' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                    throw new Error('Invalid data format');
                }

                fs.writeFile(bookmarksPath, JSON.stringify(parsed, null, 4), (err) => {
                    if (err) {
                        console.error('Error saving bookmarks:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to save bookmarks' }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    }
                });
            } catch (e) {
                console.error('Invalid JSON posted:', e);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // API: Notes
    if (req.url === '/api/notes') {
        const notesPath = path.join(__dirname, 'data', 'notes.json');

        if (req.method === 'GET') {
            fs.readFile(notesPath, 'utf8', (err, data) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        // Return default empty notes if file missing
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ notes: ["", "", ""] })); 
                    } else {
                        console.error('Error reading notes:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to read notes' }));
                    }
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(data);
                }
            });
            return;
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    // Start validation
                    const parsed = JSON.parse(body);
                    if (!parsed || !Array.isArray(parsed.notes)) {
                         throw new Error('Invalid data format');
                    }
                    
                    fs.writeFile(notesPath, JSON.stringify(parsed, null, 2), (err) => {
                        if (err) {
                            console.error('Error saving notes:', err);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to save notes' }));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true }));
                        }
                    });
                } catch (e) {
                    console.error('Invalid JSON posted:', e);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
            });
            return;
        }
    }

    // API: Todos
    if (req.url === '/api/todos') {
        const todosPath = path.join(__dirname, 'data', 'todos.json');

        if (req.method === 'GET') {
            fs.readFile(todosPath, 'utf8', (err, data) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ todos: {} })); 
                    } else {
                        console.error('Error reading todos:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to read todos' }));
                    }
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(data);
                }
            });
            return;
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (!parsed || typeof parsed.todos !== 'object') {
                         throw new Error('Invalid data format');
                    }
                    
                    fs.writeFile(todosPath, JSON.stringify(parsed, null, 2), (err) => {
                        if (err) {
                            console.error('Error saving todos:', err);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to save todos' }));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true }));
                        }
                    });
                } catch (e) {
                    console.error('Invalid JSON posted:', e);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
            });
            return;
        }
    }

    // Static File Serving
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
