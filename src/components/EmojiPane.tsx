import React, { useMemo, useState } from 'react';

type EmojiCategory = {
  name: string;
  emojis: string[];
};

const EMOJI_CATEGORIES: EmojiCategory[] = [
  { name: 'Headings', emojis: ['🏛️','🏢','🗞️','📰','📅','🧭','💼','🎓','🏆'] },
  { name: 'Status', emojis: ['🚨','🛎️','⚠️','❗','🔔','🆕','🔄','✅','❌'] },
  { name: 'Markets', emojis: ['📈','📉','📊','💹','🧮'] },
  { name: 'Finance', emojis: ['💰','💵','💸','🪙','🏦','🧾','💳'] },
  { name: 'Content', emojis: ['📝','✍️','🖋️','📌','🖼️','🎥','🔗','➡️'] },
  { name: 'Community', emojis: ['👥','🤝','🗣️','💬','📣'] },
  { name: 'Awards', emojis: ['🏆','🥇','🎖️','🥈'] },
  { name: 'Education', emojis: ['🎓','📚','🧠','🧪'] },
  { name: 'Tools', emojis: ['💻','🖥️','📱','🧰','⚙️','🧩'] },
];

function insertIntoInputOrTextarea(el: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const before = el.value.slice(0, start);
  const after = el.value.slice(end);
  el.value = before + text + after;
  const newPos = start + text.length;
  el.selectionStart = el.selectionEnd = newPos;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertIntoContentEditable(text: string) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  // Move caret after inserted node
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  return true;
}

function tryInsertEmoji(emoji: string, setToast: (msg: string)=>void) {
  const active = document.activeElement as HTMLElement | null;
  if (!active) {
    navigator.clipboard.writeText(emoji).then(() => setToast('Copied. Click a field and paste.'));
    return;
  }
  const tag = active.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea') {
    insertIntoInputOrTextarea(active as HTMLInputElement, emoji);
    return;
  }
  const isCE = active.getAttribute?.('contenteditable') === 'true' || active.classList?.contains('ql-editor');
  if (isCE) {
    const ok = insertIntoContentEditable(emoji);
    if (!ok) navigator.clipboard.writeText(emoji).then(() => setToast('Copied. Click editor and paste.'));
    return;
  }
  navigator.clipboard.writeText(emoji).then(() => setToast('Copied. Click a field and paste.'));
}

const EmojiPane: React.FC = () => {
  const [open, setOpen] = useState<boolean>(true);
  const [toast, setToast] = useState<string>('');

  const categories = useMemo(() => EMOJI_CATEGORIES, []);

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 10000 }}>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-secondary"
        style={{ display: 'block', marginLeft: 'auto', background: '#d4af37', color: '#0d1117', border: '1px solid #b8941f', fontWeight: 700 }}
      >
        {open ? 'Close Emojis' : 'Emojis'}
      </button>

      {/* Pane */}
      {open && (
        <div
          style={{
            marginTop: 8,
            width: 320,
            maxHeight: 420,
            overflow: 'auto',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            padding: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Emoji Picker</div>
          {categories.map((cat) => (
            <div key={cat.name} style={{ marginBottom: 10 }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6 }}>{cat.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {cat.emojis.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => tryInsertEmoji(e, (msg)=>{ setToast(msg); setTimeout(()=>setToast(''), 1500); })}
                    title={e}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      fontSize: 20,
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Tip: Win + . opens Windows emoji picker.</div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: open ? 440 : 56,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default EmojiPane;


