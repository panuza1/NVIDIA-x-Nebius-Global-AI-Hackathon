import {describe,it,expect} from 'vitest';
import {diffFacts} from '../lib/diff';
import {validateFacts} from '../lib/facts';
const old={deadline:{value:'2026-11-15',evidence:'Deadline: November 15, 2026'},eligibility:{value:'Students',evidence:'Open to Students'},required_documents:[]};
describe('validated fact comparison',()=>{
 it('ignores casing, whitespace, quotes and cosmetic page changes',()=>{const next={...old,eligibility:{value:'  students ',evidence:'Students can apply'}};expect(diffFacts(old,next)).toEqual([])});
 it('detects a deadline change',()=>{const next={...old,deadline:{value:'2026-11-05',evidence:'Deadline: November 5, 2026'}};expect(diffFacts(old,next)).toMatchObject([{field:'deadline',old:'2026-11-15',new:'2026-11-05',uncertain:false}])});
 it('marks a newly observed requirement for review',()=>{expect(diffFacts(old,{...old,required_documents:[{value:'Letter',evidence:'Letter required'}]})).toMatchObject([{field:'required_documents',new:'Letter',uncertain:true}])});
 it('marks missing and unnormalized dates as uncertain',()=>{expect(diffFacts(old,{...old,deadline:null})[0].uncertain).toBe(true);expect(diffFacts(old,{...old,deadline:{value:'next Friday',evidence:'next Friday'}})[0].uncertain).toBe(true)});
 it('rejects unsupported quotes and deduplicates supported documents',()=>{const result=validateFacts({...old,eligibility:{value:'Everyone',evidence:'invented'},required_documents:[{value:'LETTER',evidence:'letter required'},{value:'letter',evidence:'letter required'}]},'Deadline: November 15, 2026; letter required');expect(result.eligibility).toBeNull();expect(result.required_documents).toHaveLength(1)});
});
