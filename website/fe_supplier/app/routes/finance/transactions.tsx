import type { Route } from './+types/transactions';
import FinanceTransactions from '~/pages/finance/FinanceTransactions';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Giao dịch thanh toán - SaveFood' },
    { name: 'description', content: 'Lịch sử giao dịch thanh toán' },
  ];
}

export default function FinanceTransactionsRoute() {
  return <FinanceTransactions />;
}
