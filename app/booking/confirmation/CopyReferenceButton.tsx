'use client';

import { useState } from 'react';

export default function CopyReferenceButton({
  reference,
}: {
  reference: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      const input = document.createElement('textarea');
      input.value = reference;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();

      const success = document.execCommand('copy');
      document.body.removeChild(input);

      if (success) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={copyReference}
      disabled={!reference}
      aria-label="Copy booking reference"
      style={{
        border: '1px solid #b9c4b3',
        background: copied ? '#e8eee5' : '#fff',
        color: '#344536',
        padding: '11px 16px',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        minWidth: 140,
      }}
    >
      {copied ? '✓ Copied' : 'Copy reference'}
    </button>
  );
}
