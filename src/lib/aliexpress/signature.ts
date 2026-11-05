import crypto from 'crypto';

/**
 * Genera la firma crittografica HMAC-SHA256 per le chiamate AliExpress Open Platform.
 * 
 * Regole ufficiali AliExpress IOP / TOP:
 * 1. Ordina alfabeticamente tutte le chiavi dei parametri (escluso 'sign').
 * 2. Concatena il percorso dell'API (se specificato) e le coppie chiave-valore: "key1value1key2value2...".
 * 3. Calcola l'hash HMAC-SHA256 usando l'App Secret come chiave crittografica.
 * 4. Restituisce la stringa esadecimale in formato MAIUSCOLO.
 */
export function generateAliExpressSignature({
  apiPath = '',
  params,
  appSecret,
}: {
  apiPath?: string;
  params: Record<string, string | number | boolean | undefined | null>;
  appSecret: string;
}): string {
  // 1. Filtra parametri nulli, indefiniti o la chiave 'sign' stessa
  const filteredKeys = Object.keys(params).filter(
    (key) => key !== 'sign' && params[key] !== undefined && params[key] !== null
  );

  // 2. Ordinamento alfabetico ASCII delle chiavi
  filteredKeys.sort();

  // 3. Concatenazione: apiPath + key1value1key2value2...
  let signatureBaseString = apiPath;
  for (const key of filteredKeys) {
    signatureBaseString += `${key}${String(params[key])}`;
  }

  // 4. Calcolo HMAC-SHA256
  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(signatureBaseString, 'utf8');

  // 5. Restituzione in esadecimale MAIUSCOLO
  return hmac.digest('hex').toUpperCase();
}

