import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock react-i18next so tests don't depend on the full i18n init.
// The component doesn't need rendered strings — we assert via roles
// and aria labels, not literal copy. Any `t(key)` returns the key.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, string>) =>
      vars ? `${key}:${JSON.stringify(vars)}` : key,
  }),
}));

// Mock the generated commands module. Vitest hoists `vi.mock`, so
// these live-bound mocks get defined before the component imports.
const getConfig = vi.fn();
const listObsidianVaults = vi.fn();
const updateConfig = vi.fn();
const rebuildFromVault = vi.fn();

vi.mock('../lib/bindings', () => ({
  commands: {
    getConfig: (...a: unknown[]) => getConfig(...a),
    listObsidianVaults: (...a: unknown[]) => listObsidianVaults(...a),
    updateConfig: (...a: unknown[]) => updateConfig(...a),
    rebuildFromVault: (...a: unknown[]) => rebuildFromVault(...a),
  },
}));

const loadNotes = vi.fn();
vi.mock('../lib/store', () => ({
  useAppStore: <T,>(selector: (s: { loadNotes: typeof loadNotes }) => T) =>
    selector({ loadNotes }),
}));

import { SettingsView } from './SettingsView';

const BASE_CONFIG = {
  vault_path: 'C:/Users/me/coxinha',
  locale: '',
  transcriber: { engine: 'none' },
  diarizer: { engine: 'none' },
  llm: { kind: 'ollama', endpoint: 'http://localhost:11434', model: 'llama3.2:3b' },
  autostart: false,
  shortcuts: {
    new_note: 'Ctrl+Alt+N',
    open_app: 'Ctrl+Alt+C',
    agenda: 'Ctrl+Alt+A',
    meetings: 'Ctrl+Alt+M',
    toggle_recording: 'Ctrl+Alt+R',
  },
};

beforeEach(() => {
  getConfig.mockReset();
  listObsidianVaults.mockReset();
  updateConfig.mockReset();
  rebuildFromVault.mockReset();
  loadNotes.mockReset();
});

describe('SettingsView — vault panel', () => {
  it('renders the empty-state when no Obsidian vaults are detected', async () => {
    getConfig.mockResolvedValue({ status: 'ok', data: BASE_CONFIG });
    listObsidianVaults.mockResolvedValue({ status: 'ok', data: [] });

    render(<SettingsView />);

    await waitFor(() =>
      expect(screen.getByText('settings.vault.noObsidian')).toBeInTheDocument()
    );
    expect(screen.getByText('C:/Users/me/coxinha')).toBeInTheDocument();
  });

  it('lists detected vaults as radio options and keeps Save disabled until selection changes', async () => {
    getConfig.mockResolvedValue({ status: 'ok', data: BASE_CONFIG });
    listObsidianVaults.mockResolvedValue({
      status: 'ok',
      data: [
        {
          id: 'v1',
          name: 'Work',
          path: 'C:/Users/me/Documents/Work',
          last_opened_ms: Date.now() - 3600_000,
          exists: true,
        },
      ],
    });

    render(<SettingsView />);

    const radio = await screen.findByRole('radio', { name: /Work/ });
    const save = screen.getByRole('button', { name: /settings\.vault\.save/ });

    expect(save).toBeDisabled();

    await userEvent.click(radio);

    expect(radio).toBeChecked();
    expect(save).toBeEnabled();
  });

  it('calls updateConfig with the picked vault path on Save', async () => {
    getConfig.mockResolvedValue({ status: 'ok', data: BASE_CONFIG });
    listObsidianVaults.mockResolvedValue({
      status: 'ok',
      data: [
        {
          id: 'v1',
          name: 'Ideas',
          path: 'D:/Vaults/ideas',
          last_opened_ms: null,
          exists: true,
        },
      ],
    });
    updateConfig.mockResolvedValue({ status: 'ok', data: null });

    render(<SettingsView />);

    const radio = await screen.findByRole('radio', { name: /Ideas/ });
    await userEvent.click(radio);
    await userEvent.click(screen.getByRole('button', { name: /settings\.vault\.save/ }));

    await waitFor(() =>
      expect(updateConfig).toHaveBeenCalledWith(
        expect.objectContaining({ vault_path: 'D:/Vaults/ideas' })
      )
    );
    expect(await screen.findByText('settings.vault.saved')).toBeInTheDocument();
  });

  it('surfaces load errors from getConfig in an alert', async () => {
    getConfig.mockResolvedValue({ status: 'error', error: 'boom' });
    listObsidianVaults.mockResolvedValue({ status: 'ok', data: [] });

    render(<SettingsView />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('boom');
  });

  it('rebuilds the index, shows the stats, and reloads notes', async () => {
    getConfig.mockResolvedValue({ status: 'ok', data: BASE_CONFIG });
    listObsidianVaults.mockResolvedValue({ status: 'ok', data: [] });
    rebuildFromVault.mockResolvedValue({
      status: 'ok',
      data: { notes_indexed: 42, links_indexed: 7, notes_skipped: 0 },
    });

    render(<SettingsView />);

    const button = await screen.findByRole('button', { name: /settings\.vault\.rebuild/ });
    await userEvent.click(button);

    await waitFor(() => expect(rebuildFromVault).toHaveBeenCalledOnce());
    expect(loadNotes).toHaveBeenCalledOnce();
    const status = await screen.findByRole('status');
    expect(status.textContent).toContain('42');
    expect(status.textContent).toContain('7');
  });

  it('surfaces rebuild errors without touching the note store', async () => {
    getConfig.mockResolvedValue({ status: 'ok', data: BASE_CONFIG });
    listObsidianVaults.mockResolvedValue({ status: 'ok', data: [] });
    rebuildFromVault.mockResolvedValue({ status: 'error', error: 'disk full' });

    render(<SettingsView />);

    await userEvent.click(
      await screen.findByRole('button', { name: /settings\.vault\.rebuild/ }),
    );

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('disk full');
    expect(loadNotes).not.toHaveBeenCalled();
  });
});
