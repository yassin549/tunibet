const fs = require('fs');
const lines = fs.readFileSync('src/app/page.tsx', 'utf8').split('\n').slice(0, 255);
fs.writeFileSync('src/app/page.tsx', lines.join('\n'));
console.log('File cleaned successfully!');
