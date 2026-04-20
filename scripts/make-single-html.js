const fs = require('fs');
const path = require('path');

/**
 * Simple script to inline JS and CSS from a Next.js static export into a single HTML file.
 */
async function bundle() {
  const outDir = path.join(process.cwd(), 'out');
  const indexPath = path.join(outDir, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error('Error: index.html not found in out/ folder. Please run "npm run build" first.');
    process.exit(1);
  }

  console.log('Reading index.html...');
  let html = fs.readFileSync(indexPath, 'utf8');

  // Helper to resolve paths that usually start with /_next/
  const resolvePath = (url) => {
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return path.join(outDir, cleanUrl);
  };

  // 1. Inline CSS <link rel="stylesheet" href="...">
  console.log('Inlining stylesheets...');
  const cssRegex = /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g;
  html = html.replace(cssRegex, (match, href) => {
    const fullPath = resolvePath(href);
    if (fs.existsSync(fullPath)) {
      console.log(`  + Inlining ${href}`);
      const content = fs.readFileSync(fullPath, 'utf8');
      return `<style>${content}</style>`;
    }
    console.warn(`  ! Could not find ${href} at ${fullPath}`);
    return match;
  });

  // 2. Inline JS <script src="..." defer></script>
  console.log('Inlining scripts...');
  const jsRegex = /<script[^>]+src="([^"]+)"[^>]*><\/script>/g;
  html = html.replace(jsRegex, (match, src) => {
    const fullPath = resolvePath(src);
    if (fs.existsSync(fullPath)) {
      console.log(`  + Inlining ${src}`);
      const content = fs.readFileSync(fullPath, 'utf8');
      // Escape closing script tags to prevent premature script termination
      const safeContent = content.replace(/<\/script>/g, '<\\/script>');
      return `<script>${safeContent}</script>`;
    }
    console.warn(`  ! Could not find ${src} at ${fullPath}`);
    return match;
  });

  // 3. Remove preloads (not needed in a single file and can cause browser warnings)
  console.log('Cleaning up header...');
  const preloadRegex = /<link[^>]+rel="preload"[^>]*>/g;
  html = html.replace(preloadRegex, '');
  
  // Remove module preloads
  const modulePreloadRegex = /<link[^>]+rel="modulepreload"[^>]*>/g;
  html = html.replace(modulePreloadRegex, '');

  // 4. Save the result
  const outputPath = path.join(outDir, 'toolbox-single.html');
  // Also save to root dist/ for accessibility if needed
  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);
  const finalPath = path.join(distDir, 'index.html');

  fs.writeFileSync(outputPath, html);
  fs.writeFileSync(finalPath, html);
  
  console.log('\n--------------------------------------------------');
  console.log(`SUCCESS: Single HTML file created!`);
  console.log(`Locate it at: ${finalPath}`);
  console.log('--------------------------------------------------\n');
}

bundle().catch(err => {
  console.error('Fatal error during bundling:', err);
  process.exit(1);
});
