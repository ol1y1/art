# ol1y.art — Collection Gallery

A self-hosted, multi-chain NFT gallery that auto-fetches your collection from Ethereum, Tezos, Bitcoin Ordinals, and Solana.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The gallery — don't edit this unless changing the design |
| `config.js` | **Your admin file** — edit this to manage your collection |

---

## Setup

### 1. Get a free Alchemy API key (Ethereum only)
1. Go to [alchemy.com](https://alchemy.com) → Sign up free
2. Create a new app → Network: **Ethereum Mainnet**
3. Copy the API key
4. Open `config.js` and paste it into `alchemyKey: "YOUR_KEY_HERE"`

### 2. Deploy to Cloudflare Pages
1. Push this repo to GitHub
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com) → Create project → Connect to Git
3. Select this repo, leave build settings blank, deploy
4. Add custom domain `ol1y.art` under Settings → Custom Domains

---

## Managing Your Collection

All management is done by editing `config.js` on GitHub. Changes deploy in ~30 seconds.

### Hide an entire wallet
```js
hiddenWallets: ["0x78086Ad810f8F99A0B6c92a9A6c8857d3c665622"],
```

### Hide individual pieces
Find the contract address and token ID from OpenSea/OBJKT/etc., then:
```js
hidden: [
  "0xabcdef1234...:42",        // Ethereum: contractAddress:tokenId
  "KT1AbCdEf...:7",            // Tezos: contractAddress:tokenId
  "abc123...inscriptionid",    // Ordinals: inscription ID
  "SoLaNaMiNtAdDrEsS...",      // Solana: mint address
],
```

### Pin pieces to the top / hero
```js
pinned: [
  "0xabcdef1234...:42",
],
```
Pinned pieces rotate in the hero banner and appear first in the grid.

### Add a new wallet
```js
wallets: {
  ethereum: [
    "0x78086Ad810f8F99A0B6c92a9A6c8857d3c665622",
    "0x218A211431d5592316717BB9Ac07d36f18d3c8Ef",
    "0xYOUR_NEW_WALLET_HERE",   // ← add it here
  ],
  // ...
},
```

---

## Finding Contract Addresses & Token IDs

| Chain | Where to find |
|-------|--------------|
| Ethereum | OpenSea → item page → Details tab |
| Tezos | OBJKT → item page → scroll to token info |
| Ordinals | Gamma.io → inscription page → ID in URL |
| Solana | Magic Eden → item page → mint address |

---

## Chains & APIs Used

| Chain | API | Cost | Key needed? |
|-------|-----|------|-------------|
| Ethereum | Alchemy NFT API | Free (300M units/mo) | ✅ Yes |
| Tezos | TzKT API | Free, unlimited | ❌ No |
| Ordinals | Hiro API | Free | ❌ No |
| Solana | Helius DAS API | Free (demo key) | ❌ No |
