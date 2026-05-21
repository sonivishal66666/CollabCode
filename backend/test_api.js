fetch('https://emkc.org/api/v2/piston/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    language: 'java',
    version: '15.0.2',
    files: [{ name: 'Main.java', content: 'System.out.print("Hii");' }]
  })
}).then(res => res.json()).then(console.log);
