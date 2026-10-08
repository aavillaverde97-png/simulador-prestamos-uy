// node test.js — chequea el motor contra fórmulas cerradas y contra el modelo original
const C = require('./calc.js');
const near = (a, b, tol, msg) => {
  if (Math.abs(a - b) > tol) { console.error('FALLA', msg, a, b); process.exitCode = 1; }
  else console.log('ok  ', msg, a.toFixed(4));
};
const base = { cap: 10000, tea: 8, n: 30, com: 2.5, iva: 22, seg: 7.5, ivaInt: false, comFin: true };
const P = 10000 * (1 + 0.025 * 1.22);
const r = Math.pow(1.08, 1 / 12) - 1;

// Francés: igual al modelo original
const fr = C.schedule({ ...base, sys: 'fr' });
const pmt = P * r / (1 - Math.pow(1 + r, -30));
near(fr.first, pmt + 7.5, 1e-9, 'francés 1ª cuota');
near(fr.total, (pmt + 7.5) * 30, 1e-6, 'francés total');
near(fr.rows[29].end, 0, 1e-9, 'francés saldo final 0');

// Alemán: fórmula cerrada del modelo original
const al = C.schedule({ ...base, sys: 'al' });
const k = P / 30;
near(al.first, k + P * r + 7.5, 1e-9, 'alemán 1ª');
near(al.last, k + k * r + 7.5, 1e-9, 'alemán última');
near(al.total, P + r * k * 30 * 31 / 2 + 7.5 * 30, 1e-6, 'alemán total');

// Americano
const am = C.schedule({ ...base, sys: 'am' });
near(am.first, P * r + 7.5, 1e-9, 'americano 1ª');
near(am.last, P * (1 + r) + 7.5, 1e-9, 'americano última');

// CFT: sin comisión ni seguro ni IVA debe dar la TEA exacta
const pure = C.schedule({ ...base, com: 0, seg: 0, sys: 'fr' });
near(pure.cft, 8, 1e-6, 'CFT = TEA sin cargos');
const pureAl = C.schedule({ ...base, com: 0, seg: 0, sys: 'al' });
near(pureAl.cft, 8, 1e-6, 'CFT alemán = TEA sin cargos');
// Con cargos el CFT tiene que superar la TEA
console.log(fr.cft > 8 ? 'ok   CFT con cargos > TEA ' + fr.cft.toFixed(2) : 'FALLA CFT');

// Tasa cero
const z = C.schedule({ ...base, tea: 0, com: 0, seg: 0, sys: 'fr' });
near(z.first, 10000 / 30, 1e-9, 'tasa 0');

// Comisión al contado: capital adeudado = capital
const cc = C.schedule({ ...base, comFin: false, sys: 'fr' });
near(cc.P, 10000, 1e-9, 'comisión contado no se financia');
near(cc.upfront, 305, 1e-9, 'comisión contado monto');
