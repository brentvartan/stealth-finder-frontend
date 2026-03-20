import React, { useState } from 'react';
import { items, scans } from '../api/client';
import { Play, RefreshCw, CheckCircle, AlertCircle, Award, Camera, ShoppingBag, Building2, Globe, Linkedin } from 'lucide-react';
import { CONSUMER_CATEGORIES } from './Dashboard';

// ─── Signal score boosts by type ──────────────────────────────────────────────
const SCORE_BOOSTS = {
  trademark: 15, delaware: 5, domain: 3, instagram: 8, shopify: 10, social: 2,
};

// ─── Simulated generators for sources we don't yet have live APIs for ─────────

function getDelawareData(daysBack) {
  const companies = [
    { name: 'GetHealthy Inc',           category: 'Health/Wellness'  },
    { name: 'TryFit Labs',              category: 'Fitness'          },
    { name: 'FoodHub Corporation',      category: 'CPG/Food/Drink'   },
    { name: 'FinFlow Inc',              category: 'Finance'          },
    { name: 'LearnAI Inc',              category: 'Education'        },
    { name: 'StyleMatch Inc',           category: 'Apparel'          },
    { name: 'HomeDash LLC',             category: 'Home/Lifestyle'   },
    { name: 'BeautyBoss Inc',           category: 'Beauty'           },
    { name: 'GlowAI Labs',              category: 'Consumer AI'      },
    { name: 'ActiveWear Corporation',   category: 'Apparel'          },
    { name: 'PlayTime Inc',             category: 'Sports'           },
    { name: 'WellnessPath Corporation', category: 'Health/Wellness'  },
  ];
  const count = Math.min(8 + Math.floor(daysBack / 10), companies.length);
  const today = new Date();
  return companies.slice(0, count).map((c, i) => {
    const daysAgo = Math.floor(Math.random() * daysBack);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    return { ...c, filing_date: date.toISOString(), entity_type: i % 2 === 0 ? 'Corporation' : 'LLC' };
  });
}

function getDomainData(daysBack) {
  const domains = [
    { name: 'gethealthy.com',    category: 'Health/Wellness' },
    { name: 'tryfit.io',         category: 'Fitness'         },
    { name: 'foodhub.com',       category: 'CPG/Food/Drink'  },
    { name: 'finflow.app',       category: 'Finance'         },
    { name: 'learnai.com',       category: 'Education'       },
    { name: 'stylematch.io',     category: 'Apparel'         },
    { name: 'homedash.app',      category: 'Home/Lifestyle'  },
    { name: 'beautyboss.com',    category: 'Beauty'          },
    { name: 'glowai.ai',         category: 'Consumer AI'     },
    { name: 'activeware.shop',   category: 'Apparel'         },
    { name: 'playtime.com',      category: 'Sports'          },
    { name: 'wellnesshq.com',    category: 'Health/Wellness' },
  ];
  const today = new Date();
  return domains.map(d => {
    const daysAgo = Math.floor(Math.random() * daysBack);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    return { ...d, registered_date: date.toISOString() };
  });
}

function getInstagramData() {
  const handles = [
    { handle: 'gethealthy',   category: 'Health/Wellness' },
    { handle: 'tryfit',       category: 'Fitness'         },
    { handle: 'foodhub',      category: 'CPG/Food/Drink'  },
    { handle: 'finflow',      category: 'Finance'         },
    { handle: 'learnai',      category: 'Education'       },
    { handle: 'stylematch',   category: 'Apparel'         },
    { handle: 'beautyboss',   category: 'Beauty'          },
    { handle: 'glowai',       category: 'Consumer AI'     },
    { handle: 'activeware',   category: 'Apparel'         },
    { handle: 'playtime',     category: 'Sports'          },
  ];
  const today = new Date();
  return handles.map(h => {
    const daysAgo = Math.floor(Math.random() * 60);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    return { ...h, created_date: date.toISOString(), followers: Math.floor(Math.random() * 50) };
  });
}

function getShopifyData() {
  const stores = [
    { name: 'GetHealthy',  domain: 'gethealthy.myshopify.com',  category: 'Health/Wellness' },
    { name: 'TryFit',      domain: 'tryfit.myshopify.com',       category: 'Fitness'         },
    { name: 'FoodHub',     domain: 'foodhub.myshopify.com',      category: 'CPG/Food/Drink'  },
    { name: 'StyleMatch',  domain: 'stylematch.myshopify.com',   category: 'Apparel'         },
    { name: 'BeautyBoss',  domain: 'beautyboss.myshopify.com',   category: 'Beauty'          },
    { name: 'ActiveWear',  domain: 'activeware.myshopify.com',   category: 'Apparel'         },
    { name: 'HomeDash',    domain: 'homedash.myshopify.com',     category: 'Home/Lifestyle'  },
  ];
  const today = new Date();
  return stores.map(s => {
    const daysAgo = Math.floor(Math.random() * 45);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    return { ...s, created_date: date.toISOString(), products: 0 };
  });
}

function getSocialData() {
  const posts = [
    { company: 'GetHealthy',  category: 'Health/Wellness', founder: 'Sarah Chen'     },
    { company: 'TryFit',      category: 'Fitness',         founder: 'Mike Rodriguez'  },
    { company: 'FoodHub',     category: 'CPG/Food/Drink',  founder: 'Lisa Park'       },
    { company: 'BeautyBoss',  category: 'Beauty',          founder: 'Maya Patel'      },
    { company: 'GlowAI',      category: 'Consumer AI',     founder: 'Chris Lee'       },
    { company: 'StyleMatch',  category: 'Apparel',         founder: 'Sophie Turner'   },
    { company: 'PlayTime',    category: 'Sports',          founder: 'Tom Harris'      },
  ];
  const today = new Date();
  return posts.map(p => {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    return { ...p, created_at: date.toISOString(), text: `Building something new in ${p.category}. In stealth mode! 🚀` };
  });
}

// ─── Convert simulated raw results → signal records ───────────────────────────

function rawToSignals(results, type) {
  return results.map(r => {
    let companyName, description, url, timestamp;

    switch (type) {
      case 'delaware':
        companyName = r.name.replace(/\s+(Inc|LLC|Corporation|Corp|Labs)\.?$/i, '').trim();
        description = `${r.name} — ${r.entity_type} — Filed ${new Date(r.filing_date).toLocaleDateString()}`;
        url = 'https://icis.corp.delaware.gov/';
        timestamp = r.filing_date;
        break;
      case 'domain':
        companyName = r.name.split('.')[0];
        description = `${r.name} — registered ${new Date(r.registered_date).toLocaleDateString()}`;
        url = `https://${r.name}`;
        timestamp = r.registered_date;
        break;
      case 'instagram':
        companyName = r.handle;
        description = `@${r.handle} — ${r.followers} followers — new account`;
        url = `https://instagram.com/${r.handle}`;
        timestamp = r.created_date;
        break;
      case 'shopify':
        companyName = r.name;
        description = `${r.domain} — ${r.products} products — new Shopify store`;
        url = `https://${r.domain}`;
        timestamp = r.created_date;
        break;
      case 'social':
        companyName = r.company;
        description = `${r.founder}: "${r.text}"`;
        url = '#';
        timestamp = r.created_at;
        break;
      default:
        return null;
    }

    return { companyName, signal_type: type, category: r.category, description, url, timestamp };
  }).filter(Boolean);
}

// ─── Main RunScan component ───────────────────────────────────────────────────

const SCAN_TYPES = [
  { value: 'full',       label: '🔥 Full Scan (All Sources)' },
  { value: 'trademark',  label: '🏆 USPTO Trademarks Only'   },
  { value: 'delaware',   label: '🏛️ Delaware Filings Only'   },
  { value: 'instagram',  label: '📸 Instagram Handles Only'  },
  { value: 'shopify',    label: '🛍️ Shopify Stores Only'     },
  { value: 'domain',     label: '🌐 Domains Only'            },
  { value: 'social',     label: '💬 Social Media Only'       },
];

const SOURCES = [
  { icon: Award,       label: 'USPTO Trademarks',    desc: 'Live data — real filings from the last N days',         color: 'text-purple-600 bg-purple-50',  badge: '🟢 Live' },
  { icon: Camera,      label: 'Instagram Handles',   desc: 'Consumer brands secure @handle before website',         color: 'text-pink-600 bg-pink-50',      badge: '🔵 Simulated' },
  { icon: ShoppingBag, label: 'Shopify Stores',      desc: 'New DTC stores with 0 products = stealth',             color: 'text-emerald-600 bg-emerald-50', badge: '🔵 Simulated' },
  { icon: Building2,   label: 'Delaware Filings',    desc: 'Traditional incorporation tracking',                    color: 'text-blue-600 bg-blue-50',      badge: '🔵 Simulated' },
  { icon: Globe,       label: 'Domain Registration', desc: 'Recently registered URLs',                              color: 'text-green-600 bg-green-50',    badge: '🔵 Simulated' },
  { icon: Linkedin,    label: 'Social Media',        desc: 'Founders announcing stealth mode',                      color: 'text-indigo-600 bg-indigo-50',  badge: '🔵 Simulated' },
];

export default function RunScan() {
  const [scanType, setScanType] = useState('full');
  const [daysBack, setDaysBack] = useState(30);
  const [status, setStatus] = useState(null);
  const [scanning, setScanning] = useState(false);

  const runScan = async () => {
    setScanning(true);
    setStatus({ phase: 'init', progress: 0, message: 'Starting scan...', done: false, error: false, saved: 0 });

    let totalSaved = 0;

    // ── Helper: save a batch of signals to the backend ──────────────────────
    const saveSignals = async (signalList) => {
      const promises = signalList.map(sig =>
        items.create(sig.companyName, JSON.stringify({
          _type:        'signal',
          company_name: sig.companyName,
          signal_type:  sig.signal_type,
          category:     sig.category,
          score_boost:  SCORE_BOOSTS[sig.signal_type] || 5,
          description:  sig.description,
          url:          sig.url,
          notes:        sig.notes || '',
          timestamp:    sig.timestamp,
        })).catch(() => null)
      );
      const results = await Promise.all(promises);
      return results.filter(Boolean).length;
    };

    try {
      // ── Step 1: USPTO Trademarks (live data, saved with dedup on backend) ──
      if (scanType === 'full' || scanType === 'trademark') {
        setStatus(s => ({ ...s, message: '🔴 Live: querying USPTO trademark database...', progress: 10 }));

        // Backend fetches, deduplicates, and saves — returns counts only
        const resp = await scans.trademark(daysBack, 200);
        const { total_found, new_saved, skipped, error: tmError } = resp.data;

        if (tmError) throw new Error(`USPTO API: ${tmError}`);

        totalSaved += new_saved;

        setStatus(s => ({
          ...s,
          message: `✅ USPTO: ${total_found.toLocaleString()} filings scanned — ${new_saved} new, ${skipped} already saved`,
          progress: 25,
        }));
      }

      // ── Step 2–6: Simulated sources ────────────────────────────────────────
      const simSteps = [];
      if (scanType === 'full' || scanType === 'delaware')
        simSteps.push({ type: 'delaware',  label: 'Scanning Delaware filings...',      progress: 40,  data: () => getDelawareData(daysBack) });
      if (scanType === 'full' || scanType === 'domain')
        simSteps.push({ type: 'domain',    label: 'Monitoring domain registrations...', progress: 55, data: () => getDomainData(daysBack) });
      if (scanType === 'full' || scanType === 'instagram')
        simSteps.push({ type: 'instagram', label: 'Checking Instagram handles...',      progress: 68, data: () => getInstagramData() });
      if (scanType === 'full' || scanType === 'shopify')
        simSteps.push({ type: 'shopify',   label: 'Scanning Shopify stores...',         progress: 80, data: () => getShopifyData() });
      if (scanType === 'full' || scanType === 'social')
        simSteps.push({ type: 'social',    label: 'Parsing social media...',            progress: 90, data: () => getSocialData() });

      for (const step of simSteps) {
        setStatus(s => ({ ...s, message: step.label, progress: step.progress }));
        await new Promise(r => setTimeout(r, 500));

        const signals = rawToSignals(step.data(), step.type);
        const saved = await saveSignals(signals);
        totalSaved += saved;
      }

      setStatus({
        phase:    'done',
        progress: 100,
        message:  `Scan complete — saved ${totalSaved} new signals.`,
        done:     true,
        error:    false,
        saved:    totalSaved,
      });
    } catch (err) {
      setStatus({
        phase:    'error',
        progress: 0,
        message:  `Scan failed: ${err.message}`,
        done:     true,
        error:    true,
        saved:    totalSaved,
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Run Scan</h2>
          <p className="text-slate-500 mt-1">
            Scan real and simulated sources for stealth startup signals. USPTO data is live.
          </p>
        </div>

        {/* Config card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">

          {/* Scan type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Scan Type</label>
            <select
              value={scanType}
              onChange={e => setScanType(e.target.value)}
              disabled={scanning}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SCAN_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Time period */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Time Period</label>
            <select
              value={daysBack}
              onChange={e => setDaysBack(parseInt(e.target.value))}
              disabled={scanning}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days (recommended)</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          {/* Progress */}
          {status && (
            <div className={`rounded-lg p-4 border ${
              status.error ? 'bg-red-50 border-red-200' :
              status.done  ? 'bg-green-50 border-green-200' :
                             'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {status.error ? (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                ) : status.done ? (
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 animate-spin" />
                )}
                <span className={`text-sm font-medium ${
                  status.error ? 'text-red-800' : status.done ? 'text-green-800' : 'text-blue-800'
                }`}>
                  {status.message}
                </span>
              </div>

              {!status.done && (
                <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
              )}

              {status.done && !status.error && (
                <p className="text-sm text-green-700 mt-1">
                  Head to the <strong>Dashboard</strong> to see your matches.
                </p>
              )}
            </div>
          )}

          {/* Run button */}
          <button
            onClick={runScan}
            disabled={scanning}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run Scan
              </>
            )}
          </button>
        </div>

        {/* Source guide */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">🎯 Signal Sources</h3>
          <div className="space-y-3">
            {SOURCES.map(source => {
              const Icon = source.icon;
              return (
                <div key={source.label} className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${source.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{source.label}</span>
                      <span className="text-xs text-slate-400">{source.badge}</span>
                    </div>
                    <div className="text-xs text-slate-500">{source.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
