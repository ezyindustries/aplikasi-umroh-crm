// Test backend routes
const express = require('express');
const app = express();

// Load API routes
const apiRoutes = require('./backend/whatsapp/src/routes/api.js');

// Mount routes
app.use('/api', apiRoutes);

// List all routes
function printRoutes(path, layer) {
    if (layer.route) {
        layer.route.stack.forEach(function (routeLayer) {
            console.log(`${layer.route.stack[0].method.toUpperCase()} ${path}${layer.route.path}`);
        });
    } else if (layer.name === 'router' && layer.handle.stack) {
        layer.handle.stack.forEach(function (stackItem) {
            printRoutes(path + split(layer.regexp), stackItem);
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

console.log('Registered API Routes:');
console.log('======================');

// Check template routes specifically
const templateRoutes = app._router.stack
    .filter(r => r.regexp && r.regexp.toString().includes('template'))
    .map(r => r.regexp.toString());

console.log('\nTemplate-related routes:', templateRoutes);

// Try to access templateController directly
try {
    const templateController = require('./backend/whatsapp/src/controllers/templateController');
    console.log('\n✅ templateController loaded successfully');
    console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(templateController)));
} catch (error) {
    console.log('\n❌ Error loading templateController:', error.message);
}

// Check if routes are properly registered
app._router.stack.forEach(function (r) {
    if (r.route && r.route.path) {
        console.log(`${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`);
    }
});