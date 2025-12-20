import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center p-1.5">
              <Image src="/logo.svg" alt="Agent AI Logo" width={32} height={32} className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight">Agent AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#workflows" className="text-muted-foreground hover:text-foreground transition-colors">
              Workflows
            </Link>
            <Link href="#integrations" className="text-muted-foreground hover:text-foreground transition-colors">
              Integrations
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-50" />
          <div className="container mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-8 border border-primary/20 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              v1.0 is now live
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">
              Build Powerful <br />
              <span className="text-primary">AI Agents</span> Visually
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Orchestrate complex workflows with LLMs, custom tools, and integrations.
              The open-source standard for agentic automation that puts you in control.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="h-12 px-8 rounded-full bg-primary text-primary-foreground text-base font-semibold flex items-center justify-center hover:opacity-90 transition-all shadow-[0_0_20px_-5px_var(--color-primary)] hover:shadow-[0_0_30px_-5px_var(--color-primary)]"
              >
                Start Building Free
              </Link>
              <Link
                href="https://github.com/VANSH3104/Agent_ai"
                target="_blank"
                className="h-12 px-8 rounded-full border border-border bg-card text-card-foreground text-base font-medium flex items-center justify-center hover:border-foreground/20 hover:bg-accent/50 transition-all"
              >
                View on GitHub
              </Link>
            </div>

            {/* Visual Preview */}
            <div className="mt-20 relative max-w-5xl mx-auto rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden aspect-[16/9] group">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
              {/* Mockup UI Elements */}
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
              <div className="absolute top-12 left-0 right-0 bottom-0 p-8 grid grid-cols-3 gap-8 opacity-50 group-hover:opacity-100 transition-opacity duration-700">
                {/* Abstract Node Representation */}
                <div className="col-span-1 space-y-4 pt-10">
                  <div className="h-32 rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col justify-between relative transform hover:-translate-y-1 transition-transform">
                    <div className="w-8 h-8 rounded bg-primary/20 mb-2" />
                    <div className="space-y-2">
                      <div className="h-2 w-20 bg-primary/20 rounded" />
                      <div className="h-2 w-12 bg-primary/20 rounded" />
                    </div>
                    <div className="absolute -right-4 top-1/2 w-4 h-0.5 bg-primary/30" />
                  </div>
                </div>
                <div className="col-span-1 space-y-4 pt-24">
                  <div className="h-32 rounded-lg border border-chart-1/30 bg-chart-1/5 p-4 flex flex-col justify-between relative transform hover:-translate-y-1 transition-transform">
                    <div className="w-8 h-8 rounded bg-chart-1/20 mb-2" />
                    <div className="space-y-2">
                      <div className="h-2 w-20 bg-chart-1/20 rounded" />
                      <div className="h-2 w-12 bg-chart-1/20 rounded" />
                    </div>
                    <div className="absolute -right-4 top-1/2 w-4 h-0.5 bg-chart-1/30" />
                    <div className="absolute -left-4 top-1/2 w-4 h-0.5 bg-chart-1/30" />
                  </div>
                </div>
                <div className="col-span-1 space-y-4">
                  <div className="h-32 rounded-lg border border-chart-2/30 bg-chart-2/5 p-4 flex flex-col justify-between relative transform hover:-translate-y-1 transition-transform">
                    <div className="w-8 h-8 rounded bg-chart-2/20 mb-2" />
                    <div className="space-y-2">
                      <div className="h-2 w-20 bg-chart-2/20 rounded" />
                      <div className="h-2 w-12 bg-chart-2/20 rounded" />
                    </div>
                    <div className="absolute -left-4 top-1/2 w-4 h-0.5 bg-chart-2/30" />
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="px-6 py-3 rounded-full bg-background/80 backdrop-blur border border-white/10 text-sm font-medium">
                  Interative Workflow Builder
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-secondary/30">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything you need to build agents</h2>
              <p className="text-muted-foreground">
                From simple text chains to complex autonomous agents, Agent AI provides the building blocks for the next generation of automation.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Visual Workflow Editor",
                  description: "Drag-and-drop interface to design your agent's logic without writing boilerplate code.",
                  icon: (
                    <svg className="w-6 h-6 text-chart-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM16 13a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2zM4 21a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z" />
                    </svg>
                  )
                },
                {
                  title: "AI Native",
                  description: "Built-in support for OpenAI, Anthropic, and Local LLMs with first-class prompt management.",
                  icon: (
                    <svg className="w-6 h-6 text-chart-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )
                },
                {
                  title: "Secure Execution",
                  description: "Enterprise-grade security with sandboxed execution environments for your agents.",
                  icon: (
                    <svg className="w-6 h-6 text-chart-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors group">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5" />
          <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to automate the future?</h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of developers building the next generation of AI-powered applications.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex h-12 px-8 rounded-full bg-primary text-primary-foreground text-base font-semibold items-center justify-center hover:opacity-90 transition-all"
            >
              Get Started for Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center p-1">
                  <Image src="/logo.svg" alt="Logo" width={24} height={24} className="w-full h-full object-contain" />
                </div>
                <span className="font-bold">Agent AI</span>
              </div>
              <p className="text-muted-foreground max-w-xs">
                The open-source visual platform for building LLM-powered agents and workflows.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground">Integrations</Link></li>
                <li><Link href="#" className="hover:text-foreground">Templates</Link></li>
                <li><Link href="#" className="hover:text-foreground">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground">API Reference</Link></li>
                <li><Link href="#" className="hover:text-foreground">Community</Link></li>
                <li><Link href="#" className="hover:text-foreground">GitHub</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border text-sm text-muted-foreground">
            <p>© 2024 Agent AI. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
              <Link href="#" className="hover:text-foreground">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

