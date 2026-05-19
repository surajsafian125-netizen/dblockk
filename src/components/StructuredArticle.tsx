import ReactMarkdown, { Components } from 'react-markdown';

interface Section {
  key: 'hook' | 'introduction' | 'deepdive' | 'takeaway' | 'other';
  title: string;
  body: string;
}

const SECTION_MAP: Record<string, Section['key']> = {
  hook: 'hook',
  'the hook': 'hook',
  introduction: 'introduction',
  'the introduction': 'introduction',
  intro: 'introduction',
  'deep dive': 'deepdive',
  'the deep dive': 'deepdive',
  takeaway: 'takeaway',
  'the takeaway': 'takeaway',
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[:*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const parseSections = (content: string): Section[] => {
  // Split on markdown ## headers OR plain "The Hook:" style lines at line start
  const lines = content.split('\n');
  const sections: Section[] = [];
  let current: Section | null = null;

  const flush = () => {
    if (current) {
      current.body = current.body.trim();
      if (current.body || current.key !== 'other') sections.push(current);
      current = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    // Match "## Heading" or "### Heading"
    const mdHeader = trimmed.match(/^#{1,6}\s+(.+?)\s*:?\s*$/);
    // Match "**The Hook:**" or "The Hook:" (heading-only line)
    const boldHeader = trimmed.match(/^\*\*\s*(.+?)\s*:?\s*\*\*\s*:?\s*$/);
    const plainHeader = trimmed.match(/^(the hook|hook|the introduction|introduction|intro|the deep dive|deep dive|the takeaway|takeaway)\s*:?\s*$/i);

    const headerText = mdHeader?.[1] || boldHeader?.[1] || plainHeader?.[1];
    if (headerText) {
      const key = SECTION_MAP[normalize(headerText)];
      if (key) {
        flush();
        current = { key, title: headerText, body: '' };
        continue;
      }
    }

    if (!current) {
      current = { key: 'other', title: '', body: '' };
    }
    current.body += line + '\n';
  }
  flush();

  return sections;
};

const mdComponents = (title: string): Components => ({
  img: ({ alt, ...props }) => (
    <img {...props} alt={alt || title} loading="lazy" className="w-full rounded-xl object-cover shadow-lg my-4" />
  ),
});

const StructuredArticle = ({ content, title }: { content: string; title: string }) => {
  const sections = parseSections(content);

  // If no recognized sections, fall back to plain markdown
  const recognized = sections.some(s => s.key !== 'other');
  if (!recognized) {
    return (
      <div className="mb-6 prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
        <ReactMarkdown components={mdComponents(title)}>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-5">
      {sections.map((section, i) => {
        if (!section.body) return null;
        const md = (extraProseClass = '') => (
          <div className={`prose prose-sm max-w-none dark:prose-invert prose-strong:text-foreground prose-a:text-primary ${extraProseClass}`}>
            <ReactMarkdown components={mdComponents(title)}>{section.body}</ReactMarkdown>
          </div>
        );

        switch (section.key) {
          case 'hook':
            return (
              <div key={i} className="italic text-lg sm:text-xl text-foreground font-medium leading-relaxed prose-p:text-foreground prose-p:m-0">
                {md('prose-p:text-foreground prose-p:!my-0')}
              </div>
            );
          case 'introduction':
            return (
              <div key={i} className="border-l-2 border-primary/60 pl-4 text-base sm:text-lg text-foreground/90 leading-relaxed">
                {md('prose-base prose-p:text-foreground/90')}
              </div>
            );
          case 'deepdive':
            return (
              <div key={i} className="prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4">
                {md('prose-p:text-muted-foreground prose-p:leading-relaxed')}
              </div>
            );
          case 'takeaway':
            return (
              <div key={i} className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4 mt-2">
                <div className="text-xs uppercase tracking-widest text-primary/80 mb-2 font-display">Takeaway</div>
                {md('prose-p:text-foreground/90 prose-p:!my-0')}
              </div>
            );
          default:
            return <div key={i}>{md('prose-p:text-muted-foreground')}</div>;
        }
      })}
    </div>
  );
};

export default StructuredArticle;
