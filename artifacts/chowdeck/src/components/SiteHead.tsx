import { useEffect } from "react";
import { useGetSiteSettings } from "@workspace/api-client-react";

export function SiteHead() {
  const { data: settings } = useGetSiteSettings();

  useEffect(() => {
    if (!settings) return;
    const s = settings as Record<string, string>;

    if (s.meta_title) {
      document.title = s.meta_title;
    }

    const setMeta = (name: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const setOgMeta = (property: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta("description", s.meta_description || "");
    setMeta("keywords", s.meta_keywords || "");
    setOgMeta("og:title", s.meta_title || s.site_name || "");
    setOgMeta("og:description", s.meta_description || "");
    setOgMeta("og:type", "website");
    if (s.og_image_url) setOgMeta("og:image", s.og_image_url);
    setOgMeta("twitter:card", "summary_large_image");
    setOgMeta("twitter:title", s.meta_title || s.site_name || "");
    setOgMeta("twitter:description", s.meta_description || "");
    if (s.og_image_url) setOgMeta("twitter:image", s.og_image_url);

    if (s.site_favicon_url) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = s.site_favicon_url;
    }

    if (s.google_analytics_id && !document.querySelector("script[data-ga]")) {
      const script1 = document.createElement("script");
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${s.google_analytics_id}`;
      script1.setAttribute("data-ga", "true");
      document.head.appendChild(script1);

      const script2 = document.createElement("script");
      script2.setAttribute("data-ga", "inline");
      script2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${s.google_analytics_id}');`;
      document.head.appendChild(script2);
    }

    if (s.google_tag_manager_id && !document.querySelector("script[data-gtm]")) {
      const script = document.createElement("script");
      script.setAttribute("data-gtm", "true");
      script.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${s.google_tag_manager_id}');`;
      document.head.appendChild(script);
    }

    if (s.facebook_pixel_id && !document.querySelector("script[data-fbp]")) {
      const script = document.createElement("script");
      script.setAttribute("data-fbp", "true");
      script.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${s.facebook_pixel_id}');fbq('track','PageView');`;
      document.head.appendChild(script);
    }

    if (s.hotjar_id && !document.querySelector("script[data-hj]")) {
      const script = document.createElement("script");
      script.setAttribute("data-hj", "true");
      script.textContent = `(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${s.hotjar_id},hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=6');`;
      document.head.appendChild(script);
    }

    if (s.custom_head_scripts && !document.querySelector("[data-custom-head]")) {
      const container = document.createElement("div");
      container.setAttribute("data-custom-head", "true");
      container.innerHTML = s.custom_head_scripts;
      const scripts = container.querySelectorAll("script");
      scripts.forEach(origScript => {
        const newScript = document.createElement("script");
        Array.from(origScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.textContent = origScript.textContent;
        document.head.appendChild(newScript);
      });
      const nonScripts = container.querySelectorAll(":not(script)");
      nonScripts.forEach(el => document.head.appendChild(el.cloneNode(true)));
    }
  }, [settings]);

  return null;
}
