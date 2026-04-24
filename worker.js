/**
 * ol1y.art — Cloudflare Worker API Proxy
 *
 * Handles all blockchain API calls server-side so keys are never
 * exposed in the browser. Supports pagination, sorting by received
 * date, and artist name enrichment.
 *
 * Environment variables to set in Cloudflare Worker dashboard:
 *   ALCHEMY_KEY   — your Alchemy API key
 *   HELIUS_KEY    — your Helius API key
 *   ORDISCAN_KEY  — your Ordiscan API key
 *   ALLOWED_ORIGIN — your site URL e.g. https://ol1y.art
 */

const CORS = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
});

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || '*';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS(allowed) });
    }

    const url = new URL(request.url);
    const chain = url.searchParams.get('chain');
    const wallet = url.searchParams.get('wallet');
    const pageKey = url.searchParams.get('pageKey') || null;
    const page = parseInt(url.searchParams.get('page') || '1');

    if (!chain || !wallet) {
      return json({ error: 'Missing chain or wallet param' }, 400, CORS(allowed));
    }

    try {
      let result;
      switch (chain) {
        case 'ethereum': result = await fetchEthereum(wallet, pageKey, env); break;
        case 'tezos':    result = await fetchTezos(wallet, page, env);       break;
        case 'ordinals': result = await fetchOrdinals(wallet, page, env);    break;
        case 'solana':   result = await fetchSolana(wallet, page, env);      break;
        default: return json({ error: 'Unknown chain' }, 400, CORS(allowed));
      }
      return json(result, 200, CORS(allowed));
    } catch (e) {
      return json({ error: e.message }, 500, CORS(allowed));
    }
  }
};

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}

// ── ETHEREUM ─────────────────────────────────────────────────────
async function fetchEthereum(wallet, pageKey, env) {
  const key = env.ALCHEMY_KEY;
  const params = new URLSearchParams({
    owner: wallet,
    withMetadata: 'true',
    pageSize: '48',
    orderBy: 'transferTime',
  });
  if (pageKey) params.set('pageKey', pageKey);

  const r = await fetch(
    `https://eth-mainnet.g.alchemy.com/nft/v3/${key}/getNFTsForOwner?${params}`
  );
  if (!r.ok) throw new Error(`Alchemy HTTP ${r.status}`);
  const data = await r.json();

  const nfts = await Promise.all((data.ownedNfts || []).map(async nft => {
    const contract = nft.contract?.address || '';
    const tokenId  = nft.tokenId || '';
    const acquired = nft.acquiredAt?.blockTimestamp || null;

    // Artist enrichment — try contract creator via Alchemy
    let artist = nft.contract?.name || '';
    if (!artist || artist === '') {
      artist = await enrichEthArtist(contract, key);
    }

    return {
      chain: 'ethereum',
      wallet,
      title: nft.name || nft.contract?.name || 'Untitled',
      artist,
      image: nft.image?.cachedUrl || nft.image?.thumbnailUrl || nft.image?.originalUrl || '',
      contract,
      tokenId,
      acquired,
      link: `https://opensea.io/assets/ethereum/${contract}/${tokenId}`,
    };
  }));

  return {
    nfts,
    nextPageKey: data.pageKey || null,
    total: data.totalCount || null,
  };
}

async function enrichEthArtist(contract, key) {
  try {
    const r = await fetch(
      `https://eth-mainnet.g.alchemy.com/nft/v3/${key}/getContractMetadata?contractAddress=${contract}`
    );
    if (!r.ok) return '';
    const d = await r.json();
    return d.openSeaMetadata?.collectionName
      || d.name
      || '';
  } catch { return ''; }
}

// ── TEZOS ─────────────────────────────────────────────────────────
async function fetchTezos(wallet, page, env) {
  const limit = 48;
  const offset = (page - 1) * limit;

  const r = await fetch(
    `https://api.tzkt.io/v1/tokens/balances?account=${wallet}&balance.gt=0&limit=${limit}&offset=${offset}&token.standard=fa2&sort.desc=lastTime`
  );
  if (!r.ok) throw new Error(`TzKT HTTP ${r.status}`);
  const data = await r.json();

  // Get total count
  const countR = await fetch(
    `https://api.tzkt.io/v1/tokens/balances/count?account=${wallet}&balance.gt=0&token.standard=fa2`
  );
  const total = countR.ok ? parseInt(await countR.text()) : null;

  const nfts = data.map(item => {
    const meta     = item.token?.metadata || {};
    const imgRaw   = meta.thumbnailUri || meta.displayUri || meta.artifactUri || '';
    const image    = imgRaw.startsWith('ipfs://')
      ? `https://ipfs.io/ipfs/${imgRaw.slice(7)}`
      : imgRaw;
    const contract = item.token?.contract?.address || '';
    const tokenId  = item.token?.tokenId || '';
    const artist   = (meta.creators && meta.creators[0])
      || item.token?.contract?.alias
      || meta.artistName
      || '';
    const acquired = item.lastTime || null;

    return {
      chain: 'tezos',
      wallet,
      title: meta.name || 'Untitled',
      artist,
      image,
      contract,
      tokenId,
      acquired,
      link: `https://objkt.com/tokens/${contract}/${tokenId}`,
    };
  });

  return { nfts, nextPage: data.length === limit ? page + 1 : null, total };
}

// ── ORDINALS ──────────────────────────────────────────────────────
async function fetchOrdinals(wallet, page, env) {
  const key = env.ORDISCAN_KEY;
  const limit = 48;
  const offset = (page - 1) * limit;

  const r = await fetch(
    `https://api.ordiscan.com/v1/address/${wallet}/inscriptions?limit=${limit}&offset=${offset}`,
    { headers: { 'Authorization': `Bearer ${key}` } }
  );
  if (!r.ok) throw new Error(`Ordiscan HTTP ${r.status}`);
  const data = await r.json();
  const items = data.data || [];

  const nfts = items.map(ins => {
    const isImg = ins.content_type?.startsWith('image/');
    const acquired = ins.timestamp ? new Date(ins.timestamp * 1000).toISOString() : null;
    return {
      chain: 'ordinals',
      wallet,
      title: ins.meta?.name || `Inscription #${ins.inscription_number}`,
      artist: ins.meta?.collection_name || '',
      image: isImg ? `https://ord.io/${ins.inscription_id}` : '',
      contract: ins.inscription_id,
      tokenId: String(ins.inscription_number),
      acquired,
      link: `https://gamma.io/inscription/${ins.inscription_id}`,
    };
  });

  return {
    nfts,
    nextPage: items.length === limit ? page + 1 : null,
    total: data.total || null,
  };
}

// ── SOLANA ────────────────────────────────────────────────────────
async function fetchSolana(wallet, page, env) {
  const key = env.HELIUS_KEY;
  // Helius DAS getAssetsByOwner supports pagination
  const r = await fetch(
    `https://mainnet.helius-rpc.com/?api-key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: wallet,
          page,
          limit: 48,
          sortBy: { sortBy: 'created', sortDirection: 'desc' },
          displayOptions: { showFungible: false, showNativeBalance: false },
        }
      })
    }
  );
  if (!r.ok) throw new Error(`Helius HTTP ${r.status}`);
  const data = await r.json();
  const items = data.result?.items || [];

  const nfts = items
    .filter(a => a.interface !== 'FungibleToken' && a.interface !== 'FungibleAsset')
    .map(asset => {
      const meta  = asset.content?.metadata || {};
      const image = asset.content?.links?.image
        || asset.content?.files?.[0]?.cdn_uri
        || asset.content?.files?.[0]?.uri
        || '';
      const artist = asset.creators?.[0]?.address
        ? asset.creators[0].address.slice(0, 8) + '…'
        : meta.symbol || '';
      const acquired = asset.id ? null : null; // Helius doesn't expose received date easily

      return {
        chain: 'solana',
        wallet,
        title: meta.name || 'Untitled',
        artist,
        image,
        contract: asset.id,
        tokenId: asset.id,
        acquired,
        link: `https://magiceden.io/item-details/${asset.id}`,
      };
    });

  const total = data.result?.total || null;
  const hasMore = items.length === 48;

  return { nfts, nextPage: hasMore ? page + 1 : null, total };
}
