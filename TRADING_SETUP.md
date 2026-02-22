# 🎯 Real Trading Setup Guide

## Prerequisites

1. **Polymarket Account** - Create at [polymarket.com](https://polymarket.com)
2. **Funded Wallet** - Deposit USDC to your Polymarket wallet (minimum $10)
3. **Private Key** - Export your wallet private key

## Setup Steps

### Step 1: Get Your Wallet Private Key

**⚠️ SECURITY WARNING**: Never share your private key. Store it securely!

#### Using MetaMask:
1. Open MetaMask
2. Click the three dots → Account Details
3. Click "Export Private Key"
4. Enter your password
5. Copy the private key (starts with `0x`)

#### Using Polymarket's Built-in Wallet:
1. Go to Polymarket Settings
2. Navigate to Wallet section
3. Export/Backup Private Key
4. Copy the private key

### Step 2: Configure Environment

1. Create `.env` file in the project root:
```bash
cp .env.example .env
```

2. Edit `.env` and add your private key:
```env
POLYMARKET_PRIVATE_KEY=0xyour_private_key_here
TRADING_MODE=real
```

3. Make sure `.env` is in `.gitignore` (it should be already)

### Step 3: Fund Your Wallet

1. Go to [polymarket.com](https://polymarket.com)
2. Click "Deposit"
3. Add at least $10 USDC to your wallet
4. Wait for confirmation (usually 1-2 minutes)

### Step 4: Restart the Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

You should see:
```
✓ Trading credentials loaded - REAL TRADING ENABLED
```

## How Trading Works

1. **Browse Markets**: Use `search_markets` or `trending_markets`
2. **View Details**: Click any market to see price charts
3. **Place Trade**: Click "Buy YES" or "Buy NO" buttons
4. **Confirm**: Review trade details in confirmation widget
5. **Execute**: Click "Confirm Trade" to submit to Polymarket

### Trade Execution Flow:
```
Widget Button
  ↓
Claude calls execute_trade tool
  ↓
Trade Confirmation Widget
  ↓
User confirms
  ↓
Order signed with private key
  ↓
Submitted to Polymarket CLOB
  ↓
Trade executed on-chain
  ↓
Success notification
```

## Demo Mode

If no private key is configured, the system runs in **demo mode**:
- All features work normally
- Trades are simulated (no real money)
- No blockchain transactions
- Perfect for testing and demos

## Security Best Practices

1. **Never commit `.env` file** - Use `.env.example` for templates only
2. **Use a dedicated trading wallet** - Don't use your main wallet
3. **Start with small amounts** - Test with $10-50 first
4. **Verify trades** - Always review before confirming
5. **Check balances** - Monitor your USDC balance on Polymarket

## Troubleshooting

### "No private key configured"
- Check `.env` file exists
- Verify `POLYMARKET_PRIVATE_KEY` is set correctly
- Restart the server

### "Insufficient balance"
- Ensure you have enough USDC in your Polymarket wallet
- Check at https://polymarket.com/portfolio

### "Order failed to execute"
- Check network connection
- Verify market is still active
- Ensure price hasn't moved significantly

## Cost Breakdown

For a $10 trade:
- **Trade amount**: $10
- **Gas fees**: ~$0.01-0.10 (on Polygon)
- **Platform fees**: ~$0.01-0.02
- **Total**: ~$10.10-10.20

## Support

- Polymarket Docs: https://docs.polymarket.com
- Discord: https://discord.gg/polymarket
- GitHub Issues: Report bugs in this repo
