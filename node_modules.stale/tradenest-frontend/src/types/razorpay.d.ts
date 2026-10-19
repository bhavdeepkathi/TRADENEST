
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  order_id?: string;
  method?: {
    upi?: boolean;
  };
  config?: {
    display?: {
      blocks?: Record<string, {
        name: string;
        instruments: Array<{ method: 'upi' }>;
      }>;
      sequence?: string[];
      preferences?: {
        show_default_blocks?: boolean;
      };
    };
  };
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  notes?: Record<string, string>;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: 'payment.failed', handler: (response: { error?: { description?: string } }) => void): void;
}

interface Window {
  Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
}