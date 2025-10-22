import type { Route } from './+types/withdraw';
import FinanceWithdraw from '~/pages/finance/FinanceWithdraw';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Rút tiền / Đối soát - SaveFood' },
    { name: 'description', content: 'Yêu cầu rút tiền và đối soát' },
  ];
}

export default function FinanceWithdrawRoute() {
  return <FinanceWithdraw />;
}
