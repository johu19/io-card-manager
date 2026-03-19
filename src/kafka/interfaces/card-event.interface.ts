export interface CardEvent {
  id: number;
  source: string;
  data: {
    forceError?: boolean;
    productId: number;
    error?: { attempts: number; message: string };
  };
  type: string;
}
