// Motor de cálculo del simulador. Sin dependencias; se usa en la página y en los tests (node test.js).
(function (root) {
  // Tasa mensual equivalente a una TEA (efectiva anual, en %)
  function monthlyRate(tea) {
    return Math.pow(1 + tea / 100, 1 / 12) - 1;
  }

  // Cronograma completo. o = {cap, tea, n, sys:'fr'|'al'|'am', com, iva, seg, ivaInt, comFin}
  function schedule(o) {
    const n = Math.max(1, Math.round(o.n));
    const r = monthlyRate(o.tea);
    const ivaR = o.ivaInt ? o.iva / 100 : 0;
    const comAmt = o.cap * (o.com / 100) * (1 + o.iva / 100); // comisión + IVA
    const P = o.comFin ? o.cap + comAmt : o.cap;               // capital adeudado
    const upfront = o.comFin ? 0 : comAmt;                     // lo que se paga al firmar
    const rows = [];
    let bal = P;
    const pmt = r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n));
    for (let k = 1; k <= n; k++) {
      const int = bal * r;
      let amort;
      if (o.sys === 'al') amort = P / n;
      else if (o.sys === 'am') amort = k === n ? bal : 0;
      else amort = k === n ? bal : pmt - int; // cierra el último centavo en el francés
      const ivaI = int * ivaR;
      const cuota = amort + int + ivaI + o.seg;
      rows.push({ k, bal, int, ivaI, amort, seg: o.seg, cuota, end: bal - amort });
      bal -= amort;
    }
    const total = rows.reduce((s, x) => s + x.cuota, 0);
    const interest = rows.reduce((s, x) => s + x.int + x.ivaI, 0);
    const net = o.cap - upfront; // lo que efectivamente recibís
    return {
      rows, P, comAmt, upfront, total, interest,
      first: rows[0].cuota, last: rows[n - 1].cuota,
      costo: total + upfront - o.cap,
      cft: cftAnnual(net, rows.map(x => x.cuota)),
    };
  }

  // Costo financiero total: TEA que iguala lo recibido con todo lo pagado (TIR mensual anualizada)
  function cftAnnual(net, flows) {
    if (net <= 0) return NaN;
    const pv = i => flows.reduce((s, c, k) => s + c / Math.pow(1 + i, k + 1), 0);
    let lo = -0.99, hi = 1;
    if (pv(hi) > net) return NaN;
    for (let it = 0; it < 200; it++) {
      const mid = (lo + hi) / 2;
      if (pv(mid) > net) lo = mid; else hi = mid;
    }
    return (Math.pow(1 + (lo + hi) / 2, 12) - 1) * 100;
  }

  const api = { monthlyRate, schedule, cftAnnual };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Calc = api;
})(this);
