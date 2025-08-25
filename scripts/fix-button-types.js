#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
      walk(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      acc.push(full);
    }
  }
  return acc;
}

function fixButtons(file) {
  const src = fs.readFileSync(file, 'utf8');
  // Add type="button" to <button> tags that do not already have a type attribute
  const re = /<button(?![^>]*\btype=)([^>]*)>/gi;
  const out = src.replace(re, (m, attrs) => `<button type="button"${attrs}>`);
  if (out !== src) {
    fs.writeFileSync(file, out, 'utf8');
    return true;
  }
  return false;
}

const root = process.cwd();
const files = walk(root);
let changed = 0;
for (const f of files) {
  if (fixButtons(f)) changed++;
}
console.log(`Updated ${changed} file(s) with explicit button types.`);

