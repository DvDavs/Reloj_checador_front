import { LoadingState } from "@/app/components/shared/loading-state";

export default function Loading() {
  return (
    <div className="p-6 md:p-8">
      <LoadingState message="Cargando empleados..." />
    </div>
  );
}

