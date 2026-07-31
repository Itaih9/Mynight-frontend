import { useEffect, useState } from 'react';
import { Mail, Plus, Play, Eye, Send, Trash2, Save, Users } from 'lucide-react';
import { adminApi, type EmailCampaign, type CampaignRunResult } from '@/services/api/admin.api';
import { AdminLayout } from './AdminLayout';

const AUDIENCES = [
  { value: 'flash_free_unpaid', label: 'פלאש חינם — טרם שילמו' },
  { value: 'paid', label: 'זוגות משלמים' },
  { value: 'all_couples', label: 'כל הזוגות' },
] as const;

const TRIGGERS = [
  { value: 'before_wedding', label: 'ימים לפני החתונה' },
  { value: 'after_signup', label: 'ימים אחרי ההרשמה' },
  { value: 'fixed_date', label: 'תאריך קבוע' },
] as const;

const blank: Partial<EmailCampaign> = {
  name: '',
  audience: 'flash_free_unpaid',
  filters: { requireEmail: true },
  trigger: { type: 'before_wedding', days: 30 },
  subject: '',
  blocks: { title: '', paragraphs: [''], bullets: [], ctaText: '', ctaUrl: '', footnote: '' },
  isActive: true,
};

export const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [editing, setEditing] = useState<Partial<EmailCampaign> | null>(null);
  const [preview, setPreview] = useState<CampaignRunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try { setCampaigns(await adminApi.listCampaigns()); }
    catch { setMsg('טעינת הקמפיינים נכשלה'); }
  };
  useEffect(() => { void load(); }, []);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const save = async () => {
    if (!editing?.name || !editing?.subject) return flash('שם ונושא נדרשים');
    setBusy(true);
    try {
      if (editing._id) await adminApi.updateCampaign(editing._id, editing);
      else await adminApi.createCampaign(editing);
      setEditing(null);
      await load();
      flash('נשמר');
    } catch { flash('השמירה נכשלה'); } finally { setBusy(false); }
  };

  const doPreview = async (id?: string) => {
    setBusy(true);
    try {
      setPreview(await adminApi.previewCampaigns(id));
      flash('תצוגה מקדימה — לא נשלח דבר');
    } catch { flash('התצוגה נכשלה'); } finally { setBusy(false); }
  };

  const doRun = async (id?: string) => {
    const who = id ? 'הקמפיין הזה' : 'כל הקמפיינים הפעילים';
    if (!confirm(`לשלוח עכשיו ${who}? הפעולה שולחת מיילים אמיתיים ואי אפשר לבטל.`)) return;
    setBusy(true);
    try {
      const r = await adminApi.runCampaigns(id);
      await load();
      flash(`נשלחו ${r.sent} מיילים`);
    } catch { flash('השליחה נכשלה'); } finally { setBusy(false); }
  };

  const doTest = async (c: EmailCampaign) => {
    const to = prompt('לאיזו כתובת לשלוח בדיקה?');
    if (!to) return;
    setBusy(true);
    try { await adminApi.testCampaign(c._id, to); flash(`נשלחה בדיקה ל-${to}`); }
    catch { flash('שליחת הבדיקה נכשלה'); } finally { setBusy(false); }
  };

  const doDelete = async (c: EmailCampaign) => {
    if (!confirm(`למחוק את "${c.name}"? גם היסטוריית השליחה תימחק.`)) return;
    await adminApi.deleteCampaign(c._id);
    await load();
    flash('נמחק');
  };

  const setBlocks = (patch: Partial<EmailCampaign['blocks']>) =>
    setEditing((e) => ({ ...e!, blocks: { ...e!.blocks!, ...patch } }));

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="w-6 h-6" /> קמפיינים במייל
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              קהל, תזמון ותוכן — הכל נערך כאן, בלי deploy.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => doPreview()} disabled={busy}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              <Eye className="w-4 h-4" /> תצוגה מקדימה
            </button>
            <button onClick={() => doRun()} disabled={busy}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              <Play className="w-4 h-4" /> הרצה עכשיו
            </button>
            <button onClick={() => setEditing({ ...blank })}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" /> קמפיין חדש
            </button>
          </div>
        </div>

        {msg && <div className="mb-4 px-4 py-3 rounded-lg bg-slate-100 text-slate-800 text-sm">{msg}</div>}

        {/* Dry-run result */}
        {preview && (
          <div className="mb-6 rounded-xl border border-slate-200 p-5 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold flex items-center gap-2"><Users className="w-4 h-4" /> מי יקבל עכשיו</h2>
              <button onClick={() => setPreview(null)} className="text-slate-400 text-sm">סגירה</button>
            </div>
            {preview.results.map((r) => (
              <div key={r.campaignId} className="mb-3 last:mb-0">
                <p className="text-sm font-semibold">
                  {r.campaign} — <span className="text-emerald-700">{r.recipients.length} נמענים</span>
                  {r.skipped > 0 && <span className="text-slate-400"> · {r.skipped} כבר קיבלו</span>}
                </p>
                {r.recipients.length > 0 && (
                  <ul className="mt-1 text-xs text-slate-600 space-y-0.5 max-h-40 overflow-y-auto">
                    {r.recipients.map((x) => (
                      <li key={x.eventId}>
                        {x.coupleName} · {x.email}
                        {x.daysToWedding !== null && <span className="text-slate-400"> · עוד {x.daysToWedding} ימים</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c._id} className="rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{c.name}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {c.isActive ? 'פעיל' : 'כבוי'}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {AUDIENCES.find((a) => a.value === c.audience)?.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1 truncate">{c.subject}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {c.trigger.type === 'before_wedding' && `${c.trigger.days} ימים לפני החתונה`}
                  {c.trigger.type === 'after_signup' && `${c.trigger.days} ימים אחרי ההרשמה`}
                  {c.trigger.type === 'fixed_date' && `בתאריך ${c.trigger.date?.slice(0, 10)}`}
                  {' · '}נשלח {c.sentCount} פעמים
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <IconBtn title="תצוגה" onClick={() => doPreview(c._id)}><Eye className="w-4 h-4" /></IconBtn>
                <IconBtn title="בדיקה למייל" onClick={() => doTest(c)}><Send className="w-4 h-4" /></IconBtn>
                <IconBtn title="הרצה" onClick={() => doRun(c._id)}><Play className="w-4 h-4" /></IconBtn>
                <IconBtn title="עריכה" onClick={() => setEditing(c)}><Save className="w-4 h-4" /></IconBtn>
                <IconBtn title="מחיקה" onClick={() => doDelete(c)} danger><Trash2 className="w-4 h-4" /></IconBtn>
              </div>
            </div>
          ))}
          {campaigns.length === 0 && <p className="text-slate-400 text-sm">אין קמפיינים עדיין.</p>}
        </div>

        {/* Editor */}
        {editing && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl my-8 p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">{editing._id ? 'עריכת קמפיין' : 'קמפיין חדש'}</h2>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <Text label="שם פנימי" value={editing.name || ''} onChange={(v) => setEditing({ ...editing, name: v })} />
                <Select label="קהל" value={editing.audience!} options={AUDIENCES as any}
                  onChange={(v) => setEditing({ ...editing, audience: v as any })} />
                <Select label="תזמון" value={editing.trigger!.type} options={TRIGGERS as any}
                  onChange={(v) => setEditing({ ...editing, trigger: { ...editing.trigger!, type: v as any } })} />
                {editing.trigger!.type === 'fixed_date' ? (
                  <Text label="תאריך" type="date" value={editing.trigger!.date?.slice(0, 10) || ''}
                    onChange={(v) => setEditing({ ...editing, trigger: { ...editing.trigger!, date: v } })} />
                ) : (
                  <Text label="מספר ימים" type="number" value={String(editing.trigger!.days ?? '')}
                    onChange={(v) => setEditing({ ...editing, trigger: { ...editing.trigger!, days: Number(v) } })} />
                )}
              </div>

              <Text label="נושא המייל" value={editing.subject || ''} onChange={(v) => setEditing({ ...editing, subject: v })} />
              <p className="text-xs text-slate-400 mt-1 mb-4">
                אפשר להשתמש ב: {'{{coupleName}}'} · {'{{daysToWedding}}'} · {'{{eventCode}}'} · {'{{cameraUrl}}'}
              </p>

              <Text label="כותרת" value={editing.blocks?.title || ''} onChange={(v) => setBlocks({ title: v })} />
              <Area label="פסקאות (שורה לכל פסקה)" value={(editing.blocks?.paragraphs || []).join('\n')}
                onChange={(v) => setBlocks({ paragraphs: v.split('\n') })} rows={4} />
              <Area label="נקודות (שורה לכל נקודה)" value={(editing.blocks?.bullets || []).join('\n')}
                onChange={(v) => setBlocks({ bullets: v.split('\n').filter(Boolean) })} rows={3} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Text label="טקסט הכפתור" value={editing.blocks?.ctaText || ''} onChange={(v) => setBlocks({ ctaText: v })} />
                <Text label="קישור הכפתור" value={editing.blocks?.ctaUrl || ''} onChange={(v) => setBlocks({ ctaUrl: v })} />
              </div>
              <Text label="הערת שוליים" value={editing.blocks?.footnote || ''} onChange={(v) => setBlocks({ footnote: v })} />

              <label className="flex items-center gap-2 mt-4 text-sm">
                <input type="checkbox" checked={!!editing.isActive}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
                קמפיין פעיל
              </label>

              <div className="flex gap-2 mt-6">
                <button onClick={save} disabled={busy}
                  className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50">
                  {busy ? 'שומר…' : 'שמירה'}
                </button>
                <button onClick={() => setEditing(null)} className="px-6 py-3 rounded-xl border border-slate-300">ביטול</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const IconBtn = ({ children, onClick, title, danger }: any) => (
  <button onClick={onClick} title={title}
    className={`p-2 rounded-lg border transition-colors ${danger ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
    {children}
  </button>
);

const Text = ({ label, value, onChange, type = 'text' }: any) => (
  <label className="block mb-3">
    <span className="block text-sm text-slate-600 mb-1">{label}</span>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none focus:border-slate-900" />
  </label>
);

const Area = ({ label, value, onChange, rows = 3 }: any) => (
  <label className="block mb-3">
    <span className="block text-sm text-slate-600 mb-1">{label}</span>
    <textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none focus:border-slate-900 resize-y" />
  </label>
);

const Select = ({ label, value, onChange, options }: any) => (
  <label className="block mb-3">
    <span className="block text-sm text-slate-600 mb-1">{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none focus:border-slate-900 bg-white">
      {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </label>
);

export default AdminCampaigns;
