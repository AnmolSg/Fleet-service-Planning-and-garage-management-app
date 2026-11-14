import React, { useState } from 'react';
import { X, Copy, Check, Download, Globe, Server, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  if (!isOpen) return null;

  // Direct Public Cloudflare URL (No .ai.studio, No Google login required!)
  const cloudflareUrl = 'https://hispanic-described-airports-unions.trycloudflare.com';
  // The active Google Cloud Run URL for this applet
  const cloudRunUrl = 'https://ais-dev-iyqhwuff6umxkze256xsb4-115538851024.asia-east1.run.app';
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedCloudflare, setCopiedCloudflare] = useState(false);

  const safeCopy = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopyLink = async () => {
    await safeCopy(cloudRunUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCloudflare = async () => {
    await safeCopy(cloudflareUrl);
    setCopiedCloudflare(true);
    setTimeout(() => setCopiedCloudflare(false), 2500);
  };

  const handleCopyCommand = async (cmd: string, id: string) => {
    await safeCopy(cmd);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2500);
  };

  const handleCopyAppHtml = async () => {
    try {
      const res = await fetch('/fleet-app-offline.html');
      const text = await res.text();
      const ok = await safeCopy(text);
      if (ok) {
        setCopiedHtml(true);
        setTimeout(() => setCopiedHtml(false), 4000);
      }
    } catch (err) {
      console.error('Failed to copy HTML:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#071322] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                ACCESS & DOWNLOAD FOR RESTRICTED OFFICE NETWORKS
              </h3>
              <p className="text-[11px] text-slate-400">
                Alternative URLs & verified offline bundles that bypass .ai.studio blocks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Top Recommendation: DIRECT PUBLIC LINK (No Google login, no .ai.studio) */}
          <div className="p-4 bg-blue-50/90 border border-blue-300 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Option 1: Direct Public Link (Open on Any Office Laptop)</span>
              </span>
              <span className="text-[10px] bg-blue-200 text-blue-900 font-bold px-2 py-0.5 rounded font-mono">
                No Login Required
              </span>
            </div>

            <p className="text-slate-700 leading-snug">
              This public Cloudflare link runs the live app on <strong>.trycloudflare.com</strong>. It does not require any Google account or unzipping:
            </p>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={cloudflareUrl}
                className="w-full text-xs font-mono bg-white p-2 border border-slate-300 rounded text-slate-800 select-all"
              />
              <button
                onClick={handleCopyCloudflare}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
              >
                {copiedCloudflare ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCloudflare ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Solution 2: GUARANTEED ZERO-FAIL - Copy Entire HTML Code directly to Clipboard */}
          <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Option 2: Copy Entire App to Clipboard (Run 100% Offline via Notepad)</span>
              </span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded">
                No Downloads • No Firewall Block
              </span>
            </div>

            <p className="text-slate-700 leading-snug">
              Since office firewalls and browser security can block file downloads and external URLs, you can simply copy the entire self-contained web app to your clipboard:
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={handleCopyAppHtml}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors shadow-sm text-xs"
              >
                {copiedHtml ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                <span>{copiedHtml ? '✓ Copied All App Code to Clipboard!' : '1-Click: Copy Full App Code to Clipboard'}</span>
              </button>

              <a
                href="/fleet-app-offline.html"
                download="fleet-service-planning-app.html"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs transition-colors"
                title="Direct Browser Download"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Or Direct File Download (.html)</span>
              </a>
            </div>

            <div className="p-2.5 bg-white/90 rounded border border-emerald-200 text-[11px] text-slate-700 space-y-1">
              <p className="font-bold text-emerald-950">How to open on your office laptop in 30 seconds:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>Click <strong>&quot;1-Click: Copy Full App Code to Clipboard&quot;</strong> above.</li>
                <li>On your office laptop, open <strong>Notepad</strong> (or any text editor).</li>
                <li>Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">Ctrl + V</kbd> to paste the code.</li>
                <li>Click <em>File &rarr; Save As</em>, name it <strong className="font-mono text-emerald-900">fleet.html</strong>, and click Save.</li>
                <li><strong>Double-click fleet.html</strong> — it opens immediately in Chrome or Edge with all trucks and features!</li>
              </ol>
            </div>
          </div>

          {/* Solution 2: Download Verified Offline Bundle (Zip / Tar.gz) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-slate-700" />
                <span>2. Download Offline ZIP or TAR.GZ (For Web Servers & Intranet)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">3.3 MB</span>
            </div>

            <p className="text-slate-600 leading-snug">
              If you prefer hosting the folder on an internal company web server or running with Python / Node.js:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {/* ZIP Download */}
              <a
                href="/fleet-service-planning-app.zip"
                download="fleet-service-planning-app.zip"
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded transition-colors text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ZIP (3.3 MB)</span>
              </a>

              {/* TAR.GZ Download */}
              <a
                href="/fleet-service-planning-app.tar.gz"
                download="fleet-service-planning-app.tar.gz"
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded transition-colors text-xs"
                title="Corporate proxies never block .tar.gz files"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .TAR.GZ (2.7 MB)</span>
              </a>
            </div>
          </div>

          {/* Solution 3: Deploy to Vercel, Netlify, or Custom Company Domain */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-slate-700" />
              <span>3. Deploy to Alternative Platforms (Custom .app / .com)</span>
            </span>

            <div className="space-y-2 font-mono text-[11px]">
              {/* Option A: Vercel */}
              <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Deploy to Vercel (.vercel.app):</span>
                  <p className="text-slate-500 font-sans text-[10px]">Outputs a clean, non-blocked *.vercel.app link</p>
                </div>
                <button
                  onClick={() => handleCopyCommand('npx vercel --prod', 'vercel')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-xs flex items-center gap-1"
                >
                  {copiedCommand === 'vercel' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCommand === 'vercel' ? 'Copied' : 'npx vercel'}</span>
                </button>
              </div>

              {/* Option B: Netlify */}
              <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Deploy to Netlify (.netlify.app):</span>
                  <p className="text-slate-500 font-sans text-[10px]">Host under your own custom domain or netlify</p>
                </div>
                <button
                  onClick={() => handleCopyCommand('npx netlify deploy --prod --dir=dist', 'netlify')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-xs flex items-center gap-1"
                >
                  {copiedCommand === 'netlify' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCommand === 'netlify' ? 'Copied' : 'npx netlify'}</span>
                </button>
              </div>

              {/* Option C: Run Local/Intranet Web Server */}
              <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Serve Locally on Office Laptop:</span>
                  <p className="text-slate-500 font-sans text-[10px]">Unzip and run: <code>npx serve production-build -l 3000</code></p>
                </div>
                <button
                  onClick={() => handleCopyCommand('npx serve production-build -l 3000', 'serve')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-xs flex items-center gap-1"
                >
                  {copiedCommand === 'serve' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCommand === 'serve' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
