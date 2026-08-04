const { exec } = require('child_process');
const fs = require('fs');

exec('npx tsc --noEmit', (err, stdout, stderr) => {
  const lines = stdout.split('\n');
  const errorMap = {};
  
  lines.forEach(line => {
    const match = line.match(/([^(]+)\((\d+),\d+\):\s+error\s+(TS\d+):\s+(.*)/);
    if (match) {
      const file = match[1].trim();
      const lineNum = match[2];
      const code = match[3];
      const msg = match[4];
      
      if (!errorMap[file]) errorMap[file] = [];
      errorMap[file].push({ line: lineNum, code, msg });
    }
  });
  
  fs.writeFileSync('ts_grouped_errors.json', JSON.stringify(errorMap, null, 2), 'utf8');
  console.log('Success! Grouped errors written to ts_grouped_errors.json');
});
