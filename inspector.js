import app from './server.js'; // Your Express app instance
import readline from 'readline';

const BASE_URL = `http://localhost:${process.env.PORT || 5001}`;

// Function to clean Express internal regex paths
function cleanPathRegex(regex) {
  let path = regex.toString()
    .replace(/^\/\^/, '')                         // remove leading /^
    .replace(/\?\(\?=\\\/\|\$\)\/i$/, '')         // remove trailing express regex
    .replace(/\\\//g, '/')                        // unescape slashes
    .replace(/\(\?:\(\[\^\\\/]\+\?\)\)/g, ':param') // convert path params
    .replace(/\$$/, '')                           // remove ending $
    .trim();

  return path.startsWith('/') ? path : '/' + path;
}

// Recursively extract all routes
function extractRoutes(stack, prefix = '') {
  const routes = [];

  for (const layer of stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods);
      methods.forEach(method => {
        const fullPath = normalizePath(prefix + layer.route.path);
        routes.push({ method: method.toUpperCase(), path: fullPath });
      });
    } else if (layer.name === 'router' && layer.handle?.stack) {
      const newPrefix = prefix + cleanPathRegex(layer.regexp);
      routes.push(...extractRoutes(layer.handle.stack, newPrefix));
    }
  }

  return routes;
}

// Normalize extra slashes from merged paths
function normalizePath(path) {
  return path.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
}

// CLI menu
function runInspector() {
  console.log('🧠 Scanning Express routes...\n');

  if (!app._router?.stack) {
    console.error('❌ No router stack found in app. Check your app export.');
    return;
  }

  const routes = extractRoutes(app._router.stack);

  if (routes.length === 0) {
    console.warn('⚠️ No routes found.');
    return;
  }

  routes.forEach((route, index) => {
    console.log(`${index + 1}. [${route.method}] ${route.path}`);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\n👉 Enter the number of the route to view full details: ', (input) => {
    const index = parseInt(input.trim()) - 1;

    if (index >= 0 && index < routes.length) {
      const route = routes[index];
      const fullUrl = BASE_URL + route.path;
      console.log(`\n🔍 Route Info:\nMethod: ${route.method}\nPath: ${route.path}\nFull URL: ${fullUrl}`);
    } else {
      console.log('❌ Invalid selection.');
    }

    rl.close();
  });
}

runInspector();
