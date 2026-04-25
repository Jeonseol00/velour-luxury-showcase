import { useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { isAnalyzing, oracleResult, analyzeMemory } from '../store/synesthesiaStore';

export default function GenerativeOracle() {
  const analyzing = useStore(isAnalyzing);
  const result = useStore(oracleResult);
  const [memory, setMemory] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (memory.trim().length < 10) {
      setError('Please provide a more detailed memory.');
      return;
    }
    setError('');
    analyzeMemory(memory);
  }, [memory]);

  const handleReset = useCallback(() => {
    // We cannot reset the store directly without an action, but we can call a reset function if we want.
    // For simplicity, we just reload the page or reset state.
    window.location.reload(); 
  }, []);

  return (
    <div className="oracle__panel" role="form" aria-label="Generative Synesthesia Engine">
      {!analyzing && !result && (
        <form onSubmit={handleSubmit} style={{ animation: 'fadeReveal 0.8s ease forwards' }}>
          <p className="oracle__question-num">SYN-ENG // v2.0</p>
          <h3 className="oracle__question">What memory do you want to keep forever?</h3>
          
          <textarea
            className="oracle__textarea"
            placeholder="e.g. Walking through a pine forest after a heavy rain..."
            value={memory}
            onChange={(e) => setMemory(e.target.value)}
            disabled={analyzing}
            spellCheck="false"
          />
          {error && <p style={{ color: 'hsl(0, 65%, 55%)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-sm)' }}>{error}</p>}
          
          <div style={{ marginTop: 'var(--space-xl)', textAlign: 'right' }}>
            <button type="submit" className="btn-gold" disabled={!memory.trim()}>
              Initialize Engine
            </button>
          </div>
        </form>
      )}

      {analyzing && (
        <div className="oracle__loading">
          <div className="oracle__spinner" aria-label="Analyzing memory..."></div>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
            <p style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', letterSpacing: '0.1em' }}>
              EXTRACTING SENTIMENT...
            </p>
            <p style={{ color: 'var(--color-text-dim)', fontStyle: 'italic', fontSize: 'var(--text-sm)', marginTop: 'var(--space-xs)' }}>
              Synthesizing molecular structure based on semantic weight
            </p>
          </div>
        </div>
      )}

      {result && !analyzing && (
        <div className="oracle__result" style={{ animation: 'fadeReveal 0.8s ease forwards' }}>
          <p style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--color-text-dim)', marginBottom: 'var(--space-lg)' }}>
            Your Memory, Distilled
          </p>
          <h3 className="oracle__result-name">{result.name}</h3>
          <p className="oracle__result-desc">{result.description}</p>
          
          <div className="pill-row" style={{ margin: 'var(--space-xl) 0' }}>
            {result.notes.map(note => <span key={note} className="pill">{note}</span>)}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-gold">Acquire Formula</button>
            <button type="button" className="btn-outline" onClick={handleReset}>New Memory</button>
          </div>
        </div>
      )}
    </div>
  );
}
