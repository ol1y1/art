// ═══════════════════════════════════════════════════════════════
//  ol1y.art — Collection Config
//  Edit this file on GitHub to manage your gallery.
//  Changes deploy automatically to ol1y.art within ~30 seconds.
//
//  API keys are stored securely in your Cloudflare Worker —
//  they never appear in this file or your browser source.
// ═══════════════════════════════════════════════════════════════

const CONFIG = {

  // ── WORKER URL ───────────────────────────────────────────────
  // After deploying your Worker, paste its URL here.
  // It will look like: https://ol1y-art-api.YOUR-SUBDOMAIN.workers.dev
  workerUrl: "https://ol1y-art-api.ol1yartist1.workers.dev",

  // ── WALLETS ──────────────────────────────────────────────────
  wallets: {
    ethereum: [
      "0x78086Ad810f8F99A0B6c92a9A6c8857d3c665622",
      "0x218A211431d5592316717BB9Ac07d36f18d3c8Ef",
    ],
    tezos: [
      "tz2SpRWaddjFBgZQ35TVpYdz5XUnZAgTtyzy",
    ],
    ordinals: [
      "35yHgzcfsVTFTRy4iAXqU2oXSPyNxB8Pjp",
    ],
    solana: [
      "2P7bwj6j2V3MSAxRiVhCm8rgPsNwq6vzQyJuUjmp71Ki",
    ],
  },

  // ── HIDE ENTIRE WALLETS ──────────────────────────────────────
  // Paste a wallet address to hide everything in it.
  // Example: hiddenWallets: ["0x78086Ad810f8F99A0B6c92a9A6c8857d3c665622"],
  hiddenWallets: [],

  // ── HIDE INDIVIDUAL PIECES ───────────────────────────────────
  // Format: "contractAddress:tokenId"  (Ethereum / Tezos)
  //         "inscriptionId"            (Ordinals)
  //         "mintAddress"              (Solana)
  // Example: hidden: ["0xabcd...:42", "KT1abc...:7"],
  hidden: [],

  // ── PIN PIECES ───────────────────────────────────────────────
  // These appear first in the grid and rotate in the hero.
  // Same format as hidden above.
  // Example: pinned: ["0xabcd...:42"],
  pinned: [],

  // ── SITE SETTINGS ────────────────────────────────────────────
  siteTitle: "ol1y.art",
  showChainFilter: true,
  pageSize: 48,
};
