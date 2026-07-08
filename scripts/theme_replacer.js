const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../src');

const replacements = {
  // Backgrounds
  'bg-\\[#13151c\\]': 'bg-card',
  'bg-\\[#0d0e12\\]': 'bg-background',
  'bg-\\[#0a0b0e\\]': 'bg-background',
  'bg-slate-900': 'bg-muted',
  'bg-slate-950': 'bg-background',
  'bg-slate-800': 'bg-accent',
  'bg-\\[#c5a880\\]': 'bg-primary',
  
  // Text
  'text-\\[#c5a880\\]': 'text-primary',
  'text-slate-400': 'text-muted-foreground',
  'text-slate-500': 'text-muted-foreground',
  'text-slate-300': 'text-secondary-foreground',
  'text-slate-200': 'text-foreground',
  'text-slate-100': 'text-foreground',
  'text-white': 'text-foreground',
  'text-\\[#0d0e12\\]': 'text-primary-foreground',
  
  // Borders
  'border-\\[#222634\\]': 'border-border',
  'border-slate-800': 'border-border',
  'border-slate-700': 'border-border',
  'border-\\[#c5a880\\]': 'border-primary',
};

function processDirectory(directory) {
  fs.readdirSync(directory).forEach(file => {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      for (const [search, replace] of Object.entries(replacements)) {
        // Build regex considering tailwind classes are space, quote or backtick separated
        const regex = new RegExp(`(?<=[\\s"'\\\`])` + search + `(?=[\\s"'\\\`/])`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, replace);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  });
}

processDirectory(directoryPath);
console.log('Theme replacement complete!');
