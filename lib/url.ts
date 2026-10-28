import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
function isPublicIp(ip:string) {
 if (isIP(ip)===4) { const n=ip.split('.').map(Number); return !(n[0]===0||n[0]===10||n[0]===127||n[0]>=224||n[0]===169&&n[1]===254||n[0]===172&&n[1]>=16&&n[1]<=31||n[0]===192&&n[1]===168||n[0]===100&&n[1]>=64&&n[1]<=127||n[0]===198&&(n[1]===18||n[1]===19)); }
 // Reject IPv6 literals and DNS AAAA records: avoids mapped and special-use address ambiguity.
 return false;
}
export async function publicUrl(input:string) {
 let u:URL; try { u=new URL(input); } catch { throw new Error('Enter a valid public HTTPS URL.'); }
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.hostname==='localhost'||u.hostname.endsWith('.localhost')||u.hostname.endsWith('.local')) throw new Error('Enter a public HTTPS URL without credentials or a custom port.');
 if(isIP(u.hostname)) {if(!isPublicIp(u.hostname)) throw new Error('Private network addresses are not allowed.');}
 else {let addresses; try {addresses=await lookup(u.hostname,{all:true,family:4});}catch{throw new Error('The hostname could not be resolved.');} if(!addresses.length||addresses.some(a=>!isPublicIp(a.address))) throw new Error('Private network addresses are not allowed.');}
 u.hash=''; return u.toString();
}
