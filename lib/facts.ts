import { z } from 'zod';
const fact = z.object({value:z.string().trim().min(1).max(1000),evidence:z.string().trim().min(1).max(2000)});
export const factsSchema=z.object({deadline:fact.nullable(),eligibility:fact.nullable(),required_documents:z.array(fact).max(50)});
export type Fact=z.infer<typeof fact>;
export type Facts=z.infer<typeof factsSchema>;
export const norm=(s:string)=>s.trim().replace(/\s+/g,' ').toLowerCase();
export function validateFacts(input:unknown, content:string): Facts {
 const data=factsSchema.parse(input), text=norm(content);
 const supported=(f:Fact|null)=>f && text.includes(norm(f.evidence)) ? {value:f.value.trim().replace(/\s+/g,' '),evidence:f.evidence.trim().replace(/\s+/g,' ')} : null;
 const docs=data.required_documents.map(supported).filter((x):x is Fact=>x!==null);
 return {deadline:supported(data.deadline),eligibility:supported(data.eligibility),required_documents:[...new Map(docs.map(d=>[norm(d.value),d])).values()].sort((a,b)=>norm(a.value).localeCompare(norm(b.value)))};
}
export function isDate(s:string) { if(!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; const d=new Date(s+'T00:00:00Z'); return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0,10)===s; }
