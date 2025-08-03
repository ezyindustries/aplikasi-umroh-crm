// Debug server routes directly
const path = require('path');
process.env.NODE_ENV = 'development';

// Change to backend directory
process.chdir(path.join(__dirname, 'backend/whatsapp'));

// Load server
console.log('Loading server.js...');
const app = require('./server');

// Wait a bit for async initialization
setTimeout(() => {
    console.log('\nChecking registered routes...\n');
    
    // Get all routes
    function print(path, layer) {
        if (layer.route) {
            layer.route.stack.forEach(function (route) {
                if (route.method) {
                    console.log(`${route.method.toUpperCase()} ${path}${layer.route.path}`);
                }
            });
        } else if (layer.name === 'router' && layer.handle.stack) {
            layer.handle.stack.forEach(function (stackItem) {
                print(path + split(layer.regexp), stackItem);
            });
        }
    }

    function split(thing) {
        if (typeof thing === 'string') {
            return thing;
        } else if (thing.fast_slash) {
            return '';
        } else {
            var match = thing.toString()
                .replace('\\/?', '')
                .replace('(?=\\/|$)', '$')
                .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\/$/);
            return match
                ? match[1].replace(/\\(.)/g, '$1')
                : '<complex:' + thing.toString() + '>';
        }
    }

    app._router.stack.forEach(function (middleware) {
        if (middleware.name === 'router') {
            console.log('\nRouter middleware found at:', middleware.regexp);
            middleware.handle.stack.forEach(r => {
                if (r.route) {
                    const methods = Object.keys(r.route.methods).join(',').toUpperCase();
                    console.log(`  ${methods} ${r.route.path}`);
                }
            });
        }
    });
    
    console.log('\nDone.');
    process.exit(0);
}, 2000);