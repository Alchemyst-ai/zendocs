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
    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      // Always add Introduction as the first item
      const items: TOCItem[] = [
        { id: 'introduction', text: 'Introduction', level: 1, children: [] }
      ];
      
      // Get the actual DOM element with the content
      const contentElement = document.querySelector('.prose');
      if (!contentElement) return;

      // Add an ID to the first paragraph for Introduction
      const firstParagraph = contentElement.querySelector('p');
      if (firstParagraph && !firstParagraph.id) {
        firstParagraph.id = 'introduction';
      }
      
      // Get all H3 and H4 headings directly from the DOM
      const headings = contentElement.querySelectorAll('h3, h4');
      console.log('Found headings:', Array.from(headings).map(h => ({ text: h.textContent, id: h.id, tagName: h.tagName })));

              Array.from(headings).forEach((heading, index) => {
          const text = heading.textContent?.trim() || '';
          // Create a URL-friendly ID from the heading text
          const generatedId = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
          
          const id = heading.id || generatedId || `heading-${index}`;

          // Set the ID on the actual DOM element
          heading.setAttribute('id', id);
          
          console.log(`Set ID "${id}" on heading "${text}"`);

          const level = heading.tagName.toLowerCase() === 'h3' ? 3 : 4;
          const item = { id, text, level, children: [] };
          items.push(item);
                });

        // Verify IDs were set correctly
        setTimeout(() => {
          const verifyHeadings = contentElement.querySelectorAll('h3, h4');
          console.log('Verification - headings with IDs:', Array.from(verifyHeadings).map(h => ({ text: h.textContent, id: h.id })));
        }, 50);

        setTocItems(items);
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
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
      });
    };

    // Small delay to ensure DOM is updated
    setTimeout(() => {
      observeHeadings(tocItems);
    }, 200);

    return () => observer.disconnect();
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      setActiveId(id);
    } else {
      console.warn(`Element with ID '${id}' not found`);
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-6 space-y-6 overflow-y-auto">
      <div className="bg-zinc-950/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <h3 className="text-sm uppercase tracking-wide text-gray-300 font-medium">On this page</h3>
        </div>
        <nav className="space-y-2 pl-2 max-h-96 overflow-y-auto">
          {tocItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToHeading(item.id)}
              className={`
                block w-full text-left text-sm font-medium transition-colors duration-200 rounded-md px-3 py-2
                ${item.level === 4 ? 'ml-4' : ''}
                ${activeId === item.id 
                  ? 'bg-amber-400/10 text-amber-400' 
                  : 'text-gray-100 hover:bg-zinc-800/50 hover:text-amber-400'
                }
              `}
            >
              {item.text}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
} 