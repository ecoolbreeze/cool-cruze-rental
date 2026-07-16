const fs = require('fs');
const path = require('path');

async function main() {
  const loginRes = await fetch('http://localhost:3000/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=admin&password=admin123',
    redirect: 'manual'
  });

  const cookie = loginRes.headers.get('set-cookie') || '';
  const formData = new FormData();
  formData.append('name', 'Upload Test Product');
  formData.append('brand', 'Test Brand');
  formData.append('capacity', '1.5 Ton');
  formData.append('type', 'Tower');
  formData.append('monthly_price', '1200');
  formData.append('description', 'Upload verification');
  formData.append('features', 'Test');
  formData.append('stock', '1');
  formData.append('image', new Blob([fs.readFileSync(path.join(process.cwd(), 'public', 'uploads', 'hero-3.png'))], { type: 'image/png' }), 'hero-3.png');

  const uploadRes = await fetch('http://localhost:3000/admin/products', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: formData,
    redirect: 'manual'
  });

  const body = await uploadRes.text();
  const result = {
    loginStatus: loginRes.status,
    uploadStatus: uploadRes.status,
    location: uploadRes.headers.get('location') || '',
    body: body.slice(0, 500)
  };

  fs.writeFileSync(path.join(process.cwd(), 'verification-upload.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  fs.writeFileSync(path.join(process.cwd(), 'verification-upload.json'), JSON.stringify({ error: err.message }, null, 2));
  console.error(err);
  process.exit(1);
});
