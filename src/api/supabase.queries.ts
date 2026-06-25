import { supabase } from '../lib/supabase';
import type {
  MoatRecord,
  TokenRecord,
  TraitorSummaryRow,
  EarlyExitRow,
  SyncStateRow,
} from '../types/pillory.types';

export async function fetchMoats(): Promise<MoatRecord[]> {
  const { data, error } = await supabase
    .from('moats')
    .select('id, contract_address, name, image_url');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchTokens(): Promise<TokenRecord[]> {
  const { data, error } = await supabase
    .from('tokens')
    .select('id, contract_address, symbol, decimals');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchTraitorSummaries(): Promise<TraitorSummaryRow[]> {
  const { data, error } = await supabase
    .from('traitor_summary')
    .select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchEarlyExitsByContract(contractAddress: string): Promise<EarlyExitRow[]> {
  const { data, error } = await supabase
    .from('early_exits')
    .select('*')
    .eq('contract_address', contractAddress.toLowerCase())
    .order('exited_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchEarlyExitsByWallet(wallet: string): Promise<EarlyExitRow[]> {
  const { data, error } = await supabase
    .from('early_exits')
    .select('*')
    .eq('wallet', wallet.toLowerCase())
    .order('exited_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchTraitorSummaryByWallet(wallet: string): Promise<TraitorSummaryRow[]> {
  const { data, error } = await supabase
    .from('traitor_summary')
    .select('*')
    .eq('wallet', wallet.toLowerCase());
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchSyncState(): Promise<SyncStateRow | null> {
  const { data, error } = await supabase
    .from('sync_state')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) return null;
  return data;
}
