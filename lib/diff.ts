import { Facts, Fact, norm, isDate } from './facts';
export type Change={field:string;old:string|null;new:string|null;oldEvidence:string|null;newEvidence:string|null;uncertain:boolean};
export function diffFacts(old:Facts, next:Facts):Change[] {
 const changes:Change[]=[];
 for (const field of ['deadline','eligibility'] as const) {
  const a=old[field], b=next[field];
  if (!a && !b) continue;
  if (a && b && norm(a.value)===norm(b.value)) continue;
  changes.push({field,old:a?.value??null,new:b?.value??null,oldEvidence:a?.evidence??null,newEvidence:b?.evidence??null,uncertain:!a||!b||(field==='deadline'&&(!isDate(a.value)||!isDate(b.value)))});
 }
 // Empty or omitted lists cannot prove absence: additions/removals are observations needing review.
 const oldMap=new Map(old.required_documents.map((f:Fact)=>[norm(f.value),f]));
 const newMap=new Map(next.required_documents.map((f:Fact)=>[norm(f.value),f]));
 for (const [key,f] of oldMap) if(!newMap.has(key)) changes.push({field:'required_documents',old:f.value,new:null,oldEvidence:f.evidence,newEvidence:null,uncertain:true});
 for (const [key,f] of newMap) if(!oldMap.has(key)) changes.push({field:'required_documents',old:null,new:f.value,oldEvidence:null,newEvidence:f.evidence,uncertain:true});
 return changes;
}
