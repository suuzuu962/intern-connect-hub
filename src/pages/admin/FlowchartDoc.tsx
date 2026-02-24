import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Printer, ArrowLeft, GitBranch, ArrowDown, ArrowRight, 
  Building2, School, Users, GraduationCap, Briefcase, 
  FileText, Shield, CheckCircle, XCircle, Clock, 
  LogIn, UserPlus, Settings, Bell, Database,
  Eye, Edit, Star, BookOpen, RefreshCw, Loader2,
  Globe, Server, CreditCard, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  scanPlatformFeatures, 
  type ScanResult, 
  type ScanPhase, 
  type FlowchartData, 
  type FlowNodeData,
  SCAN_PHASES 
} from '@/lib/platform-feature-scanner';

// Icon resolver
const iconMap: Record<string, React.ReactNode> = {
  LogIn: <LogIn className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  Database: <Database className="h-4 w-4" />,
  CheckCircle: <CheckCircle className="h-4 w-4" />,
  XCircle: <XCircle className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  Eye: <Eye className="h-4 w-4" />,
  Edit: <Edit className="h-4 w-4" />,
  Star: <Star className="h-4 w-4" />,
  Building2: <Building2 className="h-4 w-4" />,
  School: <School className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  GraduationCap: <GraduationCap className="h-4 w-4" />,
  Briefcase: <Briefcase className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
  Bell: <Bell className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  UserPlus: <UserPlus className="h-4 w-4" />,
  GitBranch: <GitBranch className="h-4 w-4" />,
  Globe: <Globe className="h-4 w-4" />,
  Server: <Server className="h-4 w-4" />,
  CreditCard: <CreditCard className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
};

const phaseIconMap: Record<string, React.ReactNode> = {
  GitBranch: <GitBranch className="h-5 w-5" />,
  Database: <Database className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
};

// ─── Flow building blocks ───

const nodeVariants = {
  default: 'bg-card border-border',
  start: 'bg-primary/10 border-primary/30',
  success: 'bg-green-500/10 border-green-500/30',
  warning: 'bg-amber-500/10 border-amber-500/30',
  danger: 'bg-destructive/10 border-destructive/30',
  process: 'bg-blue-500/10 border-blue-500/30',
  decision: 'bg-purple-500/10 border-purple-500/30',
};

const nodeIconVariants = {
  default: 'bg-muted text-muted-foreground',
  start: 'bg-primary/20 text-primary',
  success: 'bg-green-500/20 text-green-600 dark:text-green-400',
  warning: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  danger: 'bg-destructive/20 text-destructive',
  process: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  decision: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
};

const FlowNodeEl = ({ data, index }: { data: FlowNodeData; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay: index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    className={`flex items-center gap-2.5 p-3 rounded-lg border min-w-[160px] ${nodeVariants[data.variant]}`}
  >
    <div className={`p-1.5 rounded-full shrink-0 ${nodeIconVariants[data.variant]}`}>
      {iconMap[data.icon] || <Zap className="h-4 w-4" />}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium leading-tight">{data.label}</p>
      {data.sublabel && <p className="text-xs text-muted-foreground leading-tight">{data.sublabel}</p>}
    </div>
  </motion.div>
);

const FlowArrowEl = ({ direction = 'down', delay: d = 0 }: { direction?: 'right' | 'down'; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: d, duration: 0.3 }}
    className="flex items-center justify-center py-0.5"
  >
    {direction === 'right' ? (
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    ) : (
      <ArrowDown className="h-4 w-4 text-muted-foreground" />
    )}
  </motion.div>
);

// ─── Dynamic flowchart renderer ───

const DynamicFlowchart = ({ chart, index }: { chart: FlowchartData; index: number }) => {
  const isHorizontal = chart.id === 'application-status';

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mb-10 break-inside-avoid"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs capitalize">{chart.category}</Badge>
          <h2 className="text-lg font-bold text-foreground">{chart.title}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{chart.subtitle}</p>
      </div>

      <Card className="p-5 overflow-x-auto">
        <CardContent className="p-0">
          <div className={`flex ${isHorizontal ? 'flex-wrap items-center gap-2' : 'flex-col items-center gap-1'}`}>
            {chart.nodes.map((node, i) => (
              <div key={node.id} className={`flex ${isHorizontal ? 'items-center gap-2' : 'flex-col items-center gap-1'}`}>
                {i > 0 && <FlowArrowEl direction={isHorizontal ? 'right' : 'down'} delay={i * 0.08} />}
                <FlowNodeEl data={node} index={i} />
              </div>
            ))}

            {/* Branches */}
            {chart.branches?.map((branch, bi) => (
              <div key={bi} className="flex flex-col items-center gap-1 w-full">
                <FlowArrowEl direction="down" delay={chart.nodes.length * 0.08} />
                <div className="flex flex-col sm:flex-row gap-4 items-start justify-center w-full">
                  {branch.paths.map((path, pi) => (
                    <div key={pi} className="flex flex-col items-center gap-1 flex-1">
                      {path.map((node, ni) => (
                        <div key={node.id} className="flex flex-col items-center gap-1">
                          {ni > 0 && <FlowArrowEl direction="down" delay={(chart.nodes.length + ni) * 0.08} />}
                          <FlowNodeEl data={node} index={chart.nodes.length + bi + ni + pi} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
};

// ─── Scanning overlay ───

const ScanningOverlay = ({ phase, progress }: { phase: ScanPhase; progress: number }) => {
  const currentPhaseInfo = SCAN_PHASES.find(p => p.phase === phase);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4"
      >
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-flex p-4 rounded-full bg-primary/10 mb-4"
          >
            <RefreshCw className="h-8 w-8 text-primary" />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground">Scanning Platform</h2>
          <p className="text-sm text-muted-foreground mt-1">Detecting features & generating flowcharts</p>
        </div>

        <Progress value={progress} className="mb-4 h-2" />

        <div className="space-y-2">
          {SCAN_PHASES.map((p, i) => {
            const isActive = p.phase === phase;
            const isDone = SCAN_PHASES.indexOf(p) < SCAN_PHASES.findIndex(sp => sp.phase === phase);

            return (
              <motion.div
                key={p.phase}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-primary/10 text-primary font-medium' : 
                  isDone ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                }`}
              >
                {isDone ? (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                )}
                <span>{p.label}</span>
                {isDone && <span className="ml-auto text-xs">✓</span>}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Stats summary ───

const ScanStats = ({ result }: { result: ScanResult }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8"
  >
    {[
      { label: 'Routes', value: result.routes.length, icon: <GitBranch className="h-4 w-4" /> },
      { label: 'Tables', value: result.tables.length, icon: <Database className="h-4 w-4" /> },
      { label: 'Edge Functions', value: result.edgeFunctions.length, icon: <Server className="h-4 w-4" /> },
      { label: 'Roles', value: result.roles.length, icon: <Users className="h-4 w-4" /> },
      { label: 'Flowcharts', value: result.flowcharts.length, icon: <GitBranch className="h-4 w-4" /> },
    ].map((stat, i) => (
      <motion.div
        key={stat.label}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.1, duration: 0.4 }}
        className="bg-card border border-border rounded-xl p-4 text-center"
      >
        <div className="flex justify-center mb-2 text-primary">{stat.icon}</div>
        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
        <p className="text-xs text-muted-foreground">{stat.label}</p>
      </motion.div>
    ))}
  </motion.div>
);

// ─── Category filter ───

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'auth', label: 'Authentication' },
  { key: 'workflow', label: 'Workflows' },
  { key: 'lifecycle', label: 'Lifecycle' },
  { key: 'system', label: 'System' },
  { key: 'data', label: 'Data' },
];

// ─── Main component ───

const FlowchartDoc = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    setScanResult(null);
    setActiveCategory('all');

    const result = await scanPlatformFeatures((phase, prog) => {
      setScanPhase(phase);
      setProgress(prog);
    });

    setScanResult(result);
    setIsScanning(false);
    setScanPhase('idle');
  }, []);

  const handlePrint = () => window.print();

  const filteredFlowcharts = scanResult?.flowcharts.filter(
    f => activeCategory === 'all' || f.category === activeCategory
  ) || [];

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Scanning Overlay */}
      <AnimatePresence>
        {isScanning && <ScanningOverlay phase={scanPhase} progress={progress} />}
      </AnimatePresence>

      {/* Header */}
      <div className="print:hidden sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Platform Flowchart Documentation</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleScan} 
            disabled={isScanning}
            variant="default"
            className="gap-2"
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {scanResult ? 'Re-scan & Update' : 'Scan & Generate'}
          </Button>
          {scanResult && (
            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-57px)] print:h-auto">
        <div className="max-w-5xl mx-auto px-8 py-10 print:px-0 print:py-4">

          {/* Empty state */}
          {!scanResult && !isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="p-6 rounded-full bg-primary/10 mb-6">
                <GitBranch className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Platform Flowchart Generator</h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Click the button below to scan all platform features, routes, database tables, 
                and workflows — then generate live flowcharts automatically.
              </p>
              <Button size="lg" onClick={handleScan} className="gap-2 text-base px-8">
                <Zap className="h-5 w-5" />
                Scan & Generate Flowcharts
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Scans routes, tables, edge functions, roles, enums, and generates visual flowcharts
              </p>
            </motion.div>
          )}

          {/* Results */}
          {scanResult && (
            <>
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8 print:mb-6"
              >
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground print:text-black mb-2">
                  Platform Flowchart Documentation
                </h1>
                <p className="text-lg text-muted-foreground">Visual Process & Workflow Reference</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Generated on {new Date(scanResult.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  <span className="ml-2">• Scan took {(scanResult.scanDuration / 1000).toFixed(1)}s</span>
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Badge variant="secondary"><span className="inline-block w-2 h-2 rounded-full bg-primary mr-1.5" />Start</Badge>
                  <Badge variant="secondary"><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5" />Process</Badge>
                  <Badge variant="secondary"><span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1.5" />Decision</Badge>
                  <Badge variant="secondary"><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5" />Edge Function</Badge>
                  <Badge variant="secondary"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />Success</Badge>
                  <Badge variant="secondary"><span className="inline-block w-2 h-2 rounded-full bg-destructive mr-1.5" />Error</Badge>
                </div>
              </motion.div>

              {/* Stats */}
              <ScanStats result={scanResult} />

              <Separator className="mb-6" />

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-8 print:hidden">
                {CATEGORIES.map(cat => (
                  <Button
                    key={cat.key}
                    variant={activeCategory === cat.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory(cat.key)}
                    className="text-xs"
                  >
                    {cat.label}
                    {cat.key !== 'all' && (
                      <Badge variant="secondary" className="ml-1.5 text-xs px-1.5">
                        {scanResult.flowcharts.filter(f => f.category === cat.key).length}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>

              {/* Flowcharts */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {filteredFlowcharts.map((chart, i) => (
                    <DynamicFlowchart key={chart.id} chart={chart} index={i} />
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Scanned Details */}
              <Separator className="my-8" />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-lg font-bold mb-4">Scan Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Tables detected */}
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Database className="h-4 w-4 text-primary" />
                      Database Tables ({scanResult.tables.length})
                    </h3>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {scanResult.tables.map(t => (
                        <div key={t.name} className="flex items-center justify-between text-xs">
                          <code className="text-primary">{t.name}</code>
                          <span className="text-muted-foreground">{t.columns} cols</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Routes detected */}
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Routes ({scanResult.routes.length})
                    </h3>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {scanResult.routes.map(r => (
                        <div key={r.path} className="flex items-center justify-between text-xs">
                          <code>{r.path}</code>
                          <Badge variant={r.type === 'protected' ? 'default' : 'outline'} className="text-[10px] px-1.5">
                            {r.type}{r.role ? ` (${r.role})` : ''}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Edge Functions */}
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Server className="h-4 w-4 text-primary" />
                      Edge Functions ({scanResult.edgeFunctions.length})
                    </h3>
                    <div className="space-y-2">
                      {scanResult.edgeFunctions.map(f => (
                        <div key={f.name}>
                          <code className="text-xs text-primary font-bold">{f.name}</code>
                          <p className="text-xs text-muted-foreground">{f.purpose}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Enums */}
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-primary" />
                      Enums ({scanResult.enums.length})
                    </h3>
                    <div className="space-y-2">
                      {scanResult.enums.map(e => (
                        <div key={e.name}>
                          <code className="text-xs font-bold">{e.name}</code>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {e.values.map(v => <Badge key={v} variant="outline" className="text-[10px]">{v}</Badge>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </motion.div>

              {/* Footer */}
              <Separator className="my-6" />
              <div className="text-center text-xs text-muted-foreground pb-8">
                <p>Internship Management Portal — Flowchart Documentation</p>
                <p>Generated {scanResult.timestamp}</p>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FlowchartDoc;
