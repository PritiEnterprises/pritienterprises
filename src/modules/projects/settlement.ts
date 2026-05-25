export interface ProjectSettlement {
  contractAmount: number;
  totalReceived: number;
  balanceDue: number;
  advanceTotal: number;
  interimTotal: number;
  finalTotal: number;
  otherTotal: number;
  paymentCount: number;
}

export function calculateProjectSettlement(
  contractAmount: number,
  payments: { paymentType: string; amount: number }[]
): ProjectSettlement {
  let advanceTotal = 0;
  let interimTotal = 0;
  let finalTotal = 0;
  let otherTotal = 0;

  for (const p of payments) {
    switch (p.paymentType) {
      case "ADVANCE":
        advanceTotal += p.amount;
        break;
      case "INTERIM":
        interimTotal += p.amount;
        break;
      case "FINAL":
        finalTotal += p.amount;
        break;
      default:
        otherTotal += p.amount;
    }
  }

  const totalReceived =
    advanceTotal + interimTotal + finalTotal + otherTotal;
  const balanceDue = contractAmount - totalReceived;

  return {
    contractAmount,
    totalReceived,
    balanceDue,
    advanceTotal,
    interimTotal,
    finalTotal,
    otherTotal,
    paymentCount: payments.length,
  };
}
