import { PropertyEditor } from "../../property-editor";

export default function OwnerPropertyEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <OwnerPropertyEditLoader params={params} />;
}

async function OwnerPropertyEditLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PropertyEditor propertyId={id} />;
}
