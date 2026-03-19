export interface SimulatedCardPayload {
  card_number: string;
  card_expiration_date: string;
  card_cvc: string;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateCardNumber(): string {
  const digits = Array.from({ length: 16 }, (_, index) => {
    if (index === 0) {
      return '4';
    }

    return getRandomInt(0, 9).toString();
  });

  return digits.join('');
}

export function generateFutureExpirationDate(): string {
  const now = new Date();
  const monthsAhead = getRandomInt(1, 60);
  const expirationDate = new Date(
    now.getFullYear(),
    now.getMonth() + monthsAhead,
    1,
  );

  const month = (expirationDate.getMonth() + 1).toString().padStart(2, '0');
  const year = expirationDate.getFullYear().toString().slice(-2);

  return `${month}/${year}`;
}

export function generateCardCVC(): string {
  return getRandomInt(0, 999).toString().padStart(3, '0');
}
