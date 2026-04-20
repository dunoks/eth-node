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
    <div className="min-h-screen flex flex-col font-sans bg-bg">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-sidebar sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-eth-blue rounded-sm flex items-center justify-center font-bold text-black text-xs">Ξ</div>
          <span className="text-sm font-mono tracking-widest uppercase">Node_Dash_v2.0</span>
        </div>

        <div className="flex-1 max-w-xl mx-8 relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-eth-blue transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search network data..."
            className="w-full bg-white/5 border border-white/10 rounded-none py-2 pl-10 pr-4 text-[10px] font-mono focus:outline-none focus:border-eth-blue/50 transition-all uppercase tracking-wider"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-status"></div>
            <span className="text-[10px] uppercase tracking-tighter opacity-60 font-mono">Mainnet_Active</span>
          </div>
          <div className="px-3 py-1 border border-white/20 text-[10px] font-mono hidden sm:block">GAS: {parseFloat(gasPrice).toFixed(1)}GW</div>
          <button className="p-2 border border-white/10 hover:bg-white/5 transition-colors">
            <Menu size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        {/* Left Step Rail (Thematic addition) */}
        <aside className="w-20 border-r border-white/10 hidden md:flex flex-col items-center py-8 gap-12 bg-sidebar h-full sticky top-16">
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] font-mono opacity-40">01</div>
            <div className="w-10 h-10 border border-eth-blue flex items-center justify-center text-eth-blue bg-eth-blue/5">
              <Cpu size={16} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] font-mono opacity-40">02</div>
            <div className="w-10 h-10 border border-white/20 flex items-center justify-center text-white/40">
              <Database size={16} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 text-white/30">
            <div className="text-[10px] font-mono opacity-40">03</div>
            <div className="w-10 h-10 border border-white/10 flex items-center justify-center">
              <RefreshCcw size={16} />
            </div>
          </div>
          <div className="mt-auto flex flex-col items-center gap-2">
            <div className="w-0.5 h-24 bg-white/5 relative">
              <div className="absolute top-0 left-0 w-full h-1/3 bg-eth-blue shadow-[0_0_8px_rgba(98,126,234,0.5)]"></div>
            </div>
          </div>
        </aside>

        {/* Console Content */}
        <section className="flex-1 p-8 lg:p-10 flex flex-col gap-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div>
              <h1 className="text-4xl font-light tracking-tight text-white">Eth Node Dashboard</h1>
              <p className="text-sm text-white/40 mt-2 font-mono uppercase tracking-wider">{metrics.version} | Mainnet</p>
            </div>
            <button className="px-8 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-eth-blue hover:text-white transition-colors duration-300 rounded-none shadow-xl">
              Sync Data
            </button>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left Col: Health and Stats */}
            <div className="col-span-12 md:col-span-6 lg:col-span-3 flex flex-col gap-6">
              <div className="bg-card p-6 flex flex-col rounded-none">
                <div className="flex items-center gap-2 mb-6">
                  <div className="accent-bar"></div>
                  <span className="text-[11px] uppercase tracking-widest font-extrabold text-white/90">Node_Metrics</span>
                </div>
                <div className="space-y-6">
                  <MetricRow label="CPU_LOAD" value={`${metrics.cpuUsage.toFixed(1)}%`} progress={metrics.cpuUsage / 100} />
                  <MetricRow label="MEM_USED" value={`${metrics.memoryUsage.toFixed(1)} GB`} progress={metrics.memoryUsage / 8} />
                  <MetricRow label="PEERS_ACTIVE" value={metrics.peers.toString()} progress={metrics.peers / 100} />
                </div>
              </div>

              <div className="bg-card p-6 rounded-none">
                <div className="flex items-center gap-2 mb-6">
                  <div className="accent-bar"></div>
                  <span className="text-[11px] uppercase tracking-widest font-extrabold text-white/90">Network_Gate</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <StateCard icon={<Globe size={14} />} label="Chain" value="Mainnet" />
                  <StateCard icon={<Lock size={14} />} label="Type" value="PoS / ETH" />
                  <StateCard icon={<RefreshCcw size={14} />} label="Sync" value="100%" />
                  <StateCard icon={<Activity size={14} />} label="State" value="Stable" />
                </div>
              </div>
            </div>

            {/* Center Col: Continuity & Ledger */}
            <div className="col-span-12 md:col-span-6 lg:col-span-6 flex flex-col gap-6">
              <div className="bg-card p-6 rounded-none min-h-[300px] flex flex-col relative overflow-hidden">
                <div className="flex items-center gap-2 mb-8">
                  <div className="accent-bar"></div>
                  <span className="text-[11px] uppercase tracking-widest font-extrabold text-white/90">Latest_Propagation</span>
                </div>
                
                <div className="flex-1 flex items-center justify-center relative">
                  <div className="flex items-center gap-4 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-1/2" />
                    <AnimatePresence mode="popLayout">
                      {blocks.slice().reverse().map((b, i) => (
                        <motion.div
                          key={b.hash}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative z-10"
                        >
                          <div className="group">
                            <div className={`w-14 h-14 border-2 flex items-center justify-center transition-all cursor-pointer rounded-none
                              ${i === blocks.length - 1 ? 'bg-eth-blue border-eth-blue text-white shadow-[0_0_15px_rgba(98,126,234,0.3)]' : 'bg-black border-white/10 text-white/40 hover:border-eth-blue/50'}
                            `}>
                              <Box size={20} />
                            </div>
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/30 whitespace-nowrap">
                              #{b.number}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="bg-black border border-white/10 flex flex-col rounded-none flex-1 overflow-hidden min-h-[400px]">
                <div className="p-4 flex items-center justify-between border-b border-white/10 bg-sidebar">
                  <div className="flex items-center gap-2">
                    <div className="accent-bar"></div>
                    <span className="text-[11px] uppercase tracking-widest font-extrabold text-white/90">Chain_Ledger.log</span>
                  </div>
                  <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Live Updates</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {blocks.map((b) => (
                    <div key={b.hash} className="group p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 border border-white/10 flex items-center justify-center text-white/30 group-hover:text-eth-blue group-hover:border-eth-blue transition-colors rounded-none">
                          <Box size={14} />
                        </div>
                        <div className="font-mono">
                          <div className="text-xs font-bold text-white/90 mb-0.5">BLOCK_{b.number}</div>
                          <div className="text-[10px] text-white/20 uppercase truncate max-w-[80px] sm:max-w-xs">{b.hash}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono hidden sm:block">
                        <div className="text-[10px] text-white/20 uppercase tracking-widest">transactions</div>
                        <div className="text-xs text-eth-blue">{b.transactionsCount} entries</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Feed & Security */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
              <div className="bg-card p-6 rounded-none flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="accent-bar"></div>
                  <span className="text-[11px] uppercase tracking-widest font-extrabold text-white/90">Mempool_Feed</span>
                </div>
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-0.5 h-8 bg-white/5 rounded-none mt-1 overflow-hidden">
                        <motion.div 
                          className="w-full bg-eth-blue"
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.random() * 100}%` }}
                          transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center text-[10px] font-mono mb-0.5">
                          <span className="text-eth-blue/70 truncate">Tx_{Math.random().toString(16).slice(2, 8)}</span>
                          <span className="text-white/30 text-[9px]">{(Math.random() * 0.5).toFixed(3)} Ξ</span>
                        </div>
                        <div className="text-[9px] font-mono text-white/20 uppercase tracking-tight truncate">
                          Internal_Relay_Call
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-eth-blue/5 border border-eth-blue/20 p-6 rounded-none relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 text-eth-blue/5 rotate-12 transition-transform group-hover:scale-110 duration-700">
                  <ShieldCheck size={140} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck size={16} className="text-eth-blue" />
                    <h3 className="text-[11px] font-mono font-extrabold tracking-widest text-white/90 uppercase">Security_Auth</h3>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed font-mono uppercase tracking-tight">
                    Active consensus validation. Signature verification online. 0 integrity failures in current epoch.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-emerald-500 animate-pulse" />
                    Verified_Stable
                  </div>
                </div>
              </div>

              <div className="bg-card p-4 rounded-none flex items-center gap-3 border-dashed border-white/10 group cursor-pointer hover:border-eth-blue/30 transition-colors mt-auto">
                <div className="w-10 h-10 border border-white/10 flex items-center justify-center text-white/20 group-hover:text-eth-blue transition-colors">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/80">Support_Node</div>
                  <div className="text-[9px] font-mono text-white/30 uppercase">Documentation_v1.4</div>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Monitor Footer-Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8">
            <ResourceModule label="DISK I/O" value="480 MB/s" />
            <ResourceModule label="BANDWIDTH" value="1.2 Gbps" isAccent />
            <ResourceModule label="LATENCY" value="14ms" />
            <ResourceModule label="UPTIME" value={metrics.uptime} />
          </div>
        </section>
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-8 border-t border-white/10 px-8 flex items-center justify-between text-[10px] font-mono text-white/40 bg-sidebar shrink-0">
        <div className="flex gap-6 uppercase tracking-widest">
          <span>REGION: EU-CENTRAL-1</span>
          <span>EPOC_TIME: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-emerald-500 uppercase font-bold tracking-tighter">NODE_OPTIMAL</span>
          <div className="w-3 h-3 bg-white/10"></div>
        </div>
      </footer>
    </div>
  );
}

function MetricRow({ label, value, progress }: { label: string, value: string, progress: number }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest font-bold">{label}</span>
        <span className="text-xs font-mono text-white/80">{value}</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-none">
        <motion.div 
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1.5, ease: "circOut" }}
        />
      </div>
    </div>
  );
}

function StateCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-4 border border-white/10 flex flex-col gap-2 hover:bg-white/[0.03] transition-colors cursor-default bg-black/50">
      <div className="text-white/20">{icon}</div>
      <div>
        <div className="text-[9px] font-mono text-white/30 uppercase tracking-tight">{label}</div>
        <div className="text-[11px] font-mono font-bold text-white/80">{value}</div>
      </div>
    </div>
  );
}

function ResourceModule({ label, value, isAccent }: { label: string, value: string, isAccent?: boolean }) {
  return (
    <div className={`border border-white/10 p-5 flex flex-col justify-between h-24 ${isAccent ? 'bg-eth-blue/5 border-eth-blue/20' : 'bg-surface'}`}>
      <span className={`text-[9px] uppercase tracking-widest ${isAccent ? 'text-eth-blue font-bold' : 'text-white/40'}`}>{label}</span>
      <span className={`text-xl font-light tracking-tight ${isAccent ? 'text-eth-blue' : 'text-white/90'}`}>{value}</span>
    </div>
  );
}
