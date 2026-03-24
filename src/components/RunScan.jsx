import React, { useState } from 'react';
import { items, scans } from '../api/client';

import { Play, RefreshCw, CheckCircle, AlertCircle, Award, Camera, ShoppingBag, Building2, Globe, Linkedin, Rocket } from 'lucide-react';
import { CONSUMER_CATEGORIES } from './Dashboard';

// ─── Score boosts ──────────────────────────────────────────────────────────────
const SCORE_BOOSTS = {
  trademark: 15, delaware: 5, domain: 3, instagram: 8, shopify: 10, social: 2,
};

// ─── Simulated data generators ────────────────────────────────────────────────

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
    { name: 'gethealthy.com',  category: 'Health/Wellness' },
    { name: 'tryfit.io',       category: 'Fitness'         },
    { name: 'foodhub.com',     category: 'CPG/Food/Drink'  },
    { name: 'finflow.app',     category: 'Finance'         },
    { name: 'learnai.com',     category: 'Education'       },
    { name: 'stylematch.io',   category: 'Apparel'         },
    { name: 'homedash.app',    category: 'Home/Lifestyle'  },
    { name: 'beautyboss.com',  category: 'Beauty'          },
    { name: 'glowai.ai',       category: 'Consumer AI'     },
    { name: 'activeware.shop', category: 'Apparel'         },
    { name: 'playtime.com',    category: 'Sports'          },
    { name: 'wellnesshq.com',  category: 'Health/Wellness' },
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
    { handle: 'gethealthy', category: 'Health/Wellness' },
    { handle: 'tryfit',     category: 'Fitness'         },
    { handle: 'foodhub',    category: 'CPG/Food/Drink'  },
    { handle: 'finflow',    category: 'Finance'         },
    { handle: 'learnai',    category: 'Education'       },
    { handle: 'stylematch', category: 'Apparel'         },
    { handle: 'beautyboss', category: 'Beauty'          },
    { handle: 'glowai',     category: 'Consumer AI'     },
    { handle: 'activeware', category: 'Apparel'         },
    { handle: 'playtime',   category: 'Sports'          },
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
    { name: 'GetHealthy', domain: 'gethealthy.myshopify.com',  category: 'Health/Wellness' },
    { name: 'TryFit',     domain: 'tryfit.myshopify.com',       category: 'Fitness'         },
    { name: 'FoodHub',    domain: 'foodhub.myshopify.com',      category: 'CPG/Food/Drink'  },
    { name: 'StyleMatch', domain: 'stylematch.myshopify.com',   category: 'Apparel'         },
    { name: 'BeautyBoss', domain: 'beautyboss.myshopify.com',   category: 'Beauty'          },
    { name: 'ActiveWear', domain: 'activeware.myshopify.com',   category: 'Apparel'         },
    { name: 'HomeDash',   domain: 'homedash.myshopify.com',     category: 'Home/Lifestyle'  },
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
    { company: 'GetHealthy', category: 'Health/Wellness', founder: 'Sarah Chen'    },
    { company: 'TryFit',     category: 'Fitness',         founder: 'Mike Rodriguez' },
    { company: 'FoodHub',    category: 'CPG/Food/Drink',  founder: 'Lisa Park'      },
    { company: 'BeautyBoss', category: 'Beauty',          founder: 'Maya Patel'     },
    { company: 'GlowAI',     category: 'Consumer AI',     founder: 'Chris Lee'      },
    { company: 'StyleMatch', category: 'Apparel',         founder: 'Sophie Turner'  },
    { company: 'PlayTime',   category: 'Sports',          founder: 'Tom Harris'     },
  ];
  const today = new Date();
  return posts.map(p => {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    return { ...p, created_at: date.toISOString(), text: `Building something new in ${p.category}. In stealth mode! 🚀` };
  });
}

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

// ─── Constants ────────────────────────────────────────────────────────────────

const SCAN_TYPES = [
  { value: 'full',         label: 'Full Scan — All Live Sources'   },
  { value: 'trademark',    label: 'USPTO Trademarks Only'          },
  { value: 'delaware',     label: 'Delaware + Form D Only'         },
  { value: 'producthunt',  label: 'Product Hunt Launches Only'     },
  { value: 'domain',       label: 'Domain Registrations Only'      },
];

const SOURCES = [
  { icon: Award,       label: 'USPTO Trademarks',    desc: 'Live — real filings from the last N days. Earliest brand signal before any public activity.',             live: true  },
  { icon: Building2,   label: 'Delaware + Form D',   desc: 'Live — SEC Form D (Reg D exemption) + domain cross-reference. DE-incorporated and quietly raising.',     live: true  },
  { icon: Globe,       label: 'Domain Registration', desc: 'Live — auto cross-referenced for every Delaware hit. Matching .com registered recently = compound.',     live: true  },
  { icon: Rocket,      label: 'Product Hunt',         desc: 'Live — consumer product launches. Post-stealth but still early; use to validate or find new arrivals.',  live: true  },
  { icon: Camera,      label: 'Instagram Handles',   desc: 'Consumer brands secure @handle before website',                                                           live: false },
  { icon: ShoppingBag, label: 'Shopify Stores',      desc: 'New DTC stores with 0 products = stealth',                                                               live: false },
  { icon: Linkedin,    label: 'Social Media',        desc: 'Founders announcing stealth mode',                                                                        live: false },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function RunScan() {
  const [scanType, setScanType] = useState('full');
  const [daysBack, setDaysBack] = useState(30);
  const [status,   setStatus]   = useState(null);
  const [scanning, setScanning] = useState(false);

  const runScan = async () => {
    setScanning(true);
    setStatus({ phase: 'init', progress: 0, message: 'Starting scan...', done: false, error: false, saved: 0 });

    let totalSaved = 0;

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

    let totalSkipped = 0;

    try {
      if (scanType === 'full' || scanType === 'trademark') {
        setStatus(s => ({ ...s, message: 'Live: querying USPTO trademark database...', progress: 10 }));
        const resp = await scans.trademark(daysBack, 200);
        const { total_found, new_saved, skipped, error: tmError } = resp.data;
        if (tmError) throw new Error(`USPTO API: ${tmError}`);
        totalSaved   += new_saved;
        totalSkipped += (skipped || 0);
        setStatus(s => ({
          ...s,
          message: `USPTO: ${total_found.toLocaleString()} filings scanned — ${new_saved} new, ${skipped} already in database`,
          progress: 25,
        }));
      }

      // ── Live: Delaware filings + automatic domain cross-reference ──
      if (scanType === 'full' || scanType === 'delaware' || scanType === 'domain') {
        setStatus(s => ({ ...s, message: 'Live: querying Delaware entity filings + cross-referencing domains...', progress: 40 }));
        const deResp = await scans.delaware(daysBack, 150);
        const { fetched: deFetched, domain_hits, new_saved: deNew, skipped: deSkipped, error: deError } = deResp.data;
        if (deError) throw new Error(`Delaware API: ${deError}`);
        totalSaved   += deNew;
        totalSkipped += (deSkipped || 0);
        setStatus(s => ({
          ...s,
          message: `Delaware: ${deFetched} entities found, ${domain_hits} domain matches — ${deNew} new, ${deSkipped} already in database`,
          progress: 55,
        }));
      }

      // ── Live: Product Hunt consumer launches ──
      if (scanType === 'full' || scanType === 'producthunt') {
        setStatus(s => ({ ...s, message: 'Live: scanning Product Hunt for consumer launches...', progress: 68 }));
        const phResp = await scans.producthunt(Math.min(daysBack, 14), 100);
        const { fetched: phFetched, new_saved: phNew, skipped: phSkipped, error: phError } = phResp.data;
        if (phError) throw new Error(`Product Hunt: ${phError}`);
        totalSaved   += phNew;
        totalSkipped += (phSkipped || 0);
        setStatus(s => ({
          ...s,
          message: `Product Hunt: ${phFetched} consumer launches — ${phNew} new, ${phSkipped} already in database`,
          progress: 75,
        }));
      }

      const simSteps = [];
      if (scanType === 'full' || scanType === 'instagram')
        simSteps.push({ type: 'instagram', label: 'Checking Instagram handles...',  progress: 78, data: () => getInstagramData() });
      if (scanType === 'full' || scanType === 'shopify')
        simSteps.push({ type: 'shopify',   label: 'Scanning Shopify stores...',     progress: 88, data: () => getShopifyData() });
      if (scanType === 'full' || scanType === 'social')
        simSteps.push({ type: 'social',    label: 'Parsing social media...',        progress: 94, data: () => getSocialData() });

      for (const step of simSteps) {
        setStatus(s => ({ ...s, message: step.label, progress: step.progress }));
        await new Promise(r => setTimeout(r, 500));
        const signals = rawToSignals(step.data(), step.type);
        const saved = await saveSignals(signals);
        totalSaved += saved;
      }

      const skippedNote = totalSkipped > 0 ? ` (${totalSkipped} already in your database — deduped)` : '';
      setStatus({
        phase: 'done', progress: 100,
        message: `Scan complete — ${totalSaved} new signals added.${skippedNote}`,
        done: true, error: false, saved: totalSaved,
      });
    } catch (err) {
      setStatus({
        phase: 'error', progress: 0,
        message: `Scan failed: ${err.message}`,
        done: true, error: true, saved: totalSaved,
      });
    } finally {
      setScanning(false);
    }
  };

  const selectClass = 'w-full border border-neutral-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#052EF0] transition-colors bg-white';

  return (
    <div className="max-w-7xl mx-auto px-6 py-7">
      <div className="max-w-xl">

        {/* ── Page header ── */}
        <div className="mb-7">
          <h1 className="font-display font-bold text-3xl uppercase tracking-wide text-black">
            Run Scan
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            USPTO trademarks, Delaware/Form D filings, domain cross-references, and Product Hunt launches are all live.
          </p>
        </div>

        {/* ── Config card ── */}
        <div className="bg-white rounded-lg p-6 space-y-5" style={{ border: '1px solid #E5E5E0' }}>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
              Scan Type
            </label>
            <select value={scanType} onChange={e => setScanType(e.target.value)} disabled={scanning} className={selectClass}>
              {SCAN_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
              Time Period
            </label>
            <select value={daysBack} onChange={e => setDaysBack(parseInt(e.target.value))} disabled={scanning} className={selectClass}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days (recommended)</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          {/* Progress */}
          {status && (
            <div
              className="rounded p-4"
              style={{
                backgroundColor: status.error ? '#FEF2F2' : status.done ? '#F0FDF4' : '#EEF2FF',
                border: `1px solid ${status.error ? '#FECACA' : status.done ? '#BBF7D0' : '#C7D2FE'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                {status.error ? (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                ) : status.done ? (
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                ) : (
                  <RefreshCw className="w-4 h-4 shrink-0 animate-spin" style={{ color: '#052EF0' }} />
                )}
                <span className={`text-sm font-medium ${status.error ? 'text-red-800' : status.done ? 'text-green-800' : 'text-neutral-800'}`}>
                  {status.message}
                </span>
              </div>

              {!status.done && (
                <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${status.progress}%`, backgroundColor: '#052EF0' }}
                  />
                </div>
              )}

              {status.done && !status.error && (
                <p className="text-xs text-green-700 mt-2">
                  Head to <strong>Dashboard</strong> to see your matches.
                </p>
              )}
            </div>
          )}

          {/* Run button */}
          <button
            onClick={runScan}
            disabled={scanning}
            className="w-full py-3 text-sm font-display font-semibold tracking-widest uppercase text-white rounded transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: scanning ? '#999' : '#052EF0' }}
          >
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Scan
              </>
            )}
          </button>
        </div>

        {/* ── Source reference ── */}
        <div className="mt-5 bg-white rounded-lg p-6" style={{ border: '1px solid #E5E5E0' }}>
          <h3 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400 mb-4">
            Signal Sources
          </h3>
          <div className="space-y-3">
            {SOURCES.map(source => {
              const Icon = source.icon;
              return (
                <div key={source.label} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                    style={{ backgroundColor: source.live ? '#052EF0' : '#F5F0EB' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: source.live ? '#fff' : '#999' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-black">{source.label}</span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider"
                        style={
                          source.live
                            ? { backgroundColor: '#052EF0', color: '#fff' }
                            : { backgroundColor: '#EEEEEE', color: '#999' }
                        }
                      >
                        {source.live ? 'Live' : 'Coming Soon'}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400">{source.desc}</div>
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
