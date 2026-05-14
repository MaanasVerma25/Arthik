import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { fetchCurrentUserProfile, UserProfile, getTradeHistory, TradeRecord } from "@/lib/supabaseService";
import { getUsdToInrRate, FALLBACK_INR_RATE } from "@/lib/currencyService";
import { TrendingUp, TrendingDown, History, Wallet, LayoutDashboard, BarChart3, PiggyBank, ArrowUpRight, ArrowDownRight, ShoppingCart, ArrowRightLeft, PieChart } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Chart from "react-apexcharts";

const INITIAL_BALANCE = 100000;

const formatSymbol = (symbol: string) => symbol.replace(/\.(NS|BO)$/i, "");

const DashboardPage = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [inrRate, setInrRate] = useState(FALLBACK_INR_RATE);

  useEffect(() => {
    const fetchData = async () => {
      const [profile, recentTrades, rate] = await Promise.all([
        fetchCurrentUserProfile(),
        getTradeHistory(8),
        getUsdToInrRate(),
      ]);

      setUser(profile);
      setTrades(recentTrades);
      setInrRate(rate);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading || !user) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 rounded-xl bg-card border border-border" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 rounded-xl bg-card border border-border" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Portfolio Calculations ──
  const cashBalance = user.balance;

  const stockInvested = (user.stockHoldings || []).reduce((sum: number, h: any) => sum + Number(h.avgPrice || 0) * Number(h.qty || 0), 0);
  // Forex avgPrice is stored in USD, convert to INR
  const forexInvested = (user.forexHoldings || []).reduce((sum: number, h: any) => sum + Number(h.avgPrice || 0) * inrRate * Number(h.qty || 0), 0);
  // Crypto avgPrice is stored in USD, convert to INR
  const cryptoInvested = (user.cryptoHoldings || []).reduce((sum: number, h: any) => sum + Number(h.avgPrice || 0) * inrRate * Number(h.qty || 0), 0);

  const totalHoldingsValue = stockInvested + forexInvested + cryptoInvested;
  const totalEquity = cashBalance + totalHoldingsValue;
  const overallPnl = totalEquity - INITIAL_BALANCE;
  const overallPnlPct = ((overallPnl / INITIAL_BALANCE) * 100).toFixed(2);
  const isProfit = overallPnl >= 0;

  const stockCount = (user.stockHoldings || []).length;
  const forexCount = (user.forexHoldings || []).length;
  const cryptoCount = (user.cryptoHoldings || []).length;
  const totalPositions = stockCount + forexCount + cryptoCount;

  const getMarketColor = (market: string) => {
    switch (market) {
      case 'STOCK': return 'text-primary';
      case 'FOREX': return 'text-blue-500';
      case 'CRYPTO': return 'text-amber-500';
      default: return 'text-muted-foreground';
    }
  };

  const getMarketBg = (market: string) => {
    switch (market) {
      case 'STOCK': return 'bg-primary/10';
      case 'FOREX': return 'bg-blue-500/10';
      case 'CRYPTO': return 'bg-amber-500/10';
      default: return 'bg-secondary';
    }
  };

  // ── Chart Config ──
  const breakdownSeries = [stockInvested, forexInvested, cryptoInvested];
  const breakdownOptions: any = {
    chart: { type: 'donut', background: 'transparent' },
    labels: ['Stocks', 'Forex', 'Crypto'],
    theme: { mode: 'dark' },
    colors: ['#3b82f6', '#10b981', '#f59e0b'],
    stroke: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, color: 'hsl(216 18% 62%)' },
            value: {
              show: true,
              color: 'white',
              formatter: (val: number) => `₹${val.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
            },
            total: {
              show: true,
              label: 'Invested',
              color: 'hsl(216 18% 62%)',
              formatter: () => `₹${totalHoldingsValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
            }
          }
        }
      }
    },
    legend: { show: false }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="gold-border-top rounded-xl border border-border bg-card p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl">Welcome back, {user.name.split(" ")[0]}</h1>
              <p className="mt-1 text-muted-foreground">{user.role}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-foreground">{user.isPro ? 'PRO Member' : 'Basic Account'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Portfolio Overview Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank size={16} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Cash Balance</span>
            </div>
            <div className="font-mono text-xl font-bold">
              ₹{cashBalance.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-4 relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Invested Value</span>
            </div>
            <div className="font-mono text-xl font-bold">
              ₹{totalHoldingsValue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{totalPositions} active position{totalPositions !== 1 ? 's' : ''}</div>
            {totalHoldingsValue > 0 && <div className="absolute right-0 top-0 h-full w-1 animate-pulse bg-primary/20" />}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Equity</span>
            </div>
            <div className="font-mono text-xl font-bold">
              ₹{totalEquity.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              {isProfit ? <TrendingUp size={16} className="text-success" /> : <TrendingDown size={16} className="text-destructive" />}
              <span className="text-xs text-muted-foreground">Overall P&L</span>
            </div>
            <div className={`font-mono text-xl font-bold ${isProfit ? "text-success" : "text-destructive"}`}>
              {isProfit ? "+" : ""}₹{Math.abs(overallPnl).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </div>
            <div className={`text-xs font-semibold mt-0.5 flex items-center gap-1 ${isProfit ? "text-success" : "text-destructive"}`}>
              {isProfit ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {overallPnlPct}% from ₹1,00,000
            </div>
          </motion.div>
        </div>

        {/* Market Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <PieChart size={16} /> Portfolio Breakdown by Market
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Chart Column */}
            <div className="md:col-span-4 flex justify-center">
              {totalHoldingsValue > 0 ? (
                <div className="h-[180px] w-full">
                  <Chart options={breakdownOptions} series={breakdownSeries} type="donut" height="100%" />
                </div>
              ) : (
                <div className="h-[180px] w-[180px] rounded-full border-4 border-dashed border-border flex items-center justify-center text-center p-4">
                  <p className="text-[10px] text-muted-foreground">No active positions to display</p>
                </div>
              )}
            </div>

            {/* Stats Column */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to="/games/stock-simulator" className="group">
                <div className="rounded-lg border border-border bg-secondary/30 p-3 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">Stocks</span>
                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{stockCount}</span>
                  </div>
                  <div className="font-mono text-md font-bold">
                    ₹{stockInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${totalHoldingsValue > 0 ? (stockInvested / totalHoldingsValue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </Link>

              <Link to="/games/forex-simulator" className="group">
                <div className="rounded-lg border border-border bg-secondary/30 p-3 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">Forex</span>
                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{forexCount}</span>
                  </div>
                  <div className="font-mono text-md font-bold">
                    ₹{forexInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${totalHoldingsValue > 0 ? (forexInvested / totalHoldingsValue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </Link>

              <Link to="/crypto" className="group">
                <div className="rounded-lg border border-border bg-secondary/30 p-3 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">Crypto</span>
                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{cryptoCount}</span>
                  </div>
                  <div className="font-mono text-md font-bold">
                    ₹{cryptoInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${totalHoldingsValue > 0 ? (cryptoInvested / totalHoldingsValue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
           {/* Trade History */}
           <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <History size={16} />
                <span className="text-sm font-medium">Trade History</span>
              </div>
            </div>
            <div className="space-y-3">
              {trades.length > 0 ? (
                trades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getMarketBg(trade.market)} ${getMarketColor(trade.market)}`}>
                        {trade.action === 'BUY' ? <ShoppingCart size={14} /> : <ArrowRightLeft size={14} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trade.action === 'BUY' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                            {trade.action}
                          </span>
                          {formatSymbol(trade.symbol)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {trade.quantity} units × {trade.market === 'STOCK' ? '₹' : '$'}{Number(trade.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold">
                        {trade.market === 'STOCK' ? '₹' : '$'}{Number(trade.total_value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{new Date(trade.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <p>No trades yet. Start trading to see your history here.</p>
                </div>
              )}
            </div>
          </motion.div>

          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="gold-border-top rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <LayoutDashboard size={16} />
                <span className="text-sm font-medium">Quick Actions</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/budgeting">Open Budget</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/games/stock-simulator">Trade Stocks</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/games/forex-simulator">Trade Forex</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/crypto">Trade Crypto</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
