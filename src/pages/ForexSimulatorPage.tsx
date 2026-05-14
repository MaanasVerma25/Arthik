import { useState, useCallback, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, TrendingUp, TrendingDown, Activity, RefreshCw, BarChart } from "lucide-react";
import Chart from "react-apexcharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchForexQuote, fetchForexHistorical, FOREX_PAIRS, ForexQuote, ForexKline, ForexTimeRange } from "@/lib/forexApi";
import { fetchCurrentUserProfile, updatePortfolio, logTrade } from "@/lib/supabaseService";
import { getUsdToInrRate, FALLBACK_INR_RATE } from "@/lib/currencyService";

interface Holding {
  symbol: string;
  qty: number;
  avgPrice: number;
}

const TIME_RANGES: ForexTimeRange[] = ['1D', '5D', '1M', '6M', '1Y'];

const ForexSimulatorPage = () => {
  const [cash, setCash] = useState(100000);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState(1000); // Higher default qty for forex
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [userId, setUserId] = useState<string | null>(null);
  
  // Real-time Data State
  const [selectedSymbol, setSelectedSymbol] = useState(FOREX_PAIRS[0].symbol);
  const [timeRange, setTimeRange] = useState<ForexTimeRange>('1D');
  const [livePrices, setLivePrices] = useState<Record<string, ForexQuote>>({});
  const [chartData, setChartData] = useState<ForexKline[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inrRate, setInrRate] = useState(FALLBACK_INR_RATE);

  // Derive static info from list
  const filteredPairs = FOREX_PAIRS.filter(
    (s) => s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const selectedDef = FOREX_PAIRS.find(s => s.symbol === selectedSymbol) || FOREX_PAIRS[0];
  const activeQuote = livePrices[selectedSymbol];

  const fetchCurrentQuote = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const q = await fetchForexQuote(selectedSymbol);
      if (q) setLivePrices(prev => ({ ...prev, [q.symbol]: q }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedSymbol]);

  // Load Historical data when selected stock or time range changes
  useEffect(() => {
    let mounted = true;
    const loadChart = async () => {
      setIsChartLoading(true);
      const data = await fetchForexHistorical(selectedSymbol, timeRange);
      if (mounted) {
        setChartData(data);
        setIsChartLoading(false);
      }
    };
    loadChart();
    return () => { mounted = false; };
  }, [selectedSymbol, timeRange]);

  // Initial fetch for the active pair
  useEffect(() => {
    fetchCurrentQuote();
    getUsdToInrRate().then(setInrRate);
    
    // Fetch user profile and unified portfolio 
    fetchCurrentUserProfile().then(profile => {
      if (profile.id) setUserId(profile.id);
      setCash(profile.balance);
      if (profile.forexHoldings && profile.forexHoldings.length > 0) {
        setHoldings(profile.forexHoldings);
      }
    });
  }, []); // Only run once on mount

  const buy = useCallback(async () => {
    if (!activeQuote) return;
    // Cost in USD converted to INR
    const costInr = activeQuote.price * inrRate * qty;
    if (costInr > cash) { toast.error("Insufficient funds"); return; }
    
    const newCash = cash - costInr;
    
    let newHoldings: Holding[];
    const existing = holdings.find((h) => h.symbol === selectedSymbol);
    if (existing) {
      const newQty = existing.qty + qty;
      const newAvg = ((existing.avgPrice * existing.qty) + (activeQuote.price * qty)) / newQty;
      newHoldings = holdings.map((h) => h.symbol === selectedSymbol ? { ...h, qty: newQty, avgPrice: newAvg } : h);
    } else {
      newHoldings = [...holdings, { symbol: selectedSymbol, qty, avgPrice: activeQuote.price }];
    }

    setCash(newCash);
    setHoldings(newHoldings);

    if (userId) {
      updatePortfolio(userId, newCash, undefined, newHoldings);
      logTrade(userId, 'FOREX', 'BUY', selectedSymbol, qty, activeQuote.price);
    }
    
    toast.success(`Bought ${qty} ${selectedSymbol} at $${activeQuote.price.toFixed(5)}`);
  }, [selectedSymbol, activeQuote, qty, cash, holdings, userId, inrRate]);

  const sell = useCallback(async (symbol: string) => {
    const holding = holdings.find((h) => h.symbol === symbol);
    if (!holding) return;
    
    const currentPrice = livePrices[symbol]?.price || holding.avgPrice;
    // Value in USD converted to INR
    const valueInr = currentPrice * inrRate * holding.qty;
    
    const newCash = cash + valueInr;
    const newHoldings = holdings.filter((h) => h.symbol !== symbol);
    
    setCash(newCash);
    setHoldings(newHoldings);

    if (userId) {
      updatePortfolio(userId, newCash, undefined, newHoldings);
      logTrade(userId, 'FOREX', 'SELL', symbol, holding.qty, currentPrice);
    }
    
    toast.success(`Sold all ${symbol} at $${currentPrice.toFixed(5)}`);
  }, [holdings, livePrices, cash, userId, inrRate]);

  // Dynamic Portfolio Calculations
  const portfolioValue = holdings.reduce((sum, h) => {
    const currentPrice = livePrices[h.symbol]?.price || h.avgPrice;
    // Value in USD converted to INR
    return sum + (currentPrice * inrRate * h.qty);
  }, 0);

  const totalValue = cash + portfolioValue;
  const pnl = totalValue - 100000;
  const pnlPct = ((pnl / 100000) * 100).toFixed(2);

  const apexSeries = chartType === 'candlestick' ? [{
      data: chartData.map(d => ({
          x: d.timestamp,
          y: [d.open, d.high, d.low, d.close]
      }))
  }] : [{
      name: "Price",
      data: chartData.map(d => ({
          x: d.timestamp,
          y: parseFloat(d.close.toFixed(5))
      }))
  }];

  const apexOptions: any = {
      chart: {
          type: chartType,
          toolbar: { show: false },
          animations: { enabled: false },
          background: 'transparent',
      },
      grid: { show: false },
      xaxis: {
          type: 'datetime',
          labels: {
              style: { colors: 'hsl(216 18% 62%)', fontSize: '10px' },
              datetimeUTC: false,
              format: timeRange === '1D' || timeRange === '5D' ? 'HH:mm' : 'dd MMM',
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
          tooltip: { enabled: false }
      },
      yaxis: {
          labels: {
              style: { colors: 'hsl(216 18% 62%)', fontSize: '10px' },
              formatter: (value: number) => `$${value.toFixed(4)}`,
          },
      },
      theme: { mode: 'dark' },
      tooltip: {
          theme: 'dark',
          y: { formatter: (val: number) => `$${val.toFixed(5)}` },
          x: { format: 'dd MMM, HH:mm' }
      },
      stroke: {
          curve: 'monotoneCubic',
          width: chartType === 'line' ? 2 : 1,
      },
      colors: ['hsl(217 91% 60%)'], // Blue accent for Forex
      plotOptions: {
          candlestick: {
              colors: {
                  upward: 'hsl(142 71% 45%)',
                  downward: 'hsl(0 84% 60%)'
              }
          }
      }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="font-display text-3xl flex items-center gap-3">
                    Forex Trading Simulator
                </h1>
                <p className="mt-1 text-muted-foreground">Trade currency pairs with your shared unified balance of ₹1,00,000 (represented globally)</p>
            </div>
            
            <Button variant="outline" size="sm" onClick={fetchCurrentQuote} disabled={isRefreshing} className="hidden sm:flex">
                <RefreshCw size={14} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Quote
            </Button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-xs text-muted-foreground">Available Cash</span>
            <div className="mt-1 font-mono text-xl font-bold">₹{cash.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 relative overflow-hidden">
            <span className="text-xs text-muted-foreground">FX Portfolio</span>
            <div className="mt-1 font-mono text-xl font-bold">₹{portfolioValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            {portfolioValue > 0 && <div className="absolute right-0 top-0 h-full w-1 animate-pulse bg-primary/20" />}
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-xs text-muted-foreground">Total Equity</span>
            <div className="mt-1 font-mono text-xl font-bold">₹{totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-xs text-muted-foreground">Unrealized P&L</span>
            <div className={`mt-1 font-mono text-xl font-bold ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
              {pnl >= 0 ? "+" : ""}₹{Math.abs(pnl).toLocaleString("en-IN", { minimumFractionDigits: 0 })} ({pnlPct}%)
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Pair list */}
          <div className="rounded-xl border border-border bg-card p-4 lg:col-span-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search FX pairs..."
                className="bg-secondary pl-9"
              />
            </div>
            <div className="mt-3 max-h-[500px] space-y-1 overflow-y-auto pr-1 flex flex-col gap-1 custom-scrollbar">
              {filteredPairs.map((s) => {
                const quote = livePrices[s.symbol];
                const priceStr = quote ? quote.price.toFixed(5) : "---";
                const change = quote ? quote.changePercent : 0;
                const isPositive = change >= 0;

                return (
                 <button
                   key={s.symbol}
                   onClick={() => setSelectedSymbol(s.symbol)}
                   className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-all ${selectedSymbol === s.symbol ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary border border-transparent"}`}
                 >
                   <div>
                     <div className="font-mono text-sm font-bold">{s.symbol}</div>
                     <div className="text-xs text-muted-foreground truncate w-32">{s.name}</div>
                   </div>
                   <div className="text-right">
                     <div className="font-mono text-sm font-semibold">
                         {priceStr}
                     </div>
                     <div className={`text-xs flex items-center justify-end gap-1 ${quote ? (isPositive ? "text-success" : "text-destructive") : "text-muted-foreground"}`}>
                       {quote && (isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />)}
                       {quote ? `${isPositive ? "+" : ""}${change.toFixed(2)}%` : ""}
                     </div>
                   </div>
                 </button>
                );
              })}
            </div>
          </div>

          {/* Chart + Buy */}
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-mono text-2xl font-bold flex items-center gap-2">
                      {selectedSymbol}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedDef.name}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-3xl font-bold animate-in fade-in slide-in-from-bottom-2 flex justify-end gap-2 items-end">
                      ${activeQuote ? activeQuote.price.toFixed(5) : "Loading..."}
                   </div>
                  {activeQuote && (
                    <div className={`flex items-center justify-end gap-1 text-sm font-medium mt-1 ${activeQuote.change >= 0 ? "text-success" : "text-destructive"}`}>
                        {activeQuote.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {activeQuote.change >= 0 ? "+" : ""}
                        {Math.abs(activeQuote.change).toFixed(4)} ({activeQuote.changePercent.toFixed(2)}%)
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                      {TIME_RANGES.map((range) => (
                          <button
                              key={range}
                              onClick={() => setTimeRange(range)}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${timeRange === range ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
                          >
                              {range}
                          </button>
                      ))}
                  </div>
                  
                  <div className="md:w-40 w-[120px]">
                      <Select value={chartType} onValueChange={(val: 'line' | 'candlestick') => setChartType(val)}>
                          <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Chart Type" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="line">
                                  <div className="flex items-center gap-2"><Activity size={14}/> Line</div>
                              </SelectItem>
                              <SelectItem value="candlestick">
                                  <div className="flex items-center gap-2"><BarChart size={14}/> Candlestick</div>
                              </SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>

              <div className="mt-6 h-[250px] relative">
                {isChartLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm z-10 rounded-lg">
                        <RefreshCw size={24} className="animate-spin text-primary" />
                    </div>
                ) : null}
                <div className="h-full w-full">
                    {chartData.length > 0 && (
                        <Chart options={apexOptions} series={apexSeries} type={chartType} height="100%" width="100%" />
                    )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Buy panel */}
                <div className="rounded-xl border border-border bg-card p-5">
                <h4 className="text-sm font-semibold flex items-center justify-between">
                    Market Order
                    <span className="text-xs font-normal text-muted-foreground">Available: ₹{cash.toLocaleString("en-IN")}</span>
                </h4>
                <div className="mt-4 flex flex-col gap-4">
                    <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Quantity (Units)</label>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setQty(Math.max(100, qty - 100))} disabled={qty <= 100}>-</Button>
                        <Input type="number" min={100} step={100} value={qty} onChange={(e) => setQty(Math.max(100, Number(e.target.value)))} className="bg-secondary text-center font-mono" />
                        <Button variant="outline" size="icon" onClick={() => setQty(qty + 100)}>+</Button>
                    </div>
                    </div>
                    <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Estimated Cost:</span>
                        <span className="font-mono font-bold">
                            ₹{activeQuote ? (activeQuote.price * inrRate * qty).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "..."}
                        </span>
                    </div>
                    </div>
                </div>
                <Button onClick={buy} className="mt-4 w-full h-12 text-md font-bold" disabled={!activeQuote || (activeQuote.price * qty) > cash}>
                    Buy {selectedSymbol}
                </Button>
                </div>

                {/* Holdings */}
                <div className="rounded-xl border border-border bg-card p-5 flex flex-col">
                    <h4 className="text-sm font-semibold mb-4">Current FX Holdings</h4>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {holdings.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground flex-col gap-2 opacity-50">
                            <Activity size={32} />
                            No active positions. <br/> Buy currencies to build your portfolio.
                        </div>
                    ) : (
                        holdings.map((h) => {
                            const currentPrice = livePrices[h.symbol]?.price || h.avgPrice;
                            // Value in USD converted to INR
                            const valueInr = currentPrice * inrRate * h.qty;
                            const investedInr = h.avgPrice * inrRate * h.qty;
                            const plInr = valueInr - investedInr;
                            const plPct = investedInr > 0 ? (plInr / investedInr) * 100 : 0;
                            const isPositive = plInr >= 0;

                            return (
                                <div key={h.symbol} className="flex items-center justify-between rounded-lg bg-secondary/30 border border-border/50 px-3 py-2.5 hover:bg-secondary/60 transition-colors">
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-mono text-sm font-bold">{h.symbol}</span>
                                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 rounded">{h.qty}</span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">Avg: ${h.avgPrice.toFixed(4)}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                    <div className="font-mono text-sm font-semibold">₹{valueInr.toLocaleString("en-IN", {maximumFractionDigits: 0})}</div>
                                    <div className={`text-[10px] font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
                                        {isPositive ? "+" : ""}₹{Math.abs(plInr).toFixed(0)} ({plPct.toFixed(1)}%)
                                    </div>
                                    </div>
                                    <Button size="icon" variant="destructive" className="h-7 w-7 opacity-80 hover:opacity-100" onClick={() => sell(h.symbol)} title="Sell Position">
                                        <span className="text-xs font-bold leading-none">S</span>
                                    </Button>
                                </div>
                                </div>
                            );
                        })
                    )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ForexSimulatorPage;
