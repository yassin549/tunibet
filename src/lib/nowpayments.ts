/**
 * NOWPayments API Wrapper
 * Handles all interactions with NOWPayments API
 * 
 * Documentation: https://documenter.getpostman.com/view/7907941/S1a32n38
 */

import {
  NOWPaymentsEstimate,
  NOWPaymentsPaymentRequest,
  NOWPaymentsPaymentResponse,
  NOWPaymentsPaymentStatus,
  NOWPaymentsMinAmount,
  CryptoCurrency,
} from '@/types/payment';

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!;

if (!NOWPAYMENTS_API_KEY) {
  console.warn('⚠️  NOWPAYMENTS_API_KEY is not set in environment variables');
}

/**
 * Make authenticated request to NOWPayments API
 */
async function nowpaymentsRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${NOWPAYMENTS_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'x-api-key': NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `NOWPayments API error: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Get API status
 */
export async function getApiStatus(): Promise<{ message: string }> {
  return nowpaymentsRequest('/status');
}

/**
 * Get list of available currencies
 */
export async function getAvailableCurrencies(): Promise<{ currencies: string[] }> {
  return nowpaymentsRequest('/currencies');
}

/**
 * Get estimated exchange rate
 */
export async function getEstimate(
  amountFrom: number,
  currencyFrom: string,
  currencyTo: CryptoCurrency
): Promise<NOWPaymentsEstimate> {
  const params = new URLSearchParams({
    amount: amountFrom.toString(),
    currency_from: currencyFrom.toLowerCase(),
    currency_to: currencyTo.toLowerCase(),
  });

  return nowpaymentsRequest(`/estimate?${params}`);
}

/**
 * Get minimum payment amount for a currency pair
 */
export async function getMinAmount(
  currencyFrom: string,
  currencyTo: CryptoCurrency
): Promise<NOWPaymentsMinAmount> {
  const params = new URLSearchParams({
    currency_from: currencyFrom.toLowerCase(),
    currency_to: currencyTo.toLowerCase(),
  });

  return nowpaymentsRequest(`/min-amount?${params}`);
}

/**
 * Create a payment
 */
export async function createPayment(
  request: NOWPaymentsPaymentRequest
): Promise<NOWPaymentsPaymentResponse> {
  return nowpaymentsRequest('/payment', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Get payment status
 */
export async function getPaymentStatus(
  paymentId: string
): Promise<NOWPaymentsPaymentStatus> {
  return nowpaymentsRequest(`/payment/${paymentId}`);
}

/**
 * Get list of payments
 */
export async function getPayments(params?: {
  limit?: number;
  page?: number;
  sortBy?: string;
  orderBy?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ data: NOWPaymentsPaymentStatus[] }> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const query = searchParams.toString();
  return nowpaymentsRequest(`/payment${query ? `?${query}` : ''}`);
}

/**
 * Verify IPN callback authenticity
 */
export function verifyIPNSignature(
  payload: string,
  signature: string
): boolean {
  const crypto = require('crypto');
  const secret = process.env.NOWPAYMENTS_IPN_SECRET!;
  
  if (!secret) {
    console.error('NOWPAYMENTS_IPN_SECRET not set');
    return false;
  }

  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest('hex');

  return calculatedSignature === signature;
}

/**
 * Create a payment with automatic conversion
 * @param amountUSD - Amount in USD
 * @param cryptoCurrency - Cryptocurrency to receive
 * @param orderId - Unique order ID
 * @param callbackUrl - IPN callback URL
 */
export async function createCryptoPayment(
  amountUSD: number,
  cryptoCurrency: CryptoCurrency,
  orderId: string,
  callbackUrl?: string
): Promise<NOWPaymentsPaymentResponse> {
  // Get estimate first
  const estimate = await getEstimate(amountUSD, 'usd', cryptoCurrency);

  // Create payment
  const paymentRequest: NOWPaymentsPaymentRequest = {
    price_amount: amountUSD,
    price_currency: 'usd',
    pay_currency: cryptoCurrency.toLowerCase(),
    order_id: orderId,
    order_description: `Deposit ${amountUSD} USD to Tunibet`,
    ipn_callback_url: callbackUrl,
  };

  return createPayment(paymentRequest);
}

/**
 * Check if payment is completed
 */
export function isPaymentCompleted(status: string): boolean {
  return status === 'finished' || status === 'confirmed';
}

/**
 * Check if payment is pending
 */
export function isPaymentPending(status: string): boolean {
  return status === 'waiting' || status === 'confirming' || status === 'sending';
}

/**
 * Check if payment failed
 */
export function isPaymentFailed(status: string): boolean {
  return status === 'failed' || status === 'expired' || status === 'refunded';
}

/**
 * Map NOWPayments status to our transaction status
 */
export function mapPaymentStatus(
  nowpaymentsStatus: string
): 'pending' | 'processing' | 'completed' | 'failed' {
  if (isPaymentCompleted(nowpaymentsStatus)) return 'completed';
  if (isPaymentFailed(nowpaymentsStatus)) return 'failed';
  if (nowpaymentsStatus === 'confirming' || nowpaymentsStatus === 'sending') {
    return 'processing';
  }
  return 'pending';
}
