import { useEffect } from "react";

interface PageMeta {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  jsonLd?: Record<string, any>;
}

export function usePageMeta(meta: PageMeta) {
  useEffect(() => {
    if (meta.title) {
      document.title = meta.title;
    }

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    if (meta.description) {
      setMeta("name", "description", meta.description);
      setMeta("property", "og:description", meta.description);
      setMeta("name", "twitter:description", meta.description);
    }

    if (meta.title) {
      setMeta("property", "og:title", meta.title);
      setMeta("name", "twitter:title", meta.title);
    }

    if (meta.ogImage) {
      setMeta("property", "og:image", meta.ogImage);
      setMeta("name", "twitter:image", meta.ogImage);
    }

    if (meta.canonicalPath) {
      let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = `https://chowhub.gh${meta.canonicalPath}`;
    }

    if (meta.jsonLd) {
      const existing = document.querySelector("script[data-page-jsonld]");
      if (existing) existing.remove();

      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-page-jsonld", "true");
      script.textContent = JSON.stringify(meta.jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const el = document.querySelector("script[data-page-jsonld]");
      if (el) el.remove();
    };
  }, [meta.title, meta.description, meta.canonicalPath, meta.ogImage, meta.jsonLd]);
}
