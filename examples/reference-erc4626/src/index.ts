import { ponder } from "@/generated";

ponder.on("ERC4626:Transfer", async ({ event, context }) => {
  const { Account, TransferEvent } = context.db;

  // Create an Account for the sender, or update the balance if it already exists.
  await Account.upsert({
    id: event.args.from,
    create: {
      balance: BigInt(0),
      isOwner: false,
    },
    update: ({ current }) => ({
      balance: current.balance - event.args.amount,
    }),
  });

  // Create an Account for the recipient, or update the balance if it already exists.
  await Account.upsert({
    id: event.args.to,
    create: {
      balance: event.args.amount,
      isOwner: false,
    },
    update: ({ current }) => ({
      balance: current.balance + event.args.amount,
    }),
  });

  // Create a TransferEvent.
  await TransferEvent.create({
    id: event.log.id,
    data: {
      fromId: event.args.from,
      toId: event.args.to,
      amount: event.args.amount,
      timestamp: Number(event.block.timestamp),
    },
  });
});

ponder.on("ERC4626:Approval", async ({ event, context }) => {
  const { Allowance, ApprovalEvent } = context.db;

  const allowanceId = `${event.args.owner}-${event.args.spender}`;

  // Create or update the Allowance.
  await Allowance.upsert({
    id: allowanceId,
    create: {
      ownerId: event.args.owner,
      spenderId: event.args.spender,
      amount: event.args.amount,
    },
    update: {
      amount: event.args.amount,
    },
  });

  // Create an ApprovalEvent.
  await ApprovalEvent.create({
    id: event.log.id,
    data: {
      ownerId: event.args.owner,
      spenderId: event.args.spender,
      amount: event.args.amount,
      timestamp: Number(event.block.timestamp),
    },
  });
});

ponder.on("ERC4626:Deposit", async ({ event, context }) => {
  await context.db.DepositEvent.create({
    id: event.log.id,
    data: {
      sender: event.args.caller,
      receiver: event.args.owner,
      assets: event.args.assets,
      shares: event.args.shares,
    },
  });
});

ponder.on("ERC4626:Withdraw", async ({ event, context }) => {
  await context.db.WithdrawEvent.create({
    id: event.log.id,
    data: {
      sender: event.args.caller,
      owner: event.args.owner,
      receiver: event.args.receiver,
      assets: event.args.assets,
      shares: event.args.shares,
    },
  });
});
