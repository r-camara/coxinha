import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  commands,
  type AppConfig,
  type ObsidianVault,
  type RebuildStats,
} from '../lib/bindings';
import { useAppStore } from '../lib/store';
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from '../lib/theme';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; config: AppConfig; vaults: ObsidianVault[] }
  | { kind: 'error'; message: string };

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string };

type RebuildState =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'done'; stats: RebuildStats }
  | { kind: 'error'; message: string };

export function SettingsView() {
  const { t } = useTranslation();
  const loadNotes = useAppStore((s) => s.loadNotes);
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [save, setSave] = useState<SaveState>({ kind: 'idle' });
  const [rebuild, setRebuild] = useState<RebuildState>({ kind: 'idle' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cfgRes, vaultRes] = await Promise.all([
        commands.getConfig(),
        commands.listObsidianVaults(),
      ]);
      if (cancelled) return;

      if (cfgRes.status === 'error') {
        setState({ kind: 'error', message: cfgRes.error });
        return;
      }
      // Missing Obsidian is not an error — the backend returns [].
      const vaults = vaultRes.status === 'ok' ? vaultRes.data : [];
      setState({ kind: 'ready', config: cfgRes.data, vaults });
      setSelectedPath(cfgRes.data.vault_path);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = useMemo(() => {
    if (state.kind !== 'ready') return false;
    return selectedPath.trim().length > 0 && selectedPath !== state.config.vault_path;
  }, [state, selectedPath]);

  async function onSave() {
    if (state.kind !== 'ready' || !dirty) return;
    setSave({ kind: 'saving' });
    const next: AppConfig = { ...state.config, vault_path: selectedPath.trim() };
    const res = await commands.updateConfig(next);
    if (res.status === 'error') {
      setSave({ kind: 'error', message: res.error });
      return;
    }
    setSave({ kind: 'saved' });
    setState({ ...state, config: next });
  }

  async function onRebuild() {
    setRebuild({ kind: 'running' });
    const res = await commands.rebuildFromVault();
    if (res.status === 'error') {
      setRebuild({ kind: 'error', message: res.error });
      return;
    }
    setRebuild({ kind: 'done', stats: res.data });
    // Pull the freshly-indexed notes into the sidebar.
    await loadNotes();
  }

  if (state.kind === 'loading') {
    return (
      <SettingsFrame>
        <p role="status" aria-live="polite" className="text-muted-foreground">
          {t('settings.comingSoon')}
        </p>
      </SettingsFrame>
    );
  }
  if (state.kind === 'error') {
    return (
      <SettingsFrame>
        <p role="alert" className="text-red-600">
          {t('settings.vault.loadError', { error: state.message })}
        </p>
      </SettingsFrame>
    );
  }

  const { vaults, config } = state;

  return (
    <SettingsFrame>
      <section aria-labelledby="vault-heading" className="space-y-4">
        <h2 id="vault-heading" className="text-lg font-semibold">
          {t('settings.vault.heading')}
        </h2>

        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{t('settings.vault.currentPath')}:</span>{' '}
          <code className="font-mono">{config.vault_path}</code>
        </p>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            {t('settings.vault.detectedObsidian')}
          </legend>
          {vaults.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('settings.vault.noObsidian')}
            </p>
          ) : (
            <ul className="space-y-1">
              {vaults.map((v) => (
                <li key={v.id}>
                  <label className="flex items-start gap-2 rounded px-2 py-1.5 hover:bg-accent/50 cursor-pointer">
                    <input
                      type="radio"
                      name="vault"
                      value={v.path}
                      checked={selectedPath === v.path}
                      onChange={() => setSelectedPath(v.path)}
                      className="mt-1"
                      aria-describedby={`vault-meta-${v.id}`}
                    />
                    <span className="flex-1">
                      <span className="font-medium">{v.name || v.path}</span>
                      <span
                        id={`vault-meta-${v.id}`}
                        className="block text-xs text-muted-foreground"
                      >
                        <code className="font-mono">{v.path}</code>
                        {' · '}
                        {v.last_opened_ms
                          ? `${t('settings.vault.lastOpenedPrefix')} ${formatRelative(v.last_opened_ms)}`
                          : t('settings.vault.neverOpened')}
                        {!v.exists && (
                          <>
                            {' · '}
                            <span className="text-amber-600">
                              {t('settings.vault.missingFolder')}
                            </span>
                          </>
                        )}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <fieldset className="space-y-1">
          <label htmlFor="vault-custom-path" className="text-sm font-medium">
            {t('settings.vault.customPath')}
          </label>
          <input
            id="vault-custom-path"
            type="text"
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            placeholder={t('settings.vault.customPathPlaceholder')}
            className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        </fieldset>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || save.kind === 'saving'}
            className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {save.kind === 'saving' ? t('settings.vault.saving') : t('settings.vault.save')}
          </button>
          {save.kind === 'saved' && (
            <p role="status" aria-live="polite" className="text-sm text-green-700">
              {t('settings.vault.saved')}
            </p>
          )}
          {save.kind === 'error' && (
            <p role="alert" className="text-sm text-red-600">
              {t('settings.vault.saveError', { error: save.message })}
            </p>
          )}
        </div>
      </section>

      <AppearanceSection />

      <section aria-labelledby="rebuild-heading" className="space-y-3">
        <h2 id="rebuild-heading" className="text-lg font-semibold">
          {t('settings.vault.rebuildHeading')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('settings.vault.rebuildDescription')}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRebuild}
            disabled={rebuild.kind === 'running'}
            className="px-4 py-2 rounded border border-border bg-background hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {rebuild.kind === 'running'
              ? t('settings.vault.rebuilding')
              : t('settings.vault.rebuild')}
          </button>
          {rebuild.kind === 'done' && (
            <p
              role="status"
              aria-live="polite"
              className={
                rebuild.stats.notes_skipped > 0
                  ? 'text-sm text-amber-600'
                  : 'text-sm text-green-700'
              }
            >
              {rebuild.stats.notes_skipped > 0
                ? t('settings.vault.rebuiltWithSkips', {
                    notes: String(rebuild.stats.notes_indexed),
                    links: String(rebuild.stats.links_indexed),
                    skipped: String(rebuild.stats.notes_skipped),
                  })
                : t('settings.vault.rebuiltSuccess', {
                    notes: String(rebuild.stats.notes_indexed),
                    links: String(rebuild.stats.links_indexed),
                  })}
            </p>
          )}
          {rebuild.kind === 'error' && (
            <p role="alert" className="text-sm text-red-600">
              {t('settings.vault.rebuildError', { error: rebuild.message })}
            </p>
          )}
        </div>
      </section>
    </SettingsFrame>
  );
}

function AppearanceSection() {
  const { t } = useTranslation();
  const [pref, setPref] = useState<ThemePreference>(() => getThemePreference());

  function choose(next: ThemePreference) {
    setPref(next);
    setThemePreference(next);
  }

  const options: ThemePreference[] = ['auto', 'light', 'dark'];

  return (
    <fieldset aria-labelledby="appearance-heading" className="space-y-3">
      <legend id="appearance-heading" className="text-lg font-semibold">
        {t('settings.appearance.heading')}
      </legend>
      <p className="text-xs text-muted-foreground">
        {t('settings.appearance.themeHint')}
      </p>
      <div className="flex gap-2">
        {options.map((opt) => (
          <label
            key={opt}
            className={
              'cursor-pointer text-sm px-3 py-1.5 rounded border focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring ' +
              (pref === opt
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-accent/50')
            }
          >
            <input
              type="radio"
              name="theme-pref"
              value={opt}
              checked={pref === opt}
              onChange={() => choose(opt)}
              className="sr-only"
            />
            {t(`settings.appearance.theme.${opt}`)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SettingsFrame({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <section className="p-8 space-y-6 max-w-3xl" aria-labelledby="settings-heading">
      <h1 id="settings-heading" className="text-2xl font-bold">
        {t('settings.title')}
      </h1>
      {children}
    </section>
  );
}

function formatRelative(ms: number): string {
  const diff = Date.now() - ms;
  const hours = diff / 36e5;
  if (hours < 1) return 'just now';
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d ago`;
  const months = days / 30;
  if (months < 12) return `${Math.round(months)}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}
