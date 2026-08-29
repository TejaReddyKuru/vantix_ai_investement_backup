import { SUGGESTED_ASSETS, validCoinId, type DirectoryAsset } from "./asset-directory";
export function analysisSelection(params: URLSearchParams): DirectoryAsset {
  const id = params.get("coin"), symbol = (params.get("symbol") ?? "").toUpperCase().slice(0, 30);
  if (id && validCoinId(id)) return SUGGESTED_ASSETS.find(asset => asset.id === id) ?? { id, symbol: symbol || id.toUpperCase().slice(0, 30), name: (params.get("name") || id).slice(0, 120), image: null, rank: null };
  if (!id && !symbol) return SUGGESTED_ASSETS[0];
  const known = !id && SUGGESTED_ASSETS.find(asset => asset.symbol === symbol || `${asset.symbol}USDT` === symbol);
  return known || { id: "unconnected-selection", symbol: symbol || "UNKNOWN", name: "Unrecognized selection — choose a coin", image: null, rank: null };
}
