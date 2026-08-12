import { ekadashiCalendar } from "../src/lib/panchang/ekadashi";
import { REFERENCE_CITY } from "../src/lib/panchang/parana-snapshot";
const s=Date.now();
const a=ekadashiCalendar(2026,REFERENCE_CITY), b=ekadashiCalendar(2027,REFERENCE_CITY);
console.log(a.length,b.length,Date.now()-s+"ms");
console.log(JSON.stringify(a.slice(0,3).map(e=>[e.date,e.name])));
