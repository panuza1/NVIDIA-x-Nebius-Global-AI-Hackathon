import 'server-only';
import {tavily} from '@tavily/core';
export async function extract(url:string) {
 if(!process.env.TAVILY_API_KEY) throw new Error('Server configuration missing: TAVILY_API_KEY.');
 const result=await tavily({apiKey:process.env.TAVILY_API_KEY}).extract([url],{timeout:25});
 const text=result.results?.[0]?.rawContent;
 if(!text?.trim()) throw new Error('Tavily could not extract this page or returned empty content.');
 return text.slice(0,40000);
}
