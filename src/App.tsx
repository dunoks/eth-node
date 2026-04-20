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
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity as LatencyIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ethers } from 'ethers';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// RPC Providers - Using a more reliable list of public endpoints
const RPC_URLS = [
  'https://eth.llamarpc.com',
  'https://rpc.ankr.com/eth',
  'https://ethereum-rpc.publicnode.com',
  'https://cloudflare-eth.com'
];

interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasLimit: string;
  gasUsed: string;
}

interface BlockData {
  number: number;
  hash: string;
  timestamp: number;
  transactionsCount: number;
  miner: string;
  transactions?: TransactionData[];
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
  const [metrics, setMetrics] = useState<NodeMetrics>({
    peers: 48,
    cpuUsage: 12.4,
    memoryUsage: 4.2,
    uptime: '14d 06h 22m',
    version: 'Geth/v1.13.11-stable'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<BlockData | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [rpcIndex, setRpcIndex] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [peerHistory, setPeerHistory] = useState<{ time: string, peers: number }[]>([]);
  const [healthData, setHealthData] = useState({
    syncLag: '0.04s',
    propagation: '12.4ms',
    consensus: 'REACHED'
  });

  const provider = useMemo(() => new ethers.JsonRpcProvider(RPC_URLS[rpcIndex]), [rpcIndex]);

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
          if (prev.length > 0 && prev[0].number === newBlockData.number) return prev;
          return [newBlockData, ...prev].slice(0, 5);
        });
      }

      const feeData = await provider.getFeeData();
      if (feeData.gasPrice) {
        setGasPrice(ethers.formatUnits(feeData.gasPrice, 'gwei'));
      }
      setConnectionError(null);
    } catch (err: any) {
      console.error('Failed to fetch node data:', err);
      // Logic for automatic RPC rotation if an error occurs
      if (err?.code === 'UNKNOWN_ERROR' || err?.message?.includes('Cannot fulfill request')) {
        setRpcIndex((prev) => (prev + 1) % RPC_URLS.length);
        setConnectionError(`RPC Error: Rotating to endpoint ${rpcIndex + 2}...`);
      } else {
        setConnectionError('Network connectivity issue detected.');
      }
    }
  };

  const handleBlockClick = async (block: BlockData) => {
    setSelectedBlock(block);
    if (!block.transactions) {
      setIsModalLoading(true);
      try {
        // Fetch original block with full transactions pre-fetched
        const fullBlock = await provider.getBlock(block.number, true);
        if (fullBlock && fullBlock.transactions && fullBlock.transactions.length > 0) {
          // In ethers v6, block.transactions is an array of TransactionResponse if prefetchTxs is true
          const txsToShow = fullBlock.transactions.slice(0, 10) as ethers.TransactionResponse[];
          
          // Fetch receipts in parallel for gasUsed
          const txDetails = await Promise.all(txsToShow.map(async (tx) => {
            const receipt = await provider.getTransactionReceipt(tx.hash);
            return {
              hash: tx.hash,
              from: tx.from,
              to: tx.to || 'Contract Creation',
              value: ethers.formatEther(tx.value),
              gasLimit: tx.gasLimit.toString(),
              gasUsed: receipt ? receipt.gasUsed.toString() : 'Unknown'
            };
          }));

          const updatedBlock = { ...block, transactions: txDetails };
          setSelectedBlock(updatedBlock);
          
          // Update blocks list so we don't fetch again if clicked
          setBlocks(prev => prev.map(b => b.number === block.number ? updatedBlock : b));
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      } finally {
        setIsModalLoading(false);
      }
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
      setMetrics(prev => {
        const nextPeers = Math.max(30, Math.min(65, prev.peers + (Math.random() > 0.5 ? 1 : -1)));
        
        // Add to history
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        setPeerHistory(h => [
          ...h.slice(-19),
          { time: timeStr, peers: nextPeers }
        ]);

        setHealthData({
          syncLag: (Math.random() * 0.1).toFixed(2) + 's',
          propagation: (10 + Math.random() * 50).toFixed(1) + 'ms',
          consensus: Math.random() > 0.05 ? 'REACHED' : 'VAL_SYNC'
        });

        return {
          ...prev,
          cpuUsage: Math.max(5, Math.min(45, prev.cpuUsage + (Math.random() - 0.5) * 5)),
          memoryUsage: Math.max(3.8, Math.min(5.2, prev.memoryUsage + (Math.random() - 0.5) * 0.1)),
          peers: nextPeers
        };
      });
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
            <div className={`w-2 h-2 rounded-full ${connectionError ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 animate-pulse-status'}`}></div>
            <span className={`text-[10px] uppercase tracking-tighter font-mono ${connectionError ? 'text-amber-500' : 'opacity-60'}`}>
              {connectionError ? 'RPC_RECONNECTING' : 'Mainnet_Active'}
            </span>
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
                  <div className="space-y-4">
                    <MetricRow label="PEERS_ACTIVE" value={metrics.peers.toString()} progress={metrics.peers / 100} />
                    
                    <div className="h-32 w-full mt-4 bg-black/40 border border-white/5 p-2 rounded-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={peerHistory}>
                          <XAxis dataKey="time" hide />
                          <YAxis domain={['auto', 'auto']} hide />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0A0A0A', 
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '0',
                              fontSize: '10px',
                              fontFamily: 'JetBrains Mono',
                              textTransform: 'uppercase'
                            }}
                            itemStyle={{ color: '#627EEA' }}
                            labelStyle={{ color: 'rgba(255,255,255,0.4)' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="peers" 
                            stroke="#627EEA" 
                            strokeWidth={1.5} 
                            dot={false}
                            animationDuration={1000}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-white/20 uppercase tracking-widest px-1">
                      <span>Historical_peers</span>
                      <span>Realtime_Stream</span>
                    </div>
                  </div>
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
                            `}
                            onClick={() => handleBlockClick(b)}>
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
                    <div key={b.hash} 
                    className="group p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer flex items-center justify-between"
                    onClick={() => handleBlockClick(b)}>
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

            {/* Right Col: Health, Feed & Security */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
              <div className="bg-card p-6 rounded-none flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <div className="accent-bar"></div>
                  <span className="text-[11px] uppercase tracking-widest font-extrabold text-white/90">Health_Diagnostics</span>
                </div>
                <div className="space-y-4">
                  <HealthUnit 
                    label="P2P_PEERS" 
                    value={`${metrics.peers} ATTACHED`} 
                    status={metrics.peers > 40 ? 'healthy' : metrics.peers > 15 ? 'warning' : 'critical'} 
                    icon={<Globe size={14} />}
                  />
                  <HealthUnit 
                    label="SYNC_LATENCY" 
                    value={`${healthData.syncLag} LAG`} 
                    status={parseFloat(healthData.syncLag) < 0.2 ? 'healthy' : 'warning'} 
                    icon={<Zap size={14} />}
                  />
                  <HealthUnit 
                    label="PROPAGATION" 
                    value={`${healthData.propagation} AVG`} 
                    status={parseFloat(healthData.propagation) < 30 ? 'healthy' : 'warning'} 
                    icon={<LatencyIcon size={14} />}
                  />
                </div>
                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                    <span className="text-white/30 uppercase tracking-widest">Global_Consensus</span>
                    <span className={`font-bold ${healthData.consensus === 'REACHED' ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`}>{healthData.consensus}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5">
                    <div className={`h-full bg-emerald-500/50 transition-all duration-1000 ${healthData.consensus === 'REACHED' ? 'w-full' : 'w-2/3'}`}></div>
                  </div>
                </div>
              </div>

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

      {/* Block Transaction Detail Modal */}
      <AnimatePresence>
        {selectedBlock && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedBlock(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl max-h-full aspect-[4/3] bg-bg border border-white/10 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="h-16 border-b border-white/10 px-8 flex items-center justify-between bg-sidebar">
                <div className="flex items-center gap-3">
                  <div className="accent-bar"></div>
                  <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-white/90">Block Detail: {selectedBlock.number}</span>
                </div>
                <button 
                  onClick={() => setSelectedBlock(null)}
                  className="p-2 border border-white/10 hover:bg-white/5 transition-colors text-white/40"
                >
                  <ChevronRight className="rotate-180" size={18} />
                </button>
              </div>

              <div className="flex-1 p-8 overflow-y-auto">
                <div className="grid grid-cols-12 gap-8 h-full">
                  {/* Left Column: Summary */}
                  <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest font-bold">Block Hash</div>
                      <div className="text-xs font-mono break-all text-white/70">{selectedBlock.hash}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest font-bold">Timestamp</div>
                      <div className="text-xs font-mono text-white/70">{new Date(selectedBlock.timestamp * 1000).toLocaleString()}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest font-bold">Transaction Count</div>
                      <div className="text-xs font-mono text-white/70">{selectedBlock.transactionsCount} entries</div>
                    </div>
                    <div className="mt-auto pt-6 border-t border-white/5">
                      <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest leading-relaxed">
                        Data retrieved from execution layer via snapshot sync. Content integrity verified by consensus layer.
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Transactions */}
                  <div className="col-span-12 md:col-span-8 flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] uppercase tracking-widest font-extrabold text-white/90">Propagating_Payloads</span>
                      {isModalLoading && <div className="text-[10px] font-mono text-eth-blue animate-pulse">FETCHING_RECEIPTS...</div>}
                    </div>

                    <div className="flex-1 bg-black border border-white/5 overflow-y-auto">
                      {isModalLoading ? (
                        <div className="h-full flex items-center justify-center p-12">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border border-eth-blue border-t-white animate-spin"></div>
                            <span className="text-[10px] font-mono text-white/30 tracking-widest uppercase">Analyzing Ledger...</span>
                          </div>
                        </div>
                      ) : !selectedBlock.transactions ? (
                        <div className="h-full flex items-center justify-center p-12 text-white/20 font-mono text-[10px] uppercase tracking-widest">
                          No transaction payload found
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          {selectedBlock.transactions.map((tx, idx) => (
                            <div key={tx.hash} className="p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                              <div className="flex justify-between items-start mb-3">
                                <div className="text-[10px] font-mono text-eth-blue group-hover:text-white transition-colors truncate max-w-[200px]">
                                  {tx.hash}
                                </div>
                                <div className="text-[10px] font-mono text-white/60">{tx.value} Ξ</div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">From</div>
                                  <div className="text-[9px] font-mono text-white/40 truncate">{tx.from}</div>
                                </div>
                                <div>
                                  <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">To</div>
                                  <div className="text-[9px] font-mono text-white/40 truncate">{tx.to}</div>
                                </div>
                              </div>
                              <div className="mt-3 flex gap-4 text-[9px] font-mono text-white/20 uppercase tracking-widest">
                                <span>Gas Limit: <span className="text-white/40">{tx.gasLimit}</span></span>
                                <span>Gas Used: <span className="text-emerald-500/60 font-bold">{tx.gasUsed}</span></span>
                              </div>
                            </div>
                          ))}
                          <div className="p-4 text-[9px] font-mono text-white/20 text-center uppercase tracking-widest">
                            Showing first 10 transactions of block
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <footer className="h-8 border-t border-white/10 px-8 flex items-center justify-between text-[10px] font-mono text-white/20 bg-sidebar">
                <div className="uppercase tracking-widest">Transaction Snapshot v1.0</div>
                <div className="flex items-center gap-2">
                  <Lock size={10} />
                  SECURE_LAYER
                </div>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

function HealthUnit({ label, value, status, icon }: { label: string, value: string, status: 'healthy' | 'warning' | 'critical', icon: React.ReactNode }) {
  const statusConfig = {
    healthy: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', Icon: CheckCircle2 },
    warning: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', Icon: AlertTriangle },
    critical: { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', Icon: XCircle }
  };

  const { color, bg, border, Icon } = statusConfig[status];

  return (
    <div className={`p-4 border ${border} ${bg} flex items-center justify-between group transition-all duration-300`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 bg-black/40 text-white/30 group-hover:${color} transition-colors`}>
          {icon}
        </div>
        <div>
          <div className="text-[9px] font-mono text-white/30 uppercase tracking-tight mb-0.5">{label}</div>
          <div className="text-[11px] font-mono font-bold text-white/80 uppercase">{value}</div>
        </div>
      </div>
      <Icon size={14} className={color} />
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
