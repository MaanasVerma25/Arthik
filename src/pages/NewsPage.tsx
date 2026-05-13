import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { fetchMarketNews, NewsItem } from "@/lib/newsApi";
import { ExternalLink, Newspaper, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const NewsPage = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNews = async () => {
    setLoading(true);
    const data = await fetchMarketNews();
    setNews(data);
    setLoading(false);
  };

  useEffect(() => {
    loadNews();
  }, []);

  const timeSince = (dateString: string) => {
    const date = new Date(dateString.replace(' ', 'T') + 'Z');
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl flex items-center gap-3">
              Market News
            </h1>
            <p className="mt-1 text-muted-foreground">
              Stay informed with the latest financial news and market updates.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadNews} disabled={loading}>
            <RefreshCw size={14} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-card overflow-hidden">
                <div className="h-48 bg-secondary/50" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-secondary/50 rounded w-3/4" />
                  <div className="h-4 bg-secondary/50 rounded w-full" />
                  <div className="h-4 bg-secondary/50 rounded w-5/6" />
                  <div className="h-3 bg-secondary/50 rounded w-1/4 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-border bg-card">
            <Newspaper size={48} className="text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-bold">No news available</h3>
            <p className="text-sm text-muted-foreground mt-1">We couldn't fetch the latest market updates right now. Please try again later.</p>
            <Button className="mt-4" onClick={loadNews}>Retry</Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                key={item.guid}
                className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
              >
                {/* Thumbnail Header */}
                <div className="relative h-48 w-full bg-secondary overflow-hidden">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop';
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-background">
                      <Newspaper size={40} className="text-primary/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="flex items-center gap-2 text-xs font-bold text-white bg-primary/80 px-2 py-1 rounded backdrop-blur-sm">
                      Read Article <ExternalLink size={12} />
                    </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="flex flex-col flex-1 p-5">
                  <h3 className="font-bold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                    {item.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground pt-4 border-t border-border/50">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {timeSince(item.pubDate)}
                    </span>
                    <span className="uppercase tracking-wider text-[10px] bg-secondary px-2 py-0.5 rounded text-foreground">
                      Yahoo Finance
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default NewsPage;
