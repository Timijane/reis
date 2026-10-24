'use client';

export default function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 20px',
        background: '#405641',
        color: '#fff',
        border: '1px solid #405641',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      Print receipt / Save as PDF
    </button>
  );
}
