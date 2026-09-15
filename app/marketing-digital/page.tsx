import MarketingDigitalPage from "../../components/MarketingDigitalPage";
import PageStructuredData from "../../components/PageStructuredData";
import { createPageMetadata } from "../../lib/seo";
import "./marketing.css";

export const metadata = createPageMetadata({
  title: "Marketing digital para generar ventas | Ideamos",
  description: "Estrategias de marketing digital, contenidos y campañas para atraer leads calificados, optimizar resultados y hacer crecer tus ventas.",
  path: "/marketing-digital/",
});

export default function Page() {
  return <>
    <PageStructuredData
      name="Marketing digital para generar ventas"
      description="Estrategias de marketing digital, contenidos y campañas para atraer leads calificados, optimizar resultados y hacer crecer tus ventas."
      path="/marketing-digital/"
      serviceType="Marketing digital"
    />
    <MarketingDigitalPage />
  </>;
}
