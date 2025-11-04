/**
 * Payment and Transaction Types
 * For NOWPayments integration
 */

// Transaction types
export type TransactionType = 'deposit' | 'withdrawal';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Supported cryptocurrencies
export type CryptoCurrency = 
  | 'btc'     // Bitcoin
  | 'eth'     // Ethereum
  | 'usdt'    // Tether (TRC20)
  | 'usdterc20' // Tether (ERC20)
  | 'ltc'     // Litecoin
  | 'trx'     // Tron
  | 'bnb';    // Binance Coin

// Fiat currencies
export type FiatCurrency = 'usd' | 'eur' | 'tnd';

// Network types
export type Network = 'btc' | 'eth' | 'trc20' | 'erc20' | 'bep20';

// Transaction from database
export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: FiatCurrency;
  crypto_currency?: CryptoCurrency;
  crypto_amount?: number;
  crypto_address?: string;
  payment_id?: string;
  payment_url?: string;
  txn_hash?: string;
  network?: Network;
  fee: number;
  note?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// NOWPayments API Types

export interface NOWPaymentsEstimate {
  currency_from: string; // e.g., 'usd'
  amount_from: number;
  currency_to: string; // e.g., 'btc'
  estimated_amount: number;
}

export interface NOWPaymentsPaymentRequest {
  price_amount: number;
  price_currency: string; // 'usd'
  pay_currency: string; // 'btc'
  ipn_callback_url?: string;
  order_id?: string;
  order_description?: string;
}

export interface NOWPaymentsPaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  created_at: string;
  updated_at: string;
  purchase_id: string;
  amount_received: number;
  payin_extra_id: string | null;
  smart_contract: string | null;
  network: string;
  network_precision: number;
  time_limit: string | null;
  burning_percent: number | null;
  expiration_estimate_date: string;
  is_fixed_rate: boolean;
  is_fee_paid_by_user: boolean;
  valid_until: string;
  type: string;
}

export interface NOWPaymentsPaymentStatus {
  payment_id: string;
  payment_status: 'waiting' | 'confirming' | 'confirmed' | 'sending' | 'partially_paid' | 'finished' | 'failed' | 'refunded' | 'expired';
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
  outcome_amount: number;
  outcome_currency: string;
}

export interface NOWPaymentsIPN {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  outcome_amount: number;
  outcome_currency: string;
}

export interface NOWPaymentsMinAmount {
  currency_from: string;
  currency_to: string;
  min_amount: number;
}

// API Request/Response types

export interface CreateDepositRequest {
  amount: number; // Amount in USD/EUR/TND
  currency: FiatCurrency;
  cryptoCurrency: CryptoCurrency;
}

export interface CreateDepositResponse {
  transaction: Transaction;
  paymentUrl: string;
  paymentAddress: string;
  payAmount: number;
  payCurrency: string;
}

export interface CreateWithdrawalRequest {
  amount: number;
  cryptoCurrency: CryptoCurrency;
  cryptoAddress: string;
  network?: Network;
}

export interface CreateWithdrawalResponse {
  transaction: Transaction;
  message: string;
}

export interface TransactionHistoryRequest {
  type?: TransactionType;
  status?: TransactionStatus;
  limit?: number;
  offset?: number;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  total: number;
  hasMore: boolean;
}

// Crypto currency info
export interface CryptoInfo {
  code: CryptoCurrency;
  name: string;
  symbol: string;
  network: Network;
  minDeposit: number; // in USD
  withdrawalFee: number; // in crypto
  confirmations: number;
  icon: string;
}

// Available cryptocurrencies
export const SUPPORTED_CRYPTOS: CryptoInfo[] = [
  {
    code: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    network: 'btc',
    minDeposit: 10,
    withdrawalFee: 0.0005,
    confirmations: 2,
    icon: '₿',
  },
  {
    code: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    network: 'eth',
    minDeposit: 10,
    withdrawalFee: 0.005,
    confirmations: 12,
    icon: 'Ξ',
  },
  {
    code: 'usdt',
    name: 'Tether (TRC20)',
    symbol: 'USDT',
    network: 'trc20',
    minDeposit: 5,
    withdrawalFee: 1,
    confirmations: 1,
    icon: '₮',
  },
  {
    code: 'usdterc20',
    name: 'Tether (ERC20)',
    symbol: 'USDT',
    network: 'erc20',
    minDeposit: 10,
    withdrawalFee: 5,
    confirmations: 12,
    icon: '₮',
  },
  {
    code: 'ltc',
    name: 'Litecoin',
    symbol: 'LTC',
    network: 'btc',
    minDeposit: 5,
    withdrawalFee: 0.001,
    confirmations: 6,
    icon: 'Ł',
  },
  {
    code: 'trx',
    name: 'Tron',
    symbol: 'TRX',
    network: 'trc20',
    minDeposit: 5,
    withdrawalFee: 1,
    confirmations: 1,
    icon: 'T',
  },
];
