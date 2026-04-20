# Route tree

Open this file in VSCode and run the built-in Markdown preview
(Ctrl+Shift+V). Mermaid diagrams render inline.

```mermaid
flowchart TD
  root(["__root · RootLayout<br/>Sidebar + Outlet"])
  index["/ · redirect"]
  notes["/notes · layout"]
  notesIdx["/notes (index)<br/><i>empty-state editor on transient draft</i>"]
  noteDetail["/notes/$noteId<br/><i>loader: queryClient.ensureQueryData(['note', id])</i>"]
  agenda["/agenda · AgendaRoute"]
  meetings["/meetings · MeetingsRoute"]
  settings["/settings · SettingsRoute"]

  root --> index
  root --> notes
  root --> agenda
  root --> meetings
  root --> settings

  notes --> notesIdx
  notes --> noteDetail

  index -. redirect .-> notesIdx

  classDef edit fill:#ecfccb,stroke:#65a30d;
  classDef soon fill:#fef3c7,stroke:#ca8a04;
  class notesIdx,noteDetail edit
  class agenda,meetings,settings soon
```

## Who triggers what

```mermaid
sequenceDiagram
  autonumber
  participant OS as OS shortcut
  participant Rust as shortcuts.rs
  participant Evt as events.navigate
  participant Root as __root useEffect
  participant R as router
  participant Editor as NoteEditor

  OS->>Rust: Ctrl+Alt+Shift+N press
  Rust->>Evt: emit Navigate { route: NotesNew }
  Evt-->>Root: listen payload
  Root->>R: newNote() → router.navigate /notes/$id
  R->>Editor: mount with loaderData
  Editor-->>Root: mark('editor-ready') · logNewNoteTrace
```

## Notes

- Memory history on Tauri desktop; URL is internal (no address bar).
- `/` → redirect to `/notes` keeps the sidebar's Notes nav coherent
  with "the default view".
- `$noteId` loader pre-warms the React Query cache so the `NoteEditor`
  renders without a second IPC roundtrip.
- `AgendaRoute` / `MeetingsRoute` / `SettingsRoute` stay thin — they
  mount the feature component under `src/features/<domain>/`.
