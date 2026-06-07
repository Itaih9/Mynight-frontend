const SUMIT_TOKENIZE_URL = 'https://api.sumit.co.il/creditguy/vault/tokenizesingleusejson/';

export interface TokenizeCardInput {
  companyId: string;
  publicKey: string;
  cardNumber: string;
  expirationMonth: number;
  expirationYear: number;
  cvv?: string;
  citizenId?: string;
}

export interface TokenizeCardResult {
  token: string;
}

export async function tokenizeCard(input: TokenizeCardInput): Promise<TokenizeCardResult> {
  const body = {
    Credentials: {
      CompanyID: Number(input.companyId),
      APIPublicKey: input.publicKey,
    },
    CardNumber: input.cardNumber.replace(/\D/g, ''),
    ExpirationMonth: input.expirationMonth,
    ExpirationYear: input.expirationYear,
    CVV: input.cvv,
    CitizenID: input.citizenId,
  };

  const res = await fetch(SUMIT_TOKENIZE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`שגיאת תקשורת מול סליקה (${res.status})`);
  }

  const data = await res.json();
  const ok = data?.Status === 'Success' || data?.Status === 0;
  const token = data?.Data?.SingleUseToken;

  if (!ok || !token) {
    const msg = data?.UserErrorMessage || data?.TechnicalErrorDetails || 'אימות פרטי האשראי נכשל';
    throw new Error(msg);
  }

  return { token };
}
