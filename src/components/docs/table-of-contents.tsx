import { useEffect, useState } from "react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
  children?: TOCItem[];
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Parse HTML content to extract headings
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3');
    
    const items: TOCItem[] = [];
    let currentH1: TOCItem | null = null;

    Array.from(headings).forEach((heading, index) => {
      const text = heading.textContent?.trim() || '';
      // Create a URL-friendly ID from the heading text
      const generatedId = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      
      const id = heading.id || generatedId || `heading-${index}`;
      const level = parseInt(heading.tagName.charAt(1));

      // Add or update ID in the actual content
      heading.id = id;

      const item = { id, text, level, children: [] };

      if (level === 1 || level === 2) {
        currentH1 = item;
        items.push(item);
      } else if (level === 3 && currentH1) {
        currentH1.children?.push(item);
      }
    });

    setTocItems(items);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -66%' }
    );

    const observeHeadings = (items: TOCItem[]) => {
      items.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) observer.observe(element);
        
        item.children?.forEach((child) => {
          const childElement = document.getElementById(child.id);
          if (childElement) observer.observe(childElement);
        });
      });
    };

    observeHeadings(tocItems);
    return () => observer.disconnect();
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Adjust this value based on your header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-6 space-y-6">
      <div className="bg-zinc-950/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <h3 className="text-sm uppercase tracking-wide text-gray-300 font-medium">On this page</h3>
        </div>
        <nav className="space-y-2 pl-2">
          {tocItems.map((item) => (
            <div key={item.id} className="space-y-1">
              {/* Main topic */}
              <button
                onClick={() => scrollToHeading(item.id)}
                className={`
                  block w-full text-left text-sm font-medium transition-colors duration-200 rounded-md px-3 py-2
                  ${activeId === item.id 
                    ? 'bg-amber-400/10 text-amber-400' 
                    : 'text-gray-100 hover:bg-zinc-800/50 hover:text-amber-400'
                  }
                `}
              >
                {item.text}
              </button>
              
              {/* Subtopics */}
              {item.children && item.children.length > 0 && (
                <div className="ml-4 space-y-1">
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => scrollToHeading(child.id)}
                      className={`
                        block w-full text-left text-xs transition-colors duration-200 rounded-md px-3 py-1
                        ${activeId === child.id 
                          ? 'bg-amber-400/10 text-amber-400' 
                          : 'text-gray-300 hover:bg-zinc-800/50 hover:text-amber-400'
                        }
                      `}
                    >
                      {child.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
} 