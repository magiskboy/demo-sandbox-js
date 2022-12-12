var stream = require('stream');
var fs = require('fs');
var sandbox = require('./sandbox');
var HOST = process.env.HOST || '127.0.0.1';
var PORT = parseInt(process.env.PORT || '3000');

require('http').createServer(function(req, res) {
  const { url, method } = req;
  console.log({ url, method });

  if (url === '/' && method === 'GET') {
    const indexStream = fs.createReadStream('./index.html');
    res.writeHead(200, 'OK', { 'content-type': 'text/html' });
    indexStream.pipe(res);
    return;
  }

  if (url === '/run' && method === 'POST') {
    const chunks = [];
    req.on('data', function(chunk) {
      chunks.push(chunk);
    });

    req.on('end', function() {
      const code = chunks.join();
      const output = sandbox.runCode(code);
      res.write(JSON.stringify({
        output,
      }), function(err) {
        if (err)
          console.error(err);
        res.end();
      });
    });
    return;
  }
}).listen(PORT, HOST, function() {
  console.log('Server is starting on', HOST + ':' + PORT);
});

