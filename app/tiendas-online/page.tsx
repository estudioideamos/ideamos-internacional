import ShopPage from "../../components/ShopPage";
import PageStructuredData from "../../components/PageStructuredData";

export default function Page() {
  return <>
    <PageStructuredData
      name="Tiendas online profesionales"
      description="Creamos tiendas online profesionales, administrables, con pagos y envíos integrados, sin comisiones de Ideamos por cada venta."
      path="/tiendas-online/"
      serviceType="Diseño y desarrollo de tiendas online"
    />
    <ShopPage />
  </>;
}
