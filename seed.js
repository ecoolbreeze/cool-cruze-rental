const db = require('./db');

const sampleProducts = [
  {
    name: '1.5 Ton 5-Star Inverter Split AC',
    brand: 'LG',
    capacity: '1.5 Ton',
    type: 'Split',
    monthly_price: 1499,
    description: 'Premium LG 1.5 Ton 5-Star Inverter Split AC with dual inverter compressor, 100% copper, and anti-virus filter. Perfect for medium-sized rooms.',
    features: '5-Star Energy Rating,Dual Inverter Compressor,100% Copper,Hindi+English Display,Anti-Virus Filter',
    stock: 5
  },
  {
    name: '2 Ton 3-Star Window AC',
    brand: 'Voltas',
    capacity: '2 Ton',
    type: 'Window',
    monthly_price: 1299,
    description: 'Reliable Voltas 2 Ton Window AC with high ambient cooling, turbo mode, and anti-dust filter. Ideal for large rooms and small offices.',
    features: '3-Star Energy Rating,Turbo Mode,Anti-Dust Filter,High Ambient Cooling',
    stock: 3
  },
  {
    name: '1.5 Ton 4-Star Inverter Split AC',
    brand: 'Samsung',
    capacity: '1.5 Ton',
    type: 'Split',
    monthly_price: 1399,
    description: 'Samsung 1.5 Ton 4-Star Inverter Split AC with digital inverter technology, fast cooling, and auto-clean feature.',
    features: '4-Star Energy Rating,Digital Inverter,Auto Clean,Fast Cooling,Triple Protector Plus',
    stock: 4
  },
  {
    name: '2 Ton 5-Star Inverter Split AC',
    brand: 'Daikin',
    capacity: '2 Ton',
    type: 'Split',
    monthly_price: 1799,
    description: 'Daikin 2 Ton 5-Star Inverter Split AC with swing compressor, PM 2.5 filter, and powerful cooling for larger spaces.',
    features: '5-Star Energy Rating,Swing Compressor,PM 2.5 Filter,Powerful Cooling,Coanda Airflow',
    stock: 2
  },
  {
    name: '1 Ton 3-Star Window AC',
    brand: 'Blue Star',
    capacity: '1 Ton',
    type: 'Window',
    monthly_price: 999,
    description: 'Blue Star 1 Ton Window AC — budget-friendly cooling for small rooms. Features anti-bacterial filter and sleep mode.',
    features: '3-Star Energy Rating,Anti-Bacterial Filter,Sleep Mode,Compact Design',
    stock: 6
  },
  {
    name: '3 Ton Tower AC',
    brand: 'LG',
    capacity: '3 Ton',
    type: 'Tower',
    monthly_price: 2499,
    description: 'LG 3 Ton Tower AC for large commercial spaces. Powerful cooling with wide airflow distribution and smart inverter technology.',
    features: 'Inverter Technology,Wide Airflow,Commercial Grade,Smart Diagnosis,Anti-Bacterial',
    stock: 2
  }
];

function run() {
  if (db.getAllProducts().length > 0) return;
  sampleProducts.forEach(p => db.addProduct(p));
  console.log('Seeded ' + sampleProducts.length + ' sample products.');
}

if (require.main === module) {
  run();
}

module.exports = { run };
