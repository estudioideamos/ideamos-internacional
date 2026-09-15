import { SITE_NAME, SITE_URL } from "../lib/seo";

type PageType = "WebPage" | "CollectionPage" | "ContactPage";

type PageStructuredDataProps = {
  name: string;
  description: string;
  path: `/${string}`;
  pageType?: PageType;
  serviceType?: string;
};

export default function PageStructuredData({
  name,
  description,
  path,
  pageType = "WebPage",
  serviceType,
}: PageStructuredDataProps) {
  const url = `${SITE_URL}${path}`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": pageType,
      "@id": `${url}#webpage`,
      url,
      name,
      description,
      inLanguage: "es-AR",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: serviceType
        ? { "@id": `${url}#service` }
        : { "@id": `${SITE_URL}/#organization` },
      breadcrumb: { "@id": `${url}#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: SITE_NAME,
          item: `${SITE_URL}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name,
          item: url,
        },
      ],
    },
  ];

  if (serviceType) {
    graph.push({
      "@type": "Service",
      "@id": `${url}#service`,
      name,
      serviceType,
      description,
      url,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: ["Argentina", "Uruguay", "España", "Estados Unidos", "México"],
      availableChannel: {
        "@type": "ServiceChannel",
        serviceUrl: `${SITE_URL}/contacto/`,
        servicePhone: "+54 9 11 6875-8285",
      },
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }).replace(/</g, "\\u003c"),
      }}
    />
  );
}
