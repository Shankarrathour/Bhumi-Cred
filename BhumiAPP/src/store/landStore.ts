import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/apiClient';

export interface SoilDetails {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  moisture: number;
  organicCarbon: number;
  healthRating: 'Excellent' | 'Good' | 'Average' | 'Poor';
}

export interface LandPlot {
  id: string;
  acres: number;
  cropType: string;
  soilType: string;
  irrigationType: string;
  status: string;
  remarks?: string;
  correctionFields?: string[];
  geoCoords: { latitude: number; longitude: number };
  boundaryPolygon?: { latitude: number; longitude: number }[];
  documentName: string;
  registrationDate: string;
  soilDetails: SoilDetails;
  
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  gramPanchayat?: string;
  vikashKhand?: string;
  village?: string;
  fullAddress?: string;
  landmark?: string;
  khasraNumber?: string;
  landDocumentUrl?: string;
  landPhotoUrls?: string[];
  landType?: string;
  name?: string;
  ownershipType?: string;
  areaUnit?: string;
  plantationDate?: string;
  trees?: {
    species: string;
    count: number;
    ageBracket: string;
    locationOnParcel: string;
    photoUri?: string;
  }[];
}

interface LandState {
  plots: LandPlot[];
  isLoading: boolean;
  fetchPlots: () => Promise<void>;
  addPlot: (plot: Omit<LandPlot, 'id' | 'status' | 'registrationDate' | 'soilDetails'>) => Promise<void>;
  updatePlotStatus: (id: string, status: LandPlot['status']) => void;
  deletePlot: (id: string) => void;
  resetLandStore: () => void;
}

const mockSoil = (): SoilDetails => ({
  nitrogen: Math.floor(Math.random() * 50) + 100,
  phosphorus: Math.floor(Math.random() * 20) + 30,
  potassium: Math.floor(Math.random() * 80) + 150,
  ph: parseFloat((Math.random() * 1.5 + 6.0).toFixed(1)),
  moisture: Math.floor(Math.random() * 15) + 20,
  organicCarbon: parseFloat((Math.random() * 0.4 + 0.5).toFixed(2)),
  healthRating: 'Good',
});

export const useLandStore = create<LandState>()(
  persist(
    (set, get) => ({
      plots: [],
      isLoading: false,

      fetchPlots: async () => {
        set({ isLoading: true });
        try {
          const { data: response } = await api.get('/farmer/land');
          const backendPlots = response?.data?.parcels || [];
          const currentPlots = get().plots;
          const backendIds = new Set(backendPlots.map((bp: any) => bp.id));

          // The backend response is scoped to the authenticated farmer and is the
          // source of truth. Rebuild the list from it (instead of merging into the
          // previous state) so a stale/other account's plots can't linger in a
          // persisted store across logins.
          const mappedPlots: LandPlot[] = backendPlots.map((bp: any) => {
            const existing = currentPlots.find(lp => lp.id === bp.id);
            let rawStatus = (bp.verification_status || 'pending').toLowerCase();
            let mappedStatus = 'Pending Verification';
            if (rawStatus === 'verified' || rawStatus === 'approved') mappedStatus = 'Approved';
            else if (rawStatus === 'project_assigned') mappedStatus = 'Project Assigned';
            else if (rawStatus === 'correction_required') mappedStatus = 'Correction Required';
            else if (rawStatus === 'under_review' || rawStatus === 'auditing') mappedStatus = 'Under Review';
            else if (rawStatus === 'rejected') mappedStatus = 'Rejected';
            else if (rawStatus === 'submitted' || rawStatus === 'pending') mappedStatus = 'Submitted';
            else mappedStatus = bp.verification_status || 'Submitted';

            return {
              id: bp.id,
              acres: bp.area_acres ?? existing?.acres ?? 0,
              cropType: bp.crop_type || existing?.cropType || 'Unknown',
              soilType: bp.soil_type || existing?.soilType || 'Unknown',
              irrigationType: bp.is_irrigated ? 'Irrigated' : 'None',
              status: mappedStatus as any,
              remarks: bp.verification_remarks || undefined,
              geoCoords: bp.coordinates || existing?.geoCoords || { latitude: 0, longitude: 0 },
              boundaryPolygon: bp.boundary_polygon || existing?.boundaryPolygon || [],
              documentName: bp.land_document_url || existing?.documentName || '',
              landDocumentUrl: bp.land_document_url || undefined,
              landPhotoUrls: bp.land_photo_urls || [],
              registrationDate: bp.created_at || existing?.registrationDate || new Date().toISOString(),
              soilDetails: existing?.soilDetails || mockSoil(),
              country: bp.country,
              state: bp.state,
              district: bp.district,
              city: bp.city,
              gramPanchayat: bp.gram_panchayat,
              vikashKhand: bp.vikash_khand,
              village: bp.village,
              fullAddress: bp.full_address,
              landmark: bp.landmark,
              correctionFields: bp.correction_fields || undefined,
              khasraNumber: bp.khasra_number || existing?.khasraNumber,
              landType: bp.land_type || existing?.landType,
              name: bp.name || existing?.name || `Plot in ${bp.village || 'Farm'}`,
              ownershipType: bp.ownership_type || existing?.ownershipType || 'Own',
              areaUnit: bp.area_unit || existing?.areaUnit || 'Acre',
              plantationDate: bp.plantation_date || existing?.plantationDate || '',
              trees: bp.trees ? bp.trees.map((t: any) => ({
                species: t.species,
                count: t.count,
                ageBracket: t.age_bracket || t.ageBracket,
                locationOnParcel: t.location_on_parcel || t.locationOnParcel,
                photoUri: t.photo_uri || t.photoUri
              })) : [],
            } as LandPlot;
          });

          // Preserve plots that only exist locally because the backend add call
          // failed (temporary `LND-` id, never synced) — everything else must come
          // from the farmer-scoped backend response above.
          const unsyncedLocalPlots = currentPlots.filter(
            lp => lp.id.startsWith('LND-') && !backendIds.has(lp.id)
          );

          set({ plots: [...mappedPlots, ...unsyncedLocalPlots], isLoading: false });
        } catch (err) {
          console.log('[landStore] fetchPlots API offline or expired token, using local plots');
          set({ isLoading: false });
        }
      },

      addPlot: async (plotData) => {
        set({ isLoading: true });

        const isIrrigated = plotData.irrigationType.toLowerCase() !== 'none' &&
          plotData.irrigationType.trim() !== '';

        // Helper to sync all plots to window.localStorage for BhumiAdmin dashboard sync
        const syncToAdminLocalStorage = (plots: LandPlot[]) => {
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              const existing = window.localStorage.getItem('bhumicred_land_store');
              const parsedExisting = existing ? JSON.parse(existing) : {};
              parsedExisting.state = { ...(parsedExisting.state || {}), plots };
              parsedExisting.version = 0;
              window.localStorage.setItem('bhumicred_land_store', JSON.stringify(parsedExisting));
              console.log('[landStore] Synced', plots.length, 'plots to Admin localStorage');
            }
          } catch (e) {
            // Not in web context, skip
          }
        };

        try {
          const { data: response } = await api.post('/farmer/land', {
            area_acres: plotData.acres,
            is_irrigated: isIrrigated,
            country: plotData.country,
            state: plotData.state,
            district: plotData.district,
            city: plotData.city,
            gram_panchayat: plotData.gramPanchayat,
            vikash_khand: plotData.vikashKhand,
            village: plotData.village,
            name: plotData.name,
            ownership_type: plotData.ownershipType,
            area_unit: plotData.areaUnit,
            plantation_date: plotData.plantationDate,
            full_address: plotData.fullAddress,
            landmark: plotData.landmark,
            khasra_number: plotData.khasraNumber,
            coordinates: plotData.geoCoords ? {
              latitude: plotData.geoCoords.latitude,
              longitude: plotData.geoCoords.longitude
            } : null,
            boundary_polygon: plotData.boundaryPolygon && plotData.boundaryPolygon.length > 0
              ? plotData.boundaryPolygon
              : null,
            land_type: plotData.landType,
            crop_type: plotData.cropType,
            soil_type: plotData.soilType,
            land_document_url: plotData.landDocumentUrl || undefined,
            land_photo_urls: plotData.landPhotoUrls || [],
            trees: plotData.trees ? plotData.trees.map((t: any) => ({
              species: t.species,
              count: t.count,
              age_bracket: t.ageBracket,
              location_on_parcel: t.locationOnParcel,
              photo_uri: t.photoUri
            })) : [],
          });

          const savedParcel = response.data;
          const newPlot: LandPlot = {
            ...plotData,
            id: savedParcel?.data?.id ?? savedParcel?.id ?? `LND-${Math.floor(Math.random() * 9000) + 1000}`,
            status: 'Pending Verification',
            registrationDate: new Date().toISOString().split('T')[0],
            soilDetails: mockSoil(),
          };

          const updatedPlots = [...get().plots, newPlot];
          set({ plots: updatedPlots, isLoading: false });
          syncToAdminLocalStorage(updatedPlots);
        } catch (err) {
          console.log('[landStore] addPlot backend offline or expired token, saved plot locally');

          const newPlot: LandPlot = {
            ...plotData,
            id: `LND-${Math.floor(Math.random() * 9000) + 1000}`,
            status: 'Pending Verification',
            registrationDate: new Date().toISOString().split('T')[0],
            soilDetails: mockSoil(),
          };
          const updatedPlots = [...get().plots, newPlot];
          set({ plots: updatedPlots, isLoading: false });
          syncToAdminLocalStorage(updatedPlots);
        }
      },

      updatePlotStatus: (id, status) => {
        set({
          plots: get().plots.map((plot) =>
            plot.id === id ? { ...plot, status } : plot,
          ),
        });
      },

      deletePlot: (id) => {
        set({ plots: get().plots.filter((plot) => plot.id !== id) });
      },

      resetLandStore: () => {
        set({ plots: [], isLoading: false });
      },
    }),
    {
      name: 'bhumicred_land_store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
