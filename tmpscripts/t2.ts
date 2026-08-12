import { scanEkadashi } from "../src/lib/panchang/ekadashi";
import { REFERENCE_CITY } from "../src/lib/panchang/parana-snapshot";
const s=Date.now();
const r = scanEkadashi({year:2026,month:8,day:22},3,REFERENCE_CITY);
console.log(Date.now()-s+"ms", JSON.stringify(r.map(e=>[e.date,e.name,e.parana.date])));
