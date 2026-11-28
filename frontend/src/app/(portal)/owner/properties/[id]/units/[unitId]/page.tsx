import { UnitEditor } from "../../../unit-editor";

export default function OwnerUnitPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  return <OwnerUnitLoader params={params} />;
}

async function OwnerUnitLoader({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;
  return <UnitEditor propertyId={id} unitId={unitId} />;
}
