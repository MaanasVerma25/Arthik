import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateBudgetRoadmap, AiBudgetRequest, AiBudgetResponse } from "@/lib/gemini";
import { toast } from "sonner";
import { BrainCircuit, Loader2, Target, ShieldAlert, Coins, AlertTriangle, TrendingUp, CheckCircle2, Activity } from "lucide-react";
import Chart from "react-apexcharts";
import { fetchCurrentUserProfile, saveRoadmapProfile } from "@/lib/supabaseService";

const AiBudgetingPage = () => {
  const [formData, setFormData] = useState<AiBudgetRequest>({
    age: 25,
    monthlyEarnings: 50000,
    fieldOfWork: "Software Engineer",
    expectedIncrementPct: 10,
    ambition: "Buy a 2BHK flat in Mumbai in 5 years"
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiBudgetResponse | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Pre-fill form from saved profile data
  useEffect(() => {
    fetchCurrentUserProfile().then(profile => {
      if (profile.id) {
        setUserId(profile.id);
        if (profile.financialAmbition) {
          setFormData(prev => ({ ...prev, ambition: profile.financialAmbition }));
        }
        if (profile.monthlySalary > 0) {
          setFormData(prev => ({ ...prev, monthlyEarnings: profile.monthlySalary }));
        }
        if (profile.fieldOfWork) {
          setFormData(prev => ({ ...prev, fieldOfWork: profile.fieldOfWork }));
        }
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const data = await generateBudgetRoadmap(formData);
      setResult(data);
      toast.success("AI Roadmap Generated Successfully!");

      // Save ambition, salary, and field of work to profile
      if (userId) {
        saveRoadmapProfile(userId, formData.ambition, formData.monthlyEarnings, formData.fieldOfWork);
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const pieSeries = result ? [
    result.portfolioSplit.equity,
    result.portfolioSplit.debt,
    result.portfolioSplit.gold,
    result.portfolioSplit.other
  ] : [];

  const pieOptions: any = {
    chart: { type: 'donut', background: 'transparent' },
    labels: ['Equity', 'Debt', 'Gold', 'Other/Cash'],
    theme: { mode: 'dark' },
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
    stroke: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: { show: true, color: 'hsl(216 18% 62%)' },
            value: { show: true, color: 'white', formatter: (val: string) => `${val}%` }
          }
        }
      }
    },
    legend: { show: false }
  };

  // Compute wealth projection: use Gemini data if available, otherwise calculate locally
  const getWealthProjection = () => {
    if (result?.wealthProjection && result.wealthProjection.length > 0) {
      return result.wealthProjection;
    }
    if (!result) return [];
    // Fallback: compute locally from savings data
    const monthlyInvestment = result.savingsBreakdown.ambition;
    const years = result.timeAnalysis.estimatedYears || 10;
    const annualReturn = 0.10; // 10% average
    const projection = [];
    let accumulated = 0;
    for (let y = 0; y <= Math.min(years, 40); y++) {
      projection.push({ age: formData.age + y, wealth: Math.round(accumulated) });
      accumulated = (accumulated + monthlyInvestment * 12) * (1 + annualReturn);
    }
    return projection;
  };

  const wealthData = getWealthProjection();

  const wealthChartOptions: any = {
    chart: { type: 'area', background: 'transparent', toolbar: { show: false }, animations: { enabled: true } },
    theme: { mode: 'dark' },
    colors: ['#3b82f6'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 100] } },
    stroke: { curve: 'smooth', width: 2.5 },
    grid: { borderColor: 'hsl(218 20% 18%)', strokeDashArray: 4 },
    xaxis: {
      categories: wealthData.map(p => `Age ${p.age}`),
      labels: { style: { colors: 'hsl(216 18% 62%)', fontSize: '10px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: 'hsl(216 18% 62%)', fontSize: '10px' },
        formatter: (val: number) => {
          if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
          if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
          if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
          return `₹${val}`;
        }
      }
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val: number) => `₹${val.toLocaleString('en-IN')}` }
    },
    dataLabels: { enabled: false }
  };

  const wealthChartSeries = [{
    name: 'Projected Wealth',
    data: wealthData.map(p => p.wealth)
  }];

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <div>
          <h1 className="font-display text-4xl flex items-center gap-3">
            AI Budget <span className="text-primary">&</span> Roadmap Builder
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Tell us your wildest financial ambitions, and our AI will run the compounding math to give you a brutal, realistic path to achieve it.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Form Side */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                Your Profile <BrainCircuit size={18} className="text-primary" />
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="bg-secondary"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Monthly Earnings (₹)</Label>
                  <Input
                    type="number"
                    value={formData.monthlyEarnings}
                    onChange={e => setFormData({ ...formData, monthlyEarnings: Number(e.target.value) })}
                    className="bg-secondary"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Field of Work</Label>
                  <Input
                    placeholder="e.g. Graphic Designer, Teacher"
                    value={formData.fieldOfWork}
                    onChange={e => setFormData({ ...formData, fieldOfWork: e.target.value })}
                    className="bg-secondary"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expected Yearly Salary Growth (%)</Label>
                  <Input
                    type="number"
                    value={formData.expectedIncrementPct}
                    onChange={e => setFormData({ ...formData, expectedIncrementPct: Number(e.target.value) })}
                    className="bg-secondary"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ultimate Financial Ambition</Label>
                  <Textarea
                    placeholder="e.g. Buy a flat in Burj Khalifa, or Retire at 45 with 5Cr."
                    value={formData.ambition}
                    onChange={e => setFormData({ ...formData, ambition: e.target.value })}
                    className="bg-secondary resize-none"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full h-12 text-md font-bold mt-2" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</>
                  ) : (
                    "Generate AI Roadmap"
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Results Side */}
          <div className="lg:col-span-8">
            {!result && !isLoading && (
              <div className="h-full min-h-[400px] rounded-xl border border-dashed border-border flex flex-col items-center justify-center p-8 text-center bg-card/50">
                <BrainCircuit size={64} className="text-primary/40 mb-4" />
                <h3 className="text-xl font-semibold">Awaiting Parameters</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Fill out your profile and ambition on the left. The AI will calculate your optimal savings rate, investment strategy, and a step-by-step roadmap to get there.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="h-full min-h-[400px] rounded-xl border border-border bg-card flex flex-col items-center justify-center p-8 animate-pulse">
                <Loader2 size={48} className="text-primary animate-spin mb-4" />
                <p className="text-lg font-medium">Running deeply compounded calculations...</p>
                <p className="text-sm text-muted-foreground mt-2">Analyzing market scenarios & industry trends</p>
              </div>
            )}

            {result && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Highlight Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10"><Target size={100} /></div>
                    <span className="text-sm font-medium text-primary flex items-center gap-2"><Target size={16} /> Target Ambition ETA</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      {result.timeAnalysis.achievable ? (
                        <>
                          <span className="text-4xl font-display font-bold">{result.timeAnalysis.estimatedYears}</span>
                          <span className="text-muted-foreground font-medium">Years</span>
                        </>
                      ) : (
                        <span className="text-2xl font-display font-bold text-destructive">Mathematically Unlikely</span>
                      )}
                    </div>
                  </div>

                  <div className={`rounded-xl border p-5 relative overflow-hidden ${result.stressMeter.score >= 8 ? 'border-destructive/30 bg-destructive/10 text-destructive' :
                    result.stressMeter.score >= 5 ? 'border-warning/30 bg-warning/10 text-warning' :
                      'border-success/30 bg-success/10 text-success'
                    }`}>
                    <div className="absolute -right-4 -top-4 opacity-10"><AlertTriangle size={100} /></div>
                    <span className="text-sm font-medium flex items-center gap-2"><Activity size={16} /> Stress & Difficulty Meter</span>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-4xl font-display font-bold">{result.stressMeter.score}<span className="text-xl opacity-50">/10</span></span>
                      <span className="font-semibold text-lg">{result.stressMeter.label}</span>
                    </div>
                    <p className="text-xs mt-2 opacity-80 leading-relaxed max-w-[90%]">
                      {result.stressMeter.explanation}
                    </p>
                  </div>
                </div>

                {/* Savings Breakdown */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    Required Monthly Savings Split <Coins size={18} className="text-primary" />
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div>
                          <p className="font-medium">Direct Goal Savings</p>
                          <p className="text-xs text-muted-foreground">For your specific ambition</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold">₹{result.savingsBreakdown.ambition.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-warning" />
                        <div>
                          <p className="font-medium">Emergency Fund</p>
                          <p className="text-xs text-muted-foreground">Absolute necessity before investing</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold">₹{result.savingsBreakdown.emergencyFund.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <div>
                          <p className="font-medium">Misc & Living</p>
                          <p className="text-xs text-muted-foreground">To avoid burning out</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold">₹{result.savingsBreakdown.miscellaneous.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Portfolio & Roadmap */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Chart */}
                  <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      Portfolio Allocation <TrendingUp size={18} className="text-primary" />
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">Risk-adjusted for age {formData.age}</p>
                    <div className="flex items-center justify-center min-h-[180px] mb-4">
                      <Chart options={pieOptions} series={pieSeries} type="donut" width="100%" height={200} />
                    </div>
                    {/* ₹ Amount Breakdown */}
                    <div className="space-y-2 border-t border-border pt-4">
                      {[
                        { label: 'Stocks / Equity', pct: result.portfolioSplit.equity, amt: result.portfolioAmounts?.equity, color: '#3b82f6' },
                        { label: 'Bonds / Debt', pct: result.portfolioSplit.debt, amt: result.portfolioAmounts?.debt, color: '#10b981' },
                        { label: 'Gold / SGBs', pct: result.portfolioSplit.gold, amt: result.portfolioAmounts?.gold, color: '#f59e0b' },
                        { label: 'Cash / Liquid', pct: result.portfolioSplit.other, amt: result.portfolioAmounts?.other, color: '#8b5cf6' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-muted-foreground">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-muted-foreground">{item.pct}%</span>
                            <span className="font-mono font-bold">₹{(item.amt || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                        <span className="font-medium">Total Monthly Investment</span>
                        <span className="font-mono font-bold text-primary">₹{((result.portfolioAmounts?.equity || 0) + (result.portfolioAmounts?.debt || 0) + (result.portfolioAmounts?.gold || 0) + (result.portfolioAmounts?.other || 0)).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Roadmap Timeline */}
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      Execution Roadmap <ShieldAlert size={18} className="text-primary" />
                    </h3>
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent pt-2">
                      {result.roadmap.map((step, idx) => (
                        <div key={idx} className="relative flex items-start gap-4">
                          <div className="rounded-full bg-primary/20 border-2 border-primary w-10 h-10 flex items-center justify-center font-bold text-xs shrink-0 z-10">
                            Y{step.year}
                          </div>
                          <div className="bg-secondary/30 rounded-lg p-3 w-full border border-border/50">
                            <h4 className="font-bold text-sm text-primary mb-1">{step.milestone}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">{step.actionableAdvice}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Wealth Projection Graph */}
                {wealthData.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                      Wealth Growth Projection <TrendingUp size={18} className="text-primary" />
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">Estimated portfolio value at each age until your goal is achieved</p>
                    <div className="h-[280px]">
                      <Chart options={wealthChartOptions} series={wealthChartSeries} type="area" height="100%" width="100%" />
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default AiBudgetingPage;
