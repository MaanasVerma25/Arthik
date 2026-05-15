import { motion } from "framer-motion";
import { Wallet, LineChart, Coins, Sparkles, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const pillars = [
  { 
    icon: Wallet, 
    title: "AI Budgeting", 
    description: "Intelligent expense tracking and financial planning powered by Gemini AI. Get personalized advice for your spending habits.",
    link: "/budgeting"
  },
  { 
    icon: LineChart, 
    title: "Stock Simulation", 
    description: "Real-time stock market simulation with live data. Practice investing without risking your hard-earned capital.",
    link: "/games/stock-simulator"
  },
  { 
    icon: Globe, 
    title: "Forex Trading", 
    description: "Trade major currency pairs with real-time Twelve Data quotes and test your international strategies globally.",
    link: "/games/forex-simulator"
  },
  { 
    icon: Coins, 
    title: "Crypto Markets", 
    description: "Live cryptocurrency prices and market performance from Binance. Track top assets in real-time.",
    link: "/crypto"
  },
  { 
    icon: Sparkles, 
    title: "Tailored Insights", 
    description: "Financial insights and market analysis tailored for the Indian context to help you grow your wealth effectively.",
    link: "/news"
  },

];

const PillarsSection = () => (
  <section className="border-t border-border py-20">
    <div className="container mx-auto px-4">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center font-display text-3xl sm:text-4xl"
      >
        The Pillars of <span className="text-gold-gradient">Arthik</span>
      </motion.h2>
      <div className="mt-12 grid gap-px rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5 overflow-hidden">
        {pillars.map((p, i) => (
          <Link to={p.link} key={p.title} className="block group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex h-full flex-col items-center bg-card p-8 text-center transition-colors group-hover:bg-card/60"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <p.icon size={24} />
              </div>
              <h3 className="mt-4 font-display text-xl group-hover:text-gold-gradient">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default PillarsSection;
