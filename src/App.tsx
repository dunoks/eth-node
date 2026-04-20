/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Box, 
  Cpu, 
  Database, 
  Globe, 
  Layers, 
  Lock, 
  Menu, 
  MessageSquare, 
  Orbit, 
  RefreshCcw, 
  Search, 
  Server, 
  ShieldCheck, 
  Zap,
  ChevronRight,
  Clock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ethers } from 'ethers';

// RPC Provider
const RPC_URL = 'https://cloudflare-eth.com';

interface BlockData {
  number: number;
  hash: string;
  timestamp: number;
  transactionsCount: number;
  miner: string;
}

interface NodeMetrics {
  peers: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: string;
  version: string;
}

export default function App() {
  const [latestBlock, setLatestBlock] = useState<BlockData | null>(null);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [gasPrice, setGasPrice] = useState<string>('0');
  const [ethPrice, setEthPrice] = useState<string>('0'); // Simulated or from API
  const [isSyncing, setIsSyncing] = useState(false);
  const [metrics, setMetrics] = useState<NodeMetrics>({
    peers: 48,
    cpuUsage: 12.4,
    memoryUsage: 4.2,
    uptime: '14d 06h 22m',
    version: 'Geth/v1.13.11-stable'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const provider = useMemo(() => new ethers.JsonRpcProvider(RPC_URL), []);

  const fetchData = async () => {
    try {
      const blockNumber = await provider.getBlockNumber();
      const block = await provider.getBlock(blockNumber);
      
      if (block) {
        const newBlockData: BlockData = {
          number: block.number,
          hash: block.hash || '',
          timestamp: block.timestamp,
          transactionsCount: block.transactions.length,
          miner: block.miner
        };

        setLatestBlock(newBlockData);
        setBlocks(prev => {
          // Only add if not already present
          if (prev.length > 0 && prev[0].number === newBlockData.number) return prev;
          return [newBlockData, ...prev].slice(0, 5);
        });
      }

      const feeData = await provider.getFeeData();
      if (feeData.gasPrice) {
        setGasPrice(ethers.formatUnits(feeData.gasPrice, 'gwei'));
      }
    } catch (err) {
      console.error('Failed to fetch node data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 12000); // Poll every 12 seconds
    return () => clearInterval(interval);
  }, [provider]);

  // Simulate evolving metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpuUsage: Math.max(5, Math.min(45, prev.cpuUsage + (Math.random() - 0.5) * 5)),
        memoryUsage: Math.max(3.8, Math.min(5.2, prev.memoryUsage + (Math.random() - 0.5) * 0.1)),
        peers: Math.max(30, Math.min(65, prev.peers + (Math.random() > 0.5 ? 1 : -1)))
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="h-16 border-b border-dim px-6 flex items-center justify-between sticky top-0 bg-[#0a0a0b]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-[#0a0a0b]">
            <Server size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">ETHERNODE CORE</h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-emerald" />
              <span className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest">Mainnet Node Live</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-8 relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-500 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search block, tx hash or address..."
            className="w-full bg-white/5 border border-dim rounded-lg py-2 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-emerald-500/50 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-mono text-white/50">GAS PRICE</div>
            <div className="text-sm font-mono font-medium">{parseFloat(gasPrice).toFixed(2)} Gwei</div>
          </div>
          <button className="p-2 rounded-lg border border-dim hover:bg-white/5 transition-colors">
            <Menu size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        
        {/* Left Sidebar Metrics */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <div className="bg-glass border border-dim rounded-2xl p-5 overflow-hidden relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-mono font-medium text-white/40 uppercase tracking-widest">Node Health</h2>
              <Activity size={14} className="text-emerald-500" />
            </div>
            
            <div className="space-y-6">
              <MetricRow label="CPU LOAD" value={`${metrics.cpuUsage.toFixed(1)}%`} progress={metrics.cpuUsage / 100} />
              <MetricRow label="RAM USAGE" value={`${metrics.memoryUsage.toFixed(1)} GB`} progress={metrics.memoryUsage / 8} />
              <MetricRow label="PEERS" value={metrics.peers.toString()} progress={metrics.peers / 100} />
              
              <div className="pt-2 border-t border-dim flex flex-col gap-2">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-white/40">VERSION</span>
                  <span className="text-white/80">{metrics.version}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-white/40">UPTIME</span>
                  <span className="text-white/80">{metrics.uptime}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-glass border border-dim rounded-2xl p-5">
            <h2 className="text-xs font-mono font-medium text-white/40 uppercase tracking-widest mb-4">Network State</h2>
            <div className="grid grid-cols-2 gap-3">
              <StateCard icon={<Globe size={14} />} label="Chain ID" value="1" />
              <StateCard icon={<Lock size={14} />} label="Type" value="PoS" />
              <StateCard icon={<RefreshCcw size={14} />} label="Sync" value="100%" />
              <StateCard icon={<Zap size={14} />} label="Lvl" value="Full" />
            </div>
          </div>
        </section>

        {/* Center: Chain Topology & Explorer */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-6">
          {/* Visual Chain Topology */}
          <div className="bg-glass border border-dim rounded-2xl p-6 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-emerald-500" />
                <h2 className="text-xs font-mono font-medium text-white/40 uppercase tracking-widest">Latest Continuity</h2>
              </div>
              <div className="text-[10px] font-mono bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded border border-emerald-500/20">
                LIVE_FEED
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
              <div className="flex items-center gap-4 relative">
                {/* Visual line connecting nodes */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2 z-0" />
                
                <AnimatePresence mode="popLayout">
                  {blocks.slice().reverse().map((b, i) => (
                    <motion.div
                      key={b.hash}
                      layout
                      initial={{ scale: 0, opacity: 0, x: 20 }}
                      animate={{ scale: 1, opacity: 1, x: 0 }}
                      exit={{ scale: 0, opacity: 0, x: -20 }}
                      className="relative z-10"
                    >
                      <div className="group relative">
                        <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer shadow-2xl
                          ${i === blocks.length - 1 ? 'bg-emerald-500 border-emerald-400 text-[#0a0a0b]' : 'bg-[#151518] border-dim text-white/70 hover:border-emerald-500/50'}
                        `}>
                          <Box size={20} />
                        </div>
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/30 whitespace-nowrap">
                          #{b.number}
                        </div>
                        
                        {/* Hover Details Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-3 scale-0 group-hover:scale-100 origin-bottom transition-transform bg-[#1a1a1e] border border-dim rounded-xl shadow-2xl z-50 pointer-events-none">
                          <div className="text-[10px] font-mono text-emerald-500 mb-1">DATA_PACKET</div>
                          <div className="text-xs font-mono font-medium truncate mb-2">{b.hash}</div>
                          <div className="flex justify-between text-[10px] font-mono text-white/40">
                            <span>TXS</span>
                            <span>{b.transactionsCount}</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-mono text-white/40">
                            <span>MINED</span>
                            <span>{new Date(b.timestamp * 1000).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Recent Blocks List */}
          <div className="bg-glass border border-dim rounded-2xl overflow-hidden flex flex-col flex-1">
            <div className="p-5 flex items-center justify-between border-b border-dim">
              <h2 className="text-xs font-mono font-medium text-white/40 uppercase tracking-widest">Propagation Ledger</h2>
              <button className="text-[10px] font-mono text-white/30 hover:text-white flex items-center gap-1">
                VIEW ALL <ChevronDown size={10} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {blocks.length === 0 ? (
                <div className="p-8 text-center text-white/20 font-mono text-xs">
                  Awaiting block propagation...
                </div>
              ) : (
                blocks.map((b) => (
                  <div key={b.hash} className="group p-4 flex items-center justify-between border-b border-dim hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 border border-dim flex items-center justify-center text-white/40 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 group-hover:border-emerald-500/20 transition-all">
                        <Box size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-mono font-medium text-white/90">#{b.number}</div>
                        <div className="text-[10px] font-mono text-white/30">{b.hash.slice(0, 12)}...{b.hash.slice(-8)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-right font-mono">
                      <div className="hidden sm:block">
                        <div className="text-[9px] text-white/30 uppercase tracking-widest">Transactions</div>
                        <div className="text-xs text-white/70">{b.transactionsCount}</div>
                      </div>
                      <div className="hidden sm:block">
                        <div className="text-[9px] text-white/30 uppercase tracking-widest">Gas Used</div>
                        <div className="text-xs text-white/70">12.4M</div>
                      </div>
                      <ChevronRight size={14} className="text-white/20 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Sidebar: Tx Log & Security */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <div className="bg-glass border border-dim rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-xs font-mono font-medium text-white/40 uppercase tracking-widest">Live Tx Feed</h2>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1 h-8 bg-white/5 rounded-full mt-1 overflow-hidden">
                    <motion.div 
                      className="w-full bg-emerald-500"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.random() * 100}%` }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-[10px] font-mono mb-0.5">
                      <span className="text-emerald-500/70 truncate">0x{Math.random().toString(16).slice(2, 10)}...</span>
                      <span className="text-white/30 text-[9px]">{(Math.random() * 2).toFixed(3)} ETH</span>
                    </div>
                    <div className="text-[9px] font-mono text-white/30 uppercase tracking-tight truncate">
                      P2P Transfer Internal
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-2 bg-white/5 border border-dim rounded-lg text-[10px] font-mono text-white/40 hover:bg-white/10 transition-colors mt-2">
              MONITOR ALL MEMPOOL
            </button>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-emerald-500/10 rotate-12 transition-transform group-hover:scale-110 duration-500">
              <ShieldCheck size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={16} className="text-emerald-500" />
                <h3 className="text-xs font-mono font-semibold tracking-widest text-white/80">SECURITY STATS</h3>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed font-mono">
                Running active consensus validation. Signature verification active. No invalid payloads detected in current epoch.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-emerald-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                TRUSTED_READY
              </div>
            </div>
          </div>

          {/* Quick Support/Chat Mock */}
          <div className="mt-auto pt-6">
            <div className="p-4 bg-white/5 border border-dim rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40">
                <MessageSquare size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold">Node Support</div>
                <div className="text-[10px] text-white/40">Knowledge base & status</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer System Info */}
      <footer className="h-10 border-t border-dim flex items-center justify-between px-6 bg-[#0c0c0e]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white/30 text-[9px] font-mono uppercase tracking-widest">
            <Activity size={10} />
            <span>IO: 4.2 MB/s</span>
          </div>
          <div className="flex items-center gap-2 text-white/30 text-[9px] font-mono uppercase tracking-widest">
            <Orbit size={10} />
            <span>Region: EU-Central-1</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-white/50 text-[9px] font-mono">NODE_HASH: FD21...99X7</div>
          <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-500/80">
            <Lock size={10} />
            ESTABLISHED
          </div>
        </div>
      </footer>
    </div>
  );
}

function MetricRow({ label, value, progress }: { label: string, value: string, progress: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{label}</span>
        <span className="text-xs font-mono font-medium">{value}</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1 }}
        />
      </div>
    </div>
  );
}

function StateCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-dim flex flex-col gap-1 hover:bg-white/10 transition-colors cursor-default">
      <div className="text-white/40">{icon}</div>
      <div className="text-[9px] font-mono text-white/30 uppercase tracking-tight">{label}</div>
      <div className="text-xs font-mono font-medium text-white/90">{value}</div>
    </div>
  );
}
