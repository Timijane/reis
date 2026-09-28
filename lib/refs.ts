export function bookingReference(){const d=new Date();const date=d.toISOString().slice(0,10).replaceAll('-','');const rnd=Math.random().toString(36).slice(2,7).toUpperCase();return `REIS-${date}-${rnd}`;}
export function paymentCode(){return `R${Math.random().toString(36).slice(2,6).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;}
export function holdUntil(hours=24){return new Date(Date.now()+hours*60*60*1000).toISOString();}
