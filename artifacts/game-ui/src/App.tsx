import { Switch, Route, Router as WouterRouter, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Leaderboard from "@/pages/leaderboard";

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 sm:p-8">
      <header className="w-full max-w-2xl flex justify-between items-center mb-8 border-b-2 border-border pb-4">
        <h1 className="text-2xl font-bold arcade-text-glow text-primary flicker">GUESS.THE.NUM</h1>
        <nav className="flex gap-4">
          <Link href="/" className="hover:text-primary transition-colors uppercase tracking-widest text-sm" data-testid="link-home">
            Play
          </Link>
          <Link href="/leaderboard" className="hover:text-primary transition-colors uppercase tracking-widest text-sm" data-testid="link-leaderboard">
            Scores
          </Link>
        </nav>
      </header>
      <main className="w-full max-w-2xl flex-1 flex flex-col">
        {children}
      </main>
      <footer className="mt-12 text-xs text-muted-foreground uppercase tracking-widest">
        Insert Coin to Continue
      </footer>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
