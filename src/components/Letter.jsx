import PixelIcon from './PixelIcon.jsx';
import '../styles/letter.css';

/* A long-form letter panel. Used for the song dedication and the closing note
 * under the 101 reasons.
 *
 * `paragraphs` is one string per paragraph. A paragraph wrapped entirely in
 * "double quotes" renders as a centred pull quote instead of body text —
 * quotes used mid-sentence are left alone. Newlines inside a paragraph are
 * preserved, so a stanza can be written as one entry.
 */

export const isPullQuote = (para) => {
  const t = String(para).trim();
  return t.length > 2 && t.startsWith('"') && t.endsWith('"');
};

export default function Letter({
  label,
  forName,
  paragraphs = [],
  signature = '',
  accent,
  scroll = false,
}) {
  const list = Array.isArray(paragraphs) ? paragraphs : paragraphs ? [paragraphs] : [];
  if (list.length === 0) return null;

  return (
    <section
      className={'letter px-box' + (scroll ? ' letter--scroll' : '')}
      style={accent ? { '--bc': accent } : undefined}
    >
      <header className="letter__head">
        <PixelIcon name="heart" size={11} color="var(--ink)" />
        {label}
        <span className="topbar__spacer" />
        {forName && <span className="letter__for">FOR {forName}</span>}
      </header>

      <div className="letter__body">
        {list.map((para, i) =>
          isPullQuote(para) ? (
            <blockquote key={i} className="letter__quote">
              <span className="letter__mark" aria-hidden="true">
                <PixelIcon name="heart" size={12} color="var(--ink)" />
              </span>
              <span className="glow-gold">{para.trim().slice(1, -1)}</span>
              <span className="letter__mark" aria-hidden="true">
                <PixelIcon name="heart" size={12} color="var(--ink)" />
              </span>
            </blockquote>
          ) : (
            <p key={i} className="letter__p">
              {para}
            </p>
          )
        )}

        {signature && <p className="letter__sign">— {signature}</p>}
      </div>
    </section>
  );
}
