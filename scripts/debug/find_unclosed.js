const fs = require('fs');
const s = fs.readFileSync('src/store/projectStore.ts','utf8');
const pairs = { '(':')', '{':'}', '[':']' };
const opens = [];
for (let i=0;i<s.length;i++){
  const c = s[i];
  if (pairs[c]) opens.push({c,i});
  else if (c === ')' || c === '}' || c === ']'){
    const last = opens[opens.length-1];
    if (last && pairs[last.c] === c) opens.pop();
    else {
      console.log('mismatched close', c, 'at', i);
    }
  }
}
if (opens.length===0) { console.log('no unclosed'); process.exit(0); }
console.log('unclosed count', opens.length);
for (const o of opens){
  const idx=o.i; let line=1,col=1; for(let i=0;i<idx;i++){ if(s[i]=='\n'){line++;col=1;} else col++; }
  console.log(o.c,'at index',o.i,'line',line,'col',col);
  console.log('---line---');
  console.log(s.split('\n')[line-1]);
}
