import { useMemo, useState } from 'react';
import type {
  AsistenciaFilters,
  AsistenciaRecord,
  BusquedaAsistenciasResponse,
  EstatusDisponible,
  getEstatusDisponibles,
} from '@/lib/api/asistencia.api';

// ============================================================================
// HOOK DE ESTADO: useCorreccionEstatusReducer
// ============================================================================

type LoadingKeys = 'searching' | 'loadingEstatus' | 'correcting';
type ErrorKeys = 'estatus' | 'search' | 'correction';

interface PaginationState {
  currentPage: number;
  totalPages: number;
  total: number;
}

interface CorreccionEstatusState {
  filters: AsistenciaFilters | {};
  estatusDisponibles?: EstatusDisponible[];
  loading: Record<LoadingKeys, boolean>;
  errors: Partial<Record<ErrorKeys, string>>;
  searchResults: AsistenciaRecord[];
  pagination?: PaginationState;
  selectedIds: number[];
  modalOpen: boolean;
}

interface CorreccionEstatusActions {
  setFilters: (filters: AsistenciaFilters | {}) => void;
  setEstatusDisponibles: (estatus: EstatusDisponible[]) => void;
  setLoading: (key: LoadingKeys, value: boolean) => void;
  setError: (key: ErrorKeys, message: string | undefined) => void;
  clearErrors: () => void;
  setSearchResults: (results: BusquedaAsistenciasResponse) => void;
  setSelection: (ids: number[]) => void;
  clearSelection: () => void;
  openModal: () => void;
  closeModal: () => void;
}

export function useCorreccionEstatusReducer(): {
  state: CorreccionEstatusState;
  actions: CorreccionEstatusActions;
} {
  const [filters, setFilters] = useState<AsistenciaFilters | {}>({});
  const [estatusDisponibles, setEstatusDisponibles] = useState<
    EstatusDisponible[] | undefined
  >(undefined);
  const [loading, setLoadingState] = useState<Record<LoadingKeys, boolean>>({
    searching: false,
    loadingEstatus: false,
    correcting: false,
  });
  const [errors, setErrors] = useState<Partial<Record<ErrorKeys, string>>>({});
  const [searchResults, setSearchResultsState] = useState<AsistenciaRecord[]>(
    []
  );
  const [pagination, setPagination] = useState<PaginationState | undefined>(
    undefined
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const state: CorreccionEstatusState = useMemo(
    () => ({
      filters,
      estatusDisponibles,
      loading,
      errors,
      searchResults,
      pagination,
      selectedIds,
      modalOpen,
    }),
    [
      filters,
      estatusDisponibles,
      loading,
      errors,
      searchResults,
      pagination,
      selectedIds,
      modalOpen,
    ]
  );

  const actions: CorreccionEstatusActions = useMemo(
    () => ({
      setFilters: (newFilters) => {
        setFilters(newFilters);
      },
      setEstatusDisponibles: (estatus) => setEstatusDisponibles(estatus),
      setLoading: (key, value) =>
        setLoadingState((prev) => ({ ...prev, [key]: value })),
      setError: (key, message) =>
        setErrors((prev) => ({ ...prev, [key]: message })),
      clearErrors: () => setErrors({}),
      setSearchResults: (results) => {
        setSearchResultsState(results.asistencias || []);
        setPagination({
          currentPage: results.pagina || 1,
          totalPages: results.totalPaginas || 0,
          total: results.total || 0,
        });
      },
      setSelection: (ids) => setSelectedIds(ids),
      clearSelection: () => setSelectedIds([]),
      openModal: () => setModalOpen(true),
      closeModal: () => setModalOpen(false),
    }),
    []
  );

  return { state, actions };
}
