// AI 応答用の最小マークダウン描画（##見出し・- 箇条書き・**強調**・段落）。
export default function MiniMarkdown({ text }) {
  if (!text) return null;
  const blocks = [];
  let list = null;
  const lines = text.replace(/\r/g, "").split("\n");

  const flush = (key) => {
    if (list) {
      blocks.push(<ul className="md__ul" key={`ul-${key}`}>{list}</ul>);
      list = null;
    }
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush(i);
      return;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flush(i);
      const level = h[1].length;
      blocks.push(
        <p className={`md__h md__h${level}`} key={i}>{inline(h[2])}</p>
      );
      return;
    }
    const li = line.match(/^[-*・]\s+(.*)$/);
    if (li) {
      if (!list) list = [];
      list.push(<li key={i}>{inline(li[1])}</li>);
      return;
    }
    flush(i);
    blocks.push(<p className="md__p" key={i}>{inline(line)}</p>);
  });
  flush("end");
  return <div className="md">{blocks}</div>;
}

// **強調** のみ対応
function inline(s) {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    const m = p.match(/^\*\*([^*]+)\*\*$/);
    return m ? <strong key={i}>{m[1]}</strong> : <span key={i}>{p}</span>;
  });
}
