export type Provider = 'gateway' | 'typesafe';
export const PROVIDERS = {
 gateway: {name:'Vercel AI Gateway',endpoint:'https://ai-gateway.vercel.sh/v1/evaluate',model:'typesafe-ai/jev'},
 typesafe: {name:'TypeSafe · Jev direct',endpoint:'https://api.typesafe.ai/v1/systemone',model:'jev-latest'}
} as const;
export function detectProvider(key:string):Provider|null {
 const value=key.trim();
 if(value.startsWith('vck_'))return 'gateway';
 if(value.startsWith('ts_'))return 'typesafe';
 return null;
}
export function resolveProvider(key:string,override?:Provider):Provider {
 const detected=detectProvider(key);
 if(detected)return detected;
 if(override==='gateway'||override==='typesafe')return override;
 throw new Error('Key format not recognized. Choose the provider below before connecting.');
}
