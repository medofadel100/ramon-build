const fs = require('fs');
const path = 'src/store/projectStore.ts';
const s = fs.readFileSync(path, 'utf8');
const counts = { '(':0, ')':0, '{':0, '}':0, '[':0, ']':0 };
for (const c of s) {
  if (counts[c] !== undefined) counts[c]++;
}
console.log('counts:', counts);

// find first index where counts of a type go negative when scanning
const stack = [];
const pairs = { '(':')', '{':'}', '[':']' };
for (let i=0;i<s.length;i++){
  const c = s[i];
  if (pairs[c]) stack.push({c,i});
  else if (c === ')' || c === '}' || c === ']'){
    const last = stack.pop();
    if (!last || pairs[last.c] !== c) {
      console.log('mismatch at', i, c, 'stackTopBefore=', stack.slice(-3));
      const start = Math.max(0, i-120);
      const end = Math.min(s.length, i+60);
      console.log('---snippet---');
      console.log(s.slice(start,end));
      process.exit(0);
    }
  }
}
console.log('balanced');
